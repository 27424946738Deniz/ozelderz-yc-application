import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const ROOT = process.cwd();
const BATCH_PATH = path.join(ROOT, "data/r2-media-batch.json");
const OUT_DIR = path.join(ROOT, "data/transcripts");
const LOG_PATH = path.join(ROOT, "data/transcribe-batch.log");

type BatchEntry = {
  meetCode: string;
  key: string;
};

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, `${line}\n`, "utf8");
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed (${code})`));
    });
  });
}

async function transcribeLesson(meetCode: string, r2Key: string) {
  const outputPath = path.join(OUT_DIR, `${meetCode}.json`);
  const diarRawPath = path.join(OUT_DIR, `${meetCode}-diarization-raw.json`);

  if (fs.existsSync(outputPath)) {
    const existing = JSON.parse(fs.readFileSync(outputPath, "utf8")) as {
      source?: string;
      speakers?: string[];
    };
    if (
      existing.source?.includes("pyannote-diarization") &&
      (existing.speakers?.length ?? 0) >= 2
    ) {
      log(`Atlanıyor: ${meetCode} — tamamlanmış transkript var`);
      return;
    }
    log(`Yeniden işleniyor: ${meetCode} — eksik/hatalı transkript`);
    fs.unlinkSync(outputPath);
  }

  log(`1/2 WhisperX: ${meetCode}`);
  await run("npx", ["tsx", "scripts/transcribe.ts", r2Key, outputPath]);

  log(`2/2 Pyannote: ${meetCode}`);
  await run("npx", [
    "tsx",
    "scripts/diarize-only.ts",
    r2Key,
    outputPath,
    diarRawPath,
  ]);
}

async function main() {
  if (!fs.existsSync(BATCH_PATH)) {
    throw new Error(`Batch dosyası yok: ${BATCH_PATH}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(LOG_PATH, "", "utf8");

  const batch = JSON.parse(fs.readFileSync(BATCH_PATH, "utf8")) as {
    lessons: BatchEntry[];
  };

  const lessons = batch.lessons;
  log(`Toplam ${lessons.length} ders — wty akışı (WhisperX + ayrı Pyannote)`);

  for (let i = 0; i < lessons.length; i++) {
    const { meetCode, key } = lessons[i];
    log(`=== ${i + 1}/${lessons.length}: ${meetCode} ===`);
    await transcribeLesson(meetCode, key);
  }

  const manifestPath = path.join(OUT_DIR, "index.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pipeline: "whisperx + pause-diarization + pyannote",
        lessons: lessons.map(({ meetCode, key }) => ({
          meetCode,
          key,
          transcriptPath: `data/transcripts/${meetCode}.json`,
          exists: fs.existsSync(path.join(OUT_DIR, `${meetCode}.json`)),
        })),
      },
      null,
      2
    ),
    "utf8"
  );

  log(`Manifest: ${manifestPath}`);
  log("Batch transkripsiyon bitti.");
}

main().catch((err) => {
  log(`HATA: ${(err as Error).message}`);
  console.error(err);
  process.exit(1);
});
