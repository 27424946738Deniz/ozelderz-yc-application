import type { LessonRoadmap, RoadmapCatalogItem } from "@/types/roadmap";
import { cqiRoadmap } from "@/lib/roadmap/cqi-brqh-evi-roadmap";
import { wtyRoadmap } from "@/lib/roadmap/wty-msyi-khr-roadmap";

const roadmaps: Record<string, LessonRoadmap> = {
  "wty-msyi-khr": wtyRoadmap,
  "cqi-brqh-evi": cqiRoadmap,
};

export function getRoadmap(lessonId: string): LessonRoadmap | null {
  return roadmaps[lessonId] ?? null;
}

export function listRoadmaps(): RoadmapCatalogItem[] {
  return Object.values(roadmaps).map((r) => ({
    lessonId: r.lessonId,
    title: r.title,
    subject: r.subject,
    teacherName: r.teacher.name,
    studentName: r.student.name,
    phaseCount: r.phases.length,
    checkpointCount: r.phases.reduce((n, p) => n + p.checkpoints.length, 0),
  }));
}
