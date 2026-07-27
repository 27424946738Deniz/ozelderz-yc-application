import fs from "fs";
import path from "path";
import type { LessonData } from "@/types";

const SNAPSHOT_DIR = path.join(process.cwd(), "data/lesson-snapshots");

export function getLessonSnapshot(lessonId: string): LessonData | null {
  const filePath = path.join(SNAPSHOT_DIR, `${lessonId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as LessonData;
}

export function saveLessonSnapshots(lessons: Record<string, LessonData>) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  for (const file of fs.readdirSync(SNAPSHOT_DIR)) {
    if (file.endsWith(".json")) {
      fs.unlinkSync(path.join(SNAPSHOT_DIR, file));
    }
  }

  for (const [id, lesson] of Object.entries(lessons)) {
    fs.writeFileSync(
      path.join(SNAPSHOT_DIR, `${id}.json`),
      JSON.stringify(lesson)
    );
  }
}
