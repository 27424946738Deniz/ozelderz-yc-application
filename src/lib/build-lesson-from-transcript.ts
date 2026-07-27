import fs from "fs";
import path from "path";
import type { LessonData } from "@/types";
import type { TranscriptData } from "@/types/transcript";
import { analyzeTranscript } from "@/lib/transcript-analytics";
import { evaluateLesson } from "@/lib/lesson-evaluation";
import {
  buildActionItems,
  buildCompletedInsights,
  buildGrowthInsights,
  buildLessonSummary,
  buildStatusPills,
} from "@/lib/lesson-insights-builder";
import { inferLessonContext } from "@/lib/lesson-context";
import {
  getLessonMeta,
  loadLessonTranscript,
  type LessonMeta,
} from "@/lib/lesson-registry";

const DEFAULT_VIDEO_URL =
  "https://customer-1bg7og50siu2vqqq.cloudflarestream.com/b3fdefd7894e97b64445ecbcb52f6ae6/iframe?poster=https%3A%2F%2Fcustomer-1bg7og50siu2vqqq.cloudflarestream.com%2Fb3fdefd7894e97b64445ecbcb52f6ae6%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600";

const DEFAULT_POSTER =
  "https://customer-1bg7og50siu2vqqq.cloudflarestream.com/b3fdefd7894e97b64445ecbcb52f6ae6/thumbnails/thumbnail.jpg?time=&height=600";

export function loadTranscript(): TranscriptData {
  const meta = getLessonMeta("wty-msyi-khr");
  if (meta) return loadLessonTranscript(meta);
  const filePath = path.join(process.cwd(), "data/transcript.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as TranscriptData;
}

function buildLessonPayload(
  meta: LessonMeta,
  transcript: TranscriptData,
  videoUrl: string,
  videoType: "stream" | "mp4"
): LessonData & { heatmaps: ReturnType<typeof analyzeTranscript>["heatmaps"]; videoType: "stream" | "mp4" } {
  const context = inferLessonContext(transcript, meta);
  const analysis = analyzeTranscript(transcript);
  const lessonEvaluation = evaluateLesson(transcript, context.student, context);
  const summary = buildLessonSummary(transcript, context, analysis.partTitles);

  return {
    id: meta.id,
    title: context.title,
    subject: context.subject,
    duration: transcript.duration,
    teacher: context.teacher,
    student: context.student,
    videoUrl,
    videoType,
    posterUrl: DEFAULT_POSTER,
    statusPills: buildStatusPills(transcript, lessonEvaluation),
    metrics: analysis.metrics,
    speechTimeline: analysis.speechTimeline,
    attentionTimeline: [],
    summary,
    lessonEvaluation,
    actionItems: buildActionItems(
      lessonEvaluation,
      context.teacher.name,
      context.student.name
    ),
    completedInsights: buildCompletedInsights(
      transcript,
      summary.brief,
      analysis.partTitles,
      context.subject
    ),
    growthInsights: buildGrowthInsights(
      transcript,
      lessonEvaluation,
      analysis.metrics
    ),
    heatmaps: analysis.heatmaps,
  };
}

export async function buildLessonById(lessonId: string) {
  const meta = getLessonMeta(lessonId);
  if (!meta) return null;

  const transcript = loadLessonTranscript(meta);
  let videoUrl = meta.videoUrl ?? DEFAULT_VIDEO_URL;
  let videoType: "stream" | "mp4" = meta.videoUrl ? meta.videoType : "stream";

  if (!meta.videoUrl && meta.r2Key) {
    videoUrl = `/api/lessons/${lessonId}/video`;
    videoType = "mp4";
  } else if (!meta.videoUrl && !meta.r2Key) {
    videoType = "stream";
  }

  return buildLessonPayload(meta, transcript, videoUrl, videoType);
}

export function buildLessonFromTranscript(): LessonData & {
  heatmaps: ReturnType<typeof analyzeTranscript>["heatmaps"];
} {
  const meta = getLessonMeta("wty-msyi-khr");
  if (!meta) {
    const transcript = loadTranscript();
    const fallbackMeta: LessonMeta = {
      id: "wty-msyi-khr",
      meetCode: "wty-msyi-khr",
      title: "Tanışma Dersi — İnkılap Tarihi",
      subject: "İnkılap Tarihi ve Atatürkçülük",
      transcriptFile: "",
      videoUrl: DEFAULT_VIDEO_URL,
      videoType: "stream",
    };
    return buildLessonPayload(fallbackMeta, transcript, DEFAULT_VIDEO_URL, "stream");
  }

  const transcript = loadLessonTranscript(meta);
  return buildLessonPayload(
    meta,
    transcript,
    meta.videoUrl ?? DEFAULT_VIDEO_URL,
    meta.videoType
  );
}
