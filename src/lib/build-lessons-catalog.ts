import { evaluateLesson } from "@/lib/lesson-evaluation";
import { inferLessonContext } from "@/lib/lesson-context";
import { buildLessonPreview } from "@/lib/lesson-insights-builder";
import {
  buildLessonCatalogItem,
  discoverLessonMetas,
  loadLessonTranscript,
} from "@/lib/lesson-registry";
import { analyzeTranscript } from "@/lib/transcript-analytics";
import type { LessonCatalogItem } from "@/types";

export function buildLessonsCatalog(): LessonCatalogItem[] {
  return discoverLessonMetas()
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
        preview,
        {
          teacherName: context.teacher.name,
          teacherTitle: context.teacher.title,
          teacherAvatar: context.teacher.avatar,
          studentName: context.student.name,
        }
      );
    })
    .sort((a, b) => (b.transcribedAt ?? "").localeCompare(a.transcribedAt ?? ""));
}
