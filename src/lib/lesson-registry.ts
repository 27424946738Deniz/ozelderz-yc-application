import fs from "fs";
import path from "path";
import type { LessonCatalogItem } from "@/types";
import type { TranscriptData } from "@/types/transcript";

const TRANSCRIPTS_DIR = path.join(process.cwd(), "data/transcripts");
const BATCH_PATH = path.join(process.cwd(), "data/r2-media-batch.json");

const CLOUDFLARE_WTY =
  "https://customer-1bg7og50siu2vqqq.cloudflarestream.com/b3fdefd7894e97b64445ecbcb52f6ae6/iframe?poster=https%3A%2F%2Fcustomer-1bg7og50siu2vqqq.cloudflarestream.com%2Fb3fdefd7894e97b64445ecbcb52f6ae6%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600";

export interface LessonMeta {
  id: string;
  meetCode: string;
  title: string;
  subject: string;
  transcriptFile: string;
  r2Key?: string;
  videoUrl?: string;
  videoType: "stream" | "mp4";
}

const TITLE_OVERRIDES: Record<string, { title: string; subject?: string }> = {
  "wty-msyi-khr": {
    title: "Tanışma Dersi — İnkılap Tarihi",
    subject: "İnkılap Tarihi ve Atatürkçülük",
  },
};

function loadR2Keys(): Record<string, string> {
  if (!fs.existsSync(BATCH_PATH)) return {};
  const batch = JSON.parse(fs.readFileSync(BATCH_PATH, "utf8")) as {
    lessons: Array<{ meetCode: string; key: string }>;
  };
  return Object.fromEntries(batch.lessons.map((l) => [l.meetCode, l.key]));
}

function isTranscriptCandidate(filename: string): boolean {
  if (!filename.endsWith(".json")) return false;
  if (filename === "index.json") return false;
  if (filename.includes("-raw")) return false;
  if (filename.includes("-diarization-raw")) return false;
  return true;
}

function lessonIdFromFilename(filename: string): string {
  return filename.replace(/-deepgram\.json$/, "").replace(/\.json$/, "");
}

function transcriptScore(filename: string): number {
  if (filename.endsWith("-deepgram.json")) return 3;
  return 1;
}

export function discoverLessonMetas(): LessonMeta[] {
  if (!fs.existsSync(TRANSCRIPTS_DIR)) return [];

  const r2Keys = loadR2Keys();
  const bestById = new Map<string, string>();

  for (const filename of fs.readdirSync(TRANSCRIPTS_DIR)) {
    if (!isTranscriptCandidate(filename)) continue;
    const id = lessonIdFromFilename(filename);
    const prev = bestById.get(id);
    if (!prev || transcriptScore(filename) > transcriptScore(prev)) {
      bestById.set(id, filename);
    }
  }

  return [...bestById.entries()]
    .map(([id, filename]) => {
      const override = TITLE_OVERRIDES[id];
      const r2Key = r2Keys[id];
      const isWty = id === "wty-msyi-khr";

      return {
        id,
        meetCode: id,
        title: override?.title ?? `Meet Kaydı — ${id}`,
        subject: override?.subject ?? "Ders kaydı",
        transcriptFile: path.join(TRANSCRIPTS_DIR, filename),
        r2Key,
        videoUrl: isWty ? CLOUDFLARE_WTY : undefined,
        videoType: isWty ? "stream" : "mp4",
      } satisfies LessonMeta;
    })
    .sort((a, b) => a.title.localeCompare(b.title, "tr"));
}

export function getLessonMeta(id: string): LessonMeta | null {
  return discoverLessonMetas().find((l) => l.id === id) ?? null;
}

export function loadLessonTranscript(meta: LessonMeta): TranscriptData {
  return JSON.parse(
    fs.readFileSync(meta.transcriptFile, "utf8")
  ) as TranscriptData;
}

export function buildLessonCatalogItem(
  meta: LessonMeta,
  transcript: TranscriptData,
  evaluationScore?: number,
  preview?: {
    summaryBrief: string;
    evaluationOverview: string;
    topStrength?: string;
    topWeakness?: string;
    questionCount: number;
    partCount: number;
    topTopics: string[];
    topSections: string[];
  }
): LessonCatalogItem {
  const speakerSplit: Record<string, number> = {};
  for (const w of transcript.words) {
    const sp = w.speaker ?? "?";
    speakerSplit[sp] = (speakerSplit[sp] ?? 0) + 1;
  }

  return {
    id: meta.id,
    meetCode: meta.meetCode,
    title: meta.title,
    subject: meta.subject,
    duration: transcript.duration,
    durationMin: Math.round(transcript.duration / 60),
    transcriptSource: transcript.source,
    segmentCount: transcript.segments.length,
    wordCount: transcript.words.length,
    speakers: transcript.speakers,
    speakerSplit,
    evaluationScore,
    hasVideo: Boolean(meta.videoUrl || meta.r2Key),
    videoType: meta.videoType,
    transcribedAt: transcript.generatedAt,
    r2Key: meta.r2Key,
    summaryBrief: preview?.summaryBrief,
    evaluationOverview: preview?.evaluationOverview,
    topStrength: preview?.topStrength,
    topWeakness: preview?.topWeakness,
    questionCount: preview?.questionCount,
    partCount: preview?.partCount,
    topTopics: preview?.topTopics,
    topSections: preview?.topSections,
  };
}

export function listLessonCatalog(
  scoreById?: Record<string, number>
): LessonCatalogItem[] {
  return discoverLessonMetas().map((meta) => {
    const transcript = loadLessonTranscript(meta);
    return buildLessonCatalogItem(meta, transcript, scoreById?.[meta.id]);
  });
}
