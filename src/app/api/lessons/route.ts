import { NextResponse } from "next/server";
import { evaluateLesson } from "@/lib/lesson-evaluation";
import { buildLessonPreview } from "@/lib/lesson-insights-builder";
import { inferLessonContext } from "@/lib/lesson-context";
import { analyzeTranscript } from "@/lib/transcript-analytics";
import {
  buildLessonCatalogItem,
  discoverLessonMetas,
  loadLessonTranscript,
} from "@/lib/lesson-registry";

export async function GET() {
  const lessons = discoverLessonMetas()
    .map((meta) => {
      const transcript = loadLessonTranscript(meta);
      const context = inferLessonContext(transcript, meta);
      const analysis = analyzeTranscript(transcript);
      const evaluation = evaluateLesson(transcript, context.student, context);
      const preview = buildLessonPreview(
        context,
        transcript,
        evaluation,
        analysis.partTitles,
        analysis.parts
      );
      return buildLessonCatalogItem(
        { ...meta, title: context.title, subject: context.subject },
        transcript,
        evaluation.score,
        preview
      );
    })
    .sort((a, b) => (b.transcribedAt ?? "").localeCompare(a.transcribedAt ?? ""));

  return NextResponse.json(lessons);
}
