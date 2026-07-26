import fs from "fs";
import path from "path";
import Replicate from "replicate";
import OpenAI from "openai";
import { getPresignedMediaUrl, loadEnvFile } from "../lib/r2";
import {
  applyDiarizationToTranscript,
  normalizeDiarizationOutput,
} from "../lib/diarization";
import { readReplicateJsonOutput } from "../lib/replicate-output";

const ROOT = process.cwd();
const AUDIO_PATH = path.join(ROOT, "data/lesson-audio.mp3");
const OUTPUT_PATH = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(ROOT, "data/transcript.json");
const R2_KEY = process.argv[2] ?? process.env.LESSON_R2_KEY;
const DEFAULT_MEDIA_URL =
  "https://customer-1bg7og50siu2vqqq.cloudflarestream.com/b3fdefd7894e97b64445ecbcb52f6ae6/manifest/video.m3u8";

const WHISPERX =
  "victor-upmeet/whisperx:655845d6190ef70573c669245f245892cd039df4b880a1e3a65852c09252f5cc";
const WHISPERX_LARGE =
  "victor-upmeet/whisperx-a40-large:8241cd9a37b3090c97d6edf1ce137039e4d89999558cd4f2e647610156ddc41c";
const PYANNOTE_DIARIZATION =
  "meronym/speaker-diarization:64b78c82f74d78164b49178443c819445f5dca2c51c8ec374783d49382342119";

type Word = {
  word: string;
  start: number;
  end: number;
  speaker?: string;
};

type Segment = {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  words: Word[];
};

type TranscriptResult = {
  source: string;
  language?: string;
  duration: number;
  speakers: string[];
  segments: Segment[];
  words: Word[];
  generatedAt: string;
};

function loadEnv() {
  loadEnvFile();
}

function toSegmentArray(raw: unknown): Array<{
  start?: number;
  end?: number;
  text?: string;
  speaker?: string;
  words?: Array<{
    word?: string;
    start?: number;
    end?: number;
    speaker?: string;
  }>;
}> {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];

  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.segments)) return obj.segments as ReturnType<typeof toSegmentArray>;

  return Object.values(obj).filter(
    (value): value is NonNullable<ReturnType<typeof toSegmentArray>[number]> =>
      !!value &&
      typeof value === "object" &&
      ("start" in value || "text" in value || "words" in value)
  );
}

function normalizeWhisperXOutput(raw: unknown): TranscriptResult {
  const data = raw as {
    segments?: unknown;
    detected_language?: string;
    language?: string;
  };

  const segmentList = toSegmentArray(data.segments);
  const segments: Segment[] = segmentList.map((seg) => {
    const words: Word[] = (seg.words ?? []).map((w) => ({
      word: (w.word ?? "").trim(),
      start: Number(w.start ?? seg.start ?? 0),
      end: Number(w.end ?? seg.end ?? 0),
      speaker: w.speaker ?? seg.speaker,
    }));

    return {
      start: Number(seg.start ?? words[0]?.start ?? 0),
      end: Number(seg.end ?? words.at(-1)?.end ?? 0),
      text: (seg.text ?? words.map((w) => w.word).join(" ")).trim(),
      speaker: seg.speaker,
      words,
    };
  });

  const words = segments.flatMap((s) => s.words).filter((w) => w.word.length > 0);
  const speakers = [...new Set(words.map((w) => w.speaker).filter(Boolean))] as string[];

  return {
    source: "replicate-whisperx-diarized",
    language: data.detected_language ?? data.language,
    duration: segments.at(-1)?.end ?? words.at(-1)?.end ?? 0,
    speakers,
    segments,
    words,
    generatedAt: new Date().toISOString(),
  };
}

function getMediaUrl(): string {
  return process.env.LESSON_MEDIA_URL ?? DEFAULT_MEDIA_URL;
}

async function resolveMediaUrl(inputUrl: string): Promise<string> {
  if (!inputUrl.includes(".m3u8")) return inputUrl;

  console.log("Cloudflare medya linki çözümleniyor...");
  const response = await fetch(inputUrl);
  if (!response.ok) {
    throw new Error(`Medya linki alınamadı: ${response.status}`);
  }

  const manifest = await response.text();
  const base = inputUrl.slice(0, inputUrl.lastIndexOf("/") + 1);

  const streamLines = manifest.match(/^stream_.+\.m3u8$/gm);
  if (streamLines?.[0]) {
    return new URL(streamLines[0], base).toString();
  }

  const audioMatch = manifest.match(/TYPE=AUDIO[^\n]*URI="([^"]+)"/);
  if (audioMatch?.[1]) {
    return new URL(audioMatch[1], base).toString();
  }

  return inputUrl;
}

