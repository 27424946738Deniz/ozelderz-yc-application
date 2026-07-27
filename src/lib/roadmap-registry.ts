import { inferLessonContext } from "@/lib/lesson-context";
import {
  discoverLessonMetas,
  getLessonMeta,
  loadLessonTranscript,
} from "@/lib/lesson-registry";
import { buildLessonRoadmap } from "@/lib/roadmap-generator";
import { getStoredRoadmap } from "@/lib/roadmap-store";
import type { LessonRoadmap, RoadmapCatalogItem } from "@/types/roadmap";

const cache = new Map<string, LessonRoadmap>();

export function getRoadmap(lessonId: string): LessonRoadmap | null {
  if (cache.has(lessonId)) return cache.get(lessonId)!;

  const stored = getStoredRoadmap(lessonId);
  if (stored) {
    cache.set(lessonId, stored);
    return stored;
  }

  const meta = getLessonMeta(lessonId);
  if (!meta) return null;

  const transcript = loadLessonTranscript(meta);
  const context = inferLessonContext(transcript, meta);
  const roadmap = buildLessonRoadmap(meta, transcript, context);

  cache.set(lessonId, roadmap);
  return roadmap;
}

export function listRoadmaps(): RoadmapCatalogItem[] {
  return discoverLessonMetas()
    .map((meta) => {
      const roadmap = getRoadmap(meta.id);
      if (!roadmap) return null;
      return {
        lessonId: roadmap.lessonId,
        title: roadmap.title,
        subject: roadmap.subject,
        teacherName: roadmap.teacher.name,
        studentName: roadmap.student.name,
        phaseCount: roadmap.phases.length,
        checkpointCount: roadmap.phases.reduce(
          (n, p) => n + p.checkpoints.length,
          0
        ),
      } satisfies RoadmapCatalogItem;
    })
    .filter((r): r is RoadmapCatalogItem => r !== null)
    .sort((a, b) => a.title.localeCompare(b.title, "tr"));
}
