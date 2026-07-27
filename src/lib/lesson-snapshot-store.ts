import fs from "fs";
import path from "path";
import type { LessonData } from "@/types";

const SNAPSHOT_PATH = path.join(process.cwd(), "data/lesson-snapshots.json");

interface LessonSnapshotIndex {
  version: number;
  generatedAt: string;
  lessons: Record<string, LessonData>;
}

let cache: LessonSnapshotIndex | null = null;

function loadIndex(): LessonSnapshotIndex | null {
  if (cache) return cache;
  if (!fs.existsSync(SNAPSHOT_PATH)) return null;
  cache = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8")) as LessonSnapshotIndex;
  return cache;
}

export function getLessonSnapshot(lessonId: string): LessonData | null {
  return loadIndex()?.lessons[lessonId] ?? null;
}

export function saveLessonSnapshots(lessons: Record<string, LessonData>) {
  const index: LessonSnapshotIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    lessons,
  };
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(index));
  cache = index;
}