async function getWhisperInputUrl(replicate: Replicate): Promise<string> {
  const r2Key = R2_KEY;
  if (!r2Key) {
    throw new Error("R2 key gerekli: LESSON_R2_KEY veya argv[2]");
  }
  if (r2Key) {
    const url = await getPresignedMediaUrl(r2Key);
    console.log(`R2 medya URL (presigned): ${r2Key}`);
    return url;
  }

  const configuredUrl = getMediaUrl();

  if (!configuredUrl.includes(".m3u8")) {
    console.log(`Medya URL: ${configuredUrl}`);
    return configuredUrl;
  }

  const resolvedUrl = await resolveMediaUrl(configuredUrl);
  console.log(`Medya URL: ${resolvedUrl}`);
  return resolvedUrl;
}

async function uploadLocalAudio(replicate: Replicate): Promise<string> {
  if (!fs.existsSync(AUDIO_PATH)) {
    throw new Error(
      `Cloudflare linki Replicate'te decode edilemedi ve lokal dosya yok: ${AUDIO_PATH}`
    );
  }

  console.log("Cloudflare HLS başarısız — lokal ses dosyası Replicate'e yükleniyor...");
  const uploaded = await replicate.files.create(fs.readFileSync(AUDIO_PATH), {
    customer_reference_id: "lesson-audio",
  });
  const url = uploaded.urls.get;
  if (!url) throw new Error("Replicate dosya URL'si alınamadı");
  return url;
}

async function runWhisperX(
  replicate: Replicate,
  mediaUrl: string,
  withDiarization: boolean
) {
  console.log(`Medya URL: ${mediaUrl}`);
  console.log(
    withDiarization
      ? "Replicate WhisperX A40: kelime + konuşmacı ayrımı deneniyor..."
      : "Replicate WhisperX: kelime zaman damgası deneniyor..."
  );

  const model = withDiarization ? WHISPERX_LARGE : WHISPERX;

  const input: Record<string, unknown> = {
    audio_file: mediaUrl,
    align_output: true,
    diarization: withDiarization,
    language: "tr",
    batch_size: withDiarization ? 8 : 16,
  };

  if (withDiarization) {
    input.min_speakers = 2;
    input.max_speakers = 2;
    const hfToken = process.env.HUGGINGFACE_ACCESS_TOKEN;
    if (!hfToken) {
      throw new Error("HUGGINGFACE_ACCESS_TOKEN bulunamadı (.env.local)");
    }
    input.huggingface_access_token = hfToken;
  }

  return replicate.run(model, { input });
}

async function runOpenAIWhisper(openai: OpenAI) {
  console.log("OpenAI Whisper: kelime zaman damgası deneniyor...");

  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(AUDIO_PATH),
    model: "whisper-1",
    language: "tr",
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"],
  });

  const verbose = response as OpenAI.Audio.Transcriptions.Transcription & {
    words?: Array<{ word: string; start: number; end: number }>;
    segments?: Array<{ start: number; end: number; text: string }>;
  };

  const words: Word[] = (verbose.words ?? []).map((w) => ({
    word: w.word.trim(),
    start: w.start,
    end: w.end,
    speaker: undefined,
  }));

  const segments: Segment[] = (verbose.segments ?? []).map((seg) => {
    const segWords = words.filter(
      (w) => w.start >= seg.start - 0.05 && w.end <= seg.end + 0.05
    );
    return {
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
      speaker: undefined,
      words: segWords.length ? segWords : [],
    };
  });

  return {
    source: "openai-whisper-1",
    language: (verbose as { language?: string }).language,
    duration: segments.at(-1)?.end ?? words.at(-1)?.end ?? 0,
    speakers: [] as string[],
    segments,
    words,
    generatedAt: new Date().toISOString(),
  } satisfies TranscriptResult;
}

function assignSpeakersHeuristic(result: TranscriptResult): TranscriptResult {
  if (result.speakers.length > 0 || result.segments.length === 0) return result;

  console.log("Konuşmacı etiketi yok — duraklama tabanlı atama uygulanıyor...");

  let currentSpeaker = "SPEAKER_00";
  const segments = result.segments.map((seg, index) => {
    if (index > 0) {
      const prev = result.segments[index - 1];
      const gap = seg.start - prev.end;
      if (gap >= 1.2) {
        currentSpeaker =
          currentSpeaker === "SPEAKER_00" ? "SPEAKER_01" : "SPEAKER_00";
      }
    }

    return {
      ...seg,
      speaker: currentSpeaker,
      words: seg.words.map((w) => ({ ...w, speaker: currentSpeaker })),
    };
  });

  const words = segments.flatMap((s) => s.words);

  return {
    ...result,
    source: `${result.source}+pause-diarization`,
    speakers: ["SPEAKER_00", "SPEAKER_01"],
    segments,
    words,
  };
}

