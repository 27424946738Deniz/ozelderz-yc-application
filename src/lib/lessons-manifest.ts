import fs from "fs";
import path from "path";

export interface LessonManifestEntry {
  meetCode: string;
  teacherName: string;
  studentName: string | null;
}

const MANIFEST_PATH = path.join(process.cwd(), "data/lessons-manifest.json");

let cache: Map<string, LessonManifestEntry> | null = null;

function loadManifestMap(): Map<string, LessonManifestEntry> {
  if (cache) return cache;
  if (!fs.existsSync(MANIFEST_PATH)) {
    cache = new Map();
    return cache;
  }
  const data = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as {
    lessons: LessonManifestEntry[];
  };
  cache = new Map(data.lessons.map((l) => [l.meetCode, l]));
  return cache;
}

export function getLessonManifestEntry(
  meetCode: string
): LessonManifestEntry | null {
  return loadManifestMap().get(meetCode) ?? null;
}
