import fs from "fs";
import path from "path";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ROOT = process.cwd();

export function loadEnvFile() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx);
    const value = trimmed.slice(idx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

export function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials eksik (.env.local)");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function getR2Bucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME eksik (.env.local)");
  return bucket;
}

export async function uploadFileToR2(
  localPath: string,
  objectKey: string
): Promise<{ bucket: string; key: string; size: number }> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  const stat = fs.statSync(localPath);

  console.log(`R2'ye yükleniyor: ${objectKey} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);

  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: objectKey,
      Body: fs.createReadStream(localPath),
      ContentType: "video/mp4",
    },
    queueSize: 4,
    partSize: 10 * 1024 * 1024,
    leavePartsOnError: false,
  });

  upload.on("httpUploadProgress", (progress) => {
    if (progress.loaded && progress.total) {
      const pct = ((progress.loaded / progress.total) * 100).toFixed(1);
      process.stdout.write(`\r  İlerleme: ${pct}%`);
    }
  });

  await upload.done();
  process.stdout.write("\n");

  return { bucket, key: objectKey, size: stat.size };
}

export async function deleteR2CacheFiles(meetCode: string) {
  const videoPath = path.join(ROOT, "data/video-cache", `${meetCode}.mp4`);
  const audioPath = path.join(ROOT, "data/audio-cache", `${meetCode}.mp3`);
  for (const p of [videoPath, audioPath]) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

export async function objectExists(objectKey: string): Promise<boolean> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
    return true;
  } catch {
    return false;
  }
}

export async function getPresignedMediaUrl(
  objectKey: string,
  expiresInSeconds = 60 * 60 * 24
): Promise<string> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
    { expiresIn: expiresInSeconds }
  );
}

let corsConfigured = false;

export async function ensureR2VideoCors() {
  if (corsConfigured) return;

  const client = getR2Client();
  const bucket = getR2Bucket();

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ["*"],
            AllowedMethods: ["GET", "HEAD"],
            AllowedHeaders: ["*"],
            ExposeHeaders: [
              "Content-Length",
              "Content-Range",
              "Accept-Ranges",
              "ETag",
            ],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    })
  );

  corsConfigured = true;
}

function parseByteRange(
  rangeHeader: string | null,
  totalSize: number,
  maxChunkSize: number
): { start: number; end: number; partial: boolean } {
  let start = 0;
  let end = totalSize - 1;
  let partial = false;

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      start = Number.parseInt(match[1], 10);
      end = match[2] ? Number.parseInt(match[2], 10) : totalSize - 1;
      partial = true;
    }
  }

  if (!Number.isFinite(start) || start < 0) start = 0;
  if (!Number.isFinite(end) || end >= totalSize) end = totalSize - 1;
  if (end < start) end = start;

  if (end - start + 1 > maxChunkSize) {
    end = start + maxChunkSize - 1;
    partial = true;
  }

  return { start, end, partial };
}

export async function headMediaFromR2(
  objectKey: string
): Promise<Record<string, string>> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  const head = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: objectKey })
  );
  const totalSize = head.ContentLength ?? 0;
  if (totalSize === 0) {
    throw new Error(`R2 object empty: ${objectKey}`);
  }

  return {
    "Content-Type": head.ContentType ?? "video/mp4",
    "Accept-Ranges": "bytes",
    "Content-Length": String(totalSize),
    "Cache-Control": "private, max-age=3600",
  };
}

export async function readMediaChunkFromR2(
  objectKey: string,
  rangeHeader: string | null,
  maxChunkSize = 4 * 1024 * 1024
): Promise<{
  body: Uint8Array;
  status: number;
  headers: Record<string, string>;
}> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  const head = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: objectKey })
  );
  const totalSize = head.ContentLength ?? 0;
  if (totalSize === 0) {
    throw new Error(`R2 object empty: ${objectKey}`);
  }

  const { start, end, partial } = parseByteRange(
    rangeHeader,
    totalSize,
    maxChunkSize
  );
  const chunkSize = end - start + 1;

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Range: `bytes=${start}-${end}`,
    })
  );

  if (!response.Body) {
    throw new Error(`R2 stream başarısız: ${objectKey}`);
  }

  const body = await response.Body.transformToByteArray();
  const status = partial || rangeHeader ? 206 : 200;
  const headers: Record<string, string> = {
    "Content-Type": head.ContentType ?? "video/mp4",
    "Accept-Ranges": "bytes",
    "Content-Length": String(chunkSize),
    "Cache-Control": "private, max-age=3600",
  };

  if (status === 206) {
    headers["Content-Range"] = `bytes ${start}-${end}/${totalSize}`;
  }

  return { body, status, headers };
}

/** @deprecated Use readMediaChunkFromR2 */
export async function streamMediaFromR2(
  objectKey: string,
  rangeHeader: string | null,
  maxChunkSize = 4 * 1024 * 1024
) {
  const result = await readMediaChunkFromR2(objectKey, rangeHeader, maxChunkSize);
  return {
    body: result.body,
    status: result.status,
    headers: result.headers,
  };
}

export async function getMediaRedirectUrl(objectKey: string): Promise<string> {
  try {
    await ensureR2VideoCors();
  } catch (error) {
    console.warn("R2 CORS setup skipped:", error);
  }
  return getPresignedMediaUrl(objectKey, 60 * 60 * 6);
}

export async function downloadFromR2(
  objectKey: string,
  localPath: string
): Promise<void> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  fs.mkdirSync(path.dirname(localPath), { recursive: true });

  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: objectKey })
  );
  const body = response.Body;
  if (!body) throw new Error(`R2 indirme başarısız: ${objectKey}`);

  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  fs.writeFileSync(localPath, Buffer.concat(chunks));
}
