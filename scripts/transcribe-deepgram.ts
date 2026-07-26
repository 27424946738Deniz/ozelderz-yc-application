import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { loadEnvFile, getPresignedMediaUrl } from "../lib/r2";
import { normalizeDeepgramResponse } from "../lib/deepgram-transcript";

const ROOT = process.cwd();
const INPUT = process.argv[2] ?? process.env.LESSON_R2_KEY;
const OUTPUT = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(ROOT, "data/transcript.json");
const RAW_OUTPUT = process.argv[4]
  ? path.resolve(process.argv[4])
  : OUTPUT.replace(/\.json$/, "-deepgram-raw.json");

const DEEPGRAM_MODEL = process.env.DEEPGRAM_MODEL ?? "nova-3";
const DEEPGRAM_LANGUAGE = process.env.DEEPGRAM_LANGUAGE ?? "tr";

function resolveLocalVideo(input: string): string | null {
  if (input.startsWith("lessons/")) {
    const batchPath = path.join(ROOT, "data/r2-media-batch.json");
    if (fs.existsSync(batchPath)) {
      const batch = JSON.parse(fs.readFileSync(batchPath, "utf8")) as {
        lessons: Array<{ meetCode: string; key: string; localPath: string }>;
      };
      const meetCode = input.replace("lessons/", "").replace(".mp4", "");
      const hit =
        batch.lessons.find((l) => l.key === input) ??
        batch.lessons.find((l) => l.meetCode === meetCode);
      if (hit?.localPath && fs.existsSync(hit.localPath)) return hit.localPath;
    }
    if (process.env.LESSON_R2_KEY === input) {
      const fallback =
        "/Users/bourbaki/Downloads/wty-msyi-khr (2026-07-23 07_52 GMT).mp4";
      if (fs.existsSync(fallback)) return fallback;
    }
  }

  if (fs.existsSync(input)) return path.resolve(input);
  return null;
}

function extractAudioMp3(videoPath: string): string {
  const outDir = path.join(ROOT, "data/audio-cache");
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.basename(videoPath, path.extname(videoPath));
  const outPath = path.join(outDir, `${base}.mp3`);

  if (fs.existsSync(outPath)) {
    const videoMtime = fs.statSync(videoPath).mtimeMs;
    const audioMtime = fs.statSync(outPath).mtimeMs;
    if (audioMtime >= videoMtime) {
      console.log(`Önbellek ses kullanılıyor: ${outPath}`);
      return outPath;
    }
  }

  console.log("ffmpeg ile ses çıkarılıyor...");
  const t0 = Date.now();
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      videoPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-b:a",
      "64k",
      outPath,
    ],
    { stdio: "inherit" }
  );
  const sizeMb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`Ses hazır: ${outPath} (${sizeMb} MB, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return outPath;
}

async function transcribeBuffer(
  apiKey: string,
  audio: Buffer,
  contentType: string
) {
  const params = new URLSearchParams({
    model: DEEPGRAM_MODEL,
    language: DEEPGRAM_LANGUAGE,
    diarize: "true",
    utterances: "true",
    punctuate: "true",
    smart_format: "true",
  });

  const url = `https://api.deepgram.com/v1/listen?${params.toString()}`;
  console.log(`Deepgram isteği: model=${DEEPGRAM_MODEL}, lang=${DEEPGRAM_LANGUAGE}`);

  const t0 = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": contentType,
    },
    body: new Uint8Array(audio),
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Deepgram hata ${response.status} (${elapsed}s): ${text.slice(0, 500)}`);
  }

  console.log(`Deepgram yanıtı: ${elapsed}s`);
  return JSON.parse(text) as Parameters<typeof normalizeDeepgramResponse>[0];
}

async function transcribeFromUrl(apiKey: string, mediaUrl: string) {
  const params = new URLSearchParams({
    model: DEEPGRAM_MODEL,
    language: DEEPGRAM_LANGUAGE,
    diarize: "true",
    utterances: "true",
    punctuate: "true",
    smart_format: "true",
    url: mediaUrl,
  });

  const url = `https://api.deepgram.com/v1/listen?${params.toString()}`;
  console.log("Deepgram URL modu (R2 presigned)...");

  const t0 = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Deepgram URL hata ${response.status} (${elapsed}s): ${text.slice(0, 500)}`);
  }

  console.log(`Deepgram yanıtı: ${elapsed}s`);
  return JSON.parse(text) as Parameters<typeof normalizeDeepgramResponse>[0];
}

async function main() {
  loadEnvFile();

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY eksik (.env.local)");
  }
  if (!INPUT) {
    throw new Error("Kullanım: npm run transcribe:deepgram -- [r2-key|video-path] [output.json]");
  }

  const tStart = Date.now();
  let raw: Parameters<typeof normalizeDeepgramResponse>[0];

  const localVideo = resolveLocalVideo(INPUT);
  if (localVideo) {
    console.log(`Kaynak (lokal): ${localVideo}`);
    const audioPath = extractAudioMp3(localVideo);
    const buffer = fs.readFileSync(audioPath);
    raw = await transcribeBuffer(apiKey, buffer, "audio/mpeg");
  } else if (INPUT.startsWith("lessons/")) {
    const mediaUrl = await getPresignedMediaUrl(INPUT);
    console.log(`Kaynak (R2): ${INPUT}`);
    try {
      raw = await transcribeFromUrl(apiKey, mediaUrl);
    } catch (urlError) {
      console.warn("URL modu başarısız, lokal dosya gerekli:", (urlError as Error).message);
      throw urlError;
    }
  } else {
    throw new Error(`Dosya bulunamadı: ${INPUT}`);
  }

  fs.mkdirSync(path.dirname(RAW_OUTPUT), { recursive: true });
  fs.writeFileSync(RAW_OUTPUT, JSON.stringify(raw, null, 2), "utf8");

  const result = normalizeDeepgramResponse(raw, DEEPGRAM_LANGUAGE);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2), "utf8");

  const speakerCounts: Record<string, number> = {};
  for (const w of result.words) {
    const sp = w.speaker ?? "?";
    speakerCounts[sp] = (speakerCounts[sp] ?? 0) + 1;
  }

  console.log("\nTranskript hazır (Deepgram):");
  console.log(`- Kaynak: ${result.source}`);
  console.log(`- Konuşmacılar: ${result.speakers.join(", ") || "yok"}`);
  console.log(`- Dağılım: ${JSON.stringify(speakerCounts)}`);
  console.log(`- Segment: ${result.segments.length}`);
  console.log(`- Kelime: ${result.words.length}`);
  console.log(`- Süre: ${Math.round(result.duration / 60)} dk`);
  console.log(`- Dosya: ${OUTPUT}`);
  console.log(`- Ham yanıt: ${RAW_OUTPUT}`);
  console.log(`- Toplam süre: ${((Date.now() - tStart) / 1000).toFixed(1)}s`);

  console.log("\nİlk 5 kelime:");
  for (const w of result.words.slice(0, 5)) {
    console.log(
      `  [${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.speaker ?? "?"}: ${w.word}`
    );
  }
}

main().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