async function runPyannoteDiarization(
  replicate: Replicate,
  mediaUrl: string
): Promise<ReturnType<typeof normalizeDiarizationOutput>> {
  console.log("Pyannote diarization çalıştırılıyor (meronym/speaker-diarization)...");

  const output = await replicate.run(PYANNOTE_DIARIZATION, {
    input: { audio: mediaUrl },
  });

  const raw = await readReplicateJsonOutput(output);
  fs.writeFileSync(
    path.join(ROOT, "data/diarization-raw.json"),
    JSON.stringify(raw, null, 2),
    "utf8"
  );

  const diarization = normalizeDiarizationOutput(raw as Parameters<typeof normalizeDiarizationOutput>[0]);
  console.log(
    `Pyannote: ${diarization.segments.length} segment, ${diarization.speakers.length} konuşmacı`
  );
  return diarization;
}

async function enrichWithDiarization(
  replicate: Replicate,
  result: TranscriptResult,
  mediaUrl: string
): Promise<TranscriptResult> {
  if (result.speakers.length > 0) return result;

  // wty-msyi-khr akışı: önce pause-diarization, Pyannote ayrı adımda (npm run diarize)
  console.warn(
    "WhisperX konuşmacı etiketi döndürmedi — pause-diarization uygulanıyor (Pyannote için npm run diarize)..."
  );
  return assignSpeakersHeuristic(result);
}

async function main() {
  loadEnv();

  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN bulunamadı (.env.local)");
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  let result: TranscriptResult | null = null;
  let mediaUrl = await getWhisperInputUrl(replicate);

  try {
    const raw = await runWhisperX(replicate, mediaUrl, true);
    result = normalizeWhisperXOutput(raw);
    if (result.words.length === 0) throw new Error("WhisperX kelime döndürmedi");
    if (result.speakers.length === 0) {
      fs.writeFileSync(
        path.join(ROOT, "data/whisperx-raw.json"),
        JSON.stringify(raw, null, 2),
        "utf8"
      );
      console.warn("WhisperX konuşmacı etiketi döndürmedi — pause-diarization uygulanıyor...");
      result = await enrichWithDiarization(replicate, result, mediaUrl);
    }
  } catch (error) {
    console.warn("Diarization denemesi başarısız:", (error as Error).message);

    if (getMediaUrl().includes(".m3u8")) {
      try {
        mediaUrl = await uploadLocalAudio(replicate);
        const raw = await runWhisperX(replicate, mediaUrl, true);
        result = normalizeWhisperXOutput(raw);
        if (result.words.length === 0) throw new Error("WhisperX kelime döndürmedi");
        if (result.speakers.length === 0) {
          fs.writeFileSync(
            path.join(ROOT, "data/whisperx-raw.json"),
            JSON.stringify(raw, null, 2),
            "utf8"
          );
          console.warn("WhisperX konuşmacı etiketi döndürmedi — pause-diarization uygulanıyor...");
          result = await enrichWithDiarization(replicate, result, mediaUrl);
        }
      } catch (retryError) {
        console.warn("Lokal dosya ile diarization başarısız:", (retryError as Error).message);
      }
    }

    if (!result) try {
      const raw = await runWhisperX(replicate, mediaUrl, false);
      result = normalizeWhisperXOutput(raw);
      result = await enrichWithDiarization(replicate, result, mediaUrl);
    } catch (inner) {
      console.warn("WhisperX fallback başarısız:", (inner as Error).message);
    }
  }

  if (!result && process.env.OPENAI_API_KEY) {
    if (!fs.existsSync(AUDIO_PATH)) {
      throw new Error(
        "OpenAI fallback için lokal ses dosyası gerekli: data/lesson-audio.mp3"
      );
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    result = await runOpenAIWhisper(openai);
    result = assignSpeakersHeuristic(result);
  }

  if (!result || result.words.length === 0) {
    throw new Error("Transkript üretilemedi");
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), "utf8");

  console.log("\nTranskript hazır:");
  console.log(`- Kaynak: ${result.source}`);
  console.log(`- Konuşmacılar: ${result.speakers.join(", ") || "yok"}`);
  console.log(`- Segment: ${result.segments.length}`);
  console.log(`- Kelime: ${result.words.length}`);
  console.log(`- Dosya: ${OUTPUT_PATH}`);
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
