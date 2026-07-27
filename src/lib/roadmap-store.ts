import fs from "fs";
import path from "path";
import type { LessonRoadmap } from "@/types/roadmap";

interface RoadmapIndex {
  version: number;
  roadmaps: Record<string, LessonRoadmap & { generatedAt: string }>;
}

const ROADMAP_PATH = path.join(process.cwd(), "data/roadmaps.json");

let cache: RoadmapIndex | null = null;

function loadIndex(): RoadmapIndex {
  if (cache) return cache;
  if (!fs.existsSync(ROADMAP_PATH)) {
    cache = { version: 1, roadmaps: {} };
    return cache;
  }
  cache = JSON.parse(fs.readFileSync(ROADMAP_PATH, "utf8")) as RoadmapIndex;
  return cache;
}

export function getStoredRoadmap(lessonId: string): LessonRoadmap | null {
  const entry = loadIndex().roadmaps[lessonId];
  if (!entry) return null;
  const { generatedAt: _, ...roadmap } = entry;
  return roadmap;
}

export function saveRoadmaps(roadmaps: Array<LessonRoadmap & { generatedAt?: string }>) {
  const existing = loadIndex();
  const index: RoadmapIndex = {
    version: 1,
    roadmaps: {
      ...existing.roadmaps,
      ...Object.fromEntries(
        roadmaps.map((r) => [
          r.lessonId,
          {
            ...r,
            generatedAt: r.generatedAt ?? new Date().toISOString(),
          },
        ])
      ),
    },
  };
  fs.writeFileSync(ROADMAP_PATH, JSON.stringify(index, null, 2));
  cache = index;
}
