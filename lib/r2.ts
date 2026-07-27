import fs from "fs";
import path from "path";
import {
  GetObjectCommand,
  HeadObjectCommand,
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

export async function streamMediaFromR2(
  objectKey: string,
  rangeHeader: string | null
): Promise<{
  body: ReadableStream<Uint8Array>;
  status: number;
  headers: Record<string, string>;
}> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Range: rangeHeader ?? undefined,
    })
  );

  if (!response.Body) {
    throw new Error(`R2 stream başarısız: ${objectKey}`);
  }

  const headers: Record<string, string> = {
    "Content-Type": response.ContentType ?? "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  };

  if (response.ContentLength !== undefined) {
    headers["Content-Length"] = String(response.ContentLength);
  }
  if (response.ContentRange) {
    headers["Content-Range"] = response.ContentRange;
  }

  const sdkBody = response.Body as {
    transformToWebStream?: () => ReadableStream<Uint8Array>;
  };

  const body =
    typeof sdkBody.transformToWebStream === "function"
      ? sdkBody.transformToWebStream()
      : (response.Body as unknown as ReadableStream<Uint8Array>);

  return {
    body,
    status: rangeHeader ? 206 : 200,
    headers,
  };
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
