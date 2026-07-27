import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { loadEnvFile, getR2Client, getR2Bucket } from "../lib/r2";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data/transcripts");
const LOG_PATH = path.join(ROOT, "data/transcribe-deepgram-batch.log");
const CONCURRENCY = Number(process.env.TRANSCRIBE_CONCURRENCY ?? process.argv[2] ?? 10);

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, `${line}\n`, "utf8");
}

function runTranscribe(r2Key: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const rawPath = outputPath.replace(/\.json$/, "-deepgram-raw.json");
    const child = spawn(
      "npx",
      ["tsx", "scripts/transcribe-deepgram.ts", r2Key, outputPath, rawPath],
      { cwd: ROOT, stdio: "inherit", env: process.env }
    );
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`transcribe-deepgram failed (${code})`));
    });
  });
}

async function listBucketVideos(): Promise<string[]> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  const list = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: "lessons/" })
  );
  return (list.Contents ?? [])
    .filter((o) => o.Key?.endsWith(".mp4"))
    .map((o) => o.Key!.replace("lessons/", "").replace(".mp4", ""))
    .sort();
}

function hasDeepgramTranscript(meetCode: string): boolean {
  return fs.existsSync(path.join(OUT_DIR, `${meetCode}-deepgram.json`));
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
) {
  let next = 0;
  async function runOne() {
    while (next < items.length) {
      const index = next++;
      await worker(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runOne())
  );
}

async function transcribeLesson(
  meetCode: string,
  index: number,
  total: number
): Promise<{ meetCode: string; status: "ok" | "skipped" | "error"; error?: string }> {
  const r2Key = `lessons/${meetCode}.mp4`;
  const outputPath = path.join(OUT_DIR, `${meetCode}-deepgram.json`);

  log(`=== ${index + 1}/${total}: ${meetCode} ===`);

  if (hasDeepgramTranscript(meetCode)) {
    log(`Atlanıyor: ${meetCode} — zaten var`);
    return { meetCode, status: "skipped" };
  }

  try {
    await runTranscribe(r2Key, outputPath);
    log(`Tamam: ${meetCode}`);
    return { meetCode, status: "ok" };
  } catch (err) {
    const message = (err as Error).message;
    log(`HATA: ${meetCode} — ${message}`);
    return { meetCode, status: "error", error: message };
  }
}

async function validateDeepgramApiKey(apiKey: string) {
  const audioPath = path.join(ROOT, "data/lesson-audio.mp3");
  if (!fs.existsSync(audioPath)) return;

  const sample = fs.readFileSync(audioPath).subarray(0, 200_000);
  const params = new URLSearchParams({
    model: process.env.DEEPGRAM_MODEL ?? "nova-3",
    language: process.env.DEEPGRAM_LANGUAGE ?? "tr",
  });
  const response = await fetch(
    `https://api.deepgram.com/v1/listen?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "audio/mpeg",
      },
      body: sample,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Deepgram API anahtarı geçersiz (${response.status}): ${text.slice(0, 200)}`
    );
  }
}

async function main() {
  loadEnvFile();

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY eksik (.env.local)");
  }

  log("Deepgram API anahtarı doğrulanıyor...");
  await validateDeepgramApiKey(apiKey);
  log("API anahtarı geçerli.");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(LOG_PATH, "", "utf8");

  const all = await listBucketVideos();
  const pending = all.filter((meetCode) => !hasDeepgramTranscript(meetCode));
  const done = all.length - pending.length;

  log(`Bucket: ${all.length} video, tamamlanan: ${done}, bekleyen: ${pending.length}`);
  log(`Paralellik: ${CONCURRENCY}`);

  if (pending.length === 0) {
    log("Yeni transkript gerekmiyor.");
    return;
  }

  const results: Array<{
    meetCode: string;
    status: "ok" | "skipped" | "error";
    error?: string;
  }> = [];

  await runPool(pending, CONCURRENCY, async (meetCode, i) => {
    const result = await transcribeLesson(meetCode, i, pending.length);
    results.push(result);
  });

  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error");

  log(`\nÖzet: ${ok} tamam, ${skipped} atlandı, ${errors.length} hata`);
  if (errors.length) {
    for (const e of errors) {
      log(`  - ${e.meetCode}: ${e.error}`);
    }
  }

  const manifestPath = path.join(OUT_DIR, "deepgram-index.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pipeline: "deepgram-nova-3+diarize",
        total: all.length,
        completed: all.filter(hasDeepgramTranscript).map((meetCode) => ({
          meetCode,
          transcriptPath: `data/transcripts/${meetCode}-deepgram.json`,
        })),
        lastRun: results,
      },
      null,
      2
    ),
    "utf8"
  );
  log(`Manifest: ${manifestPath}`);
}

main().catch((err) => {
  log(`FATAL: ${(err as Error).message}`);
  console.error(err);
  process.exit(1);
});
