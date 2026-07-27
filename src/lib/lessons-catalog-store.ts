import fs from "fs";
import path from "path";
import type { LessonCatalogItem } from "@/types";

const CATALOG_PATH = path.join(process.cwd(), "data/lessons-catalog.json");

interface LessonsCatalogIndex {
  version: number;
  generatedAt: string;
  lessons: LessonCatalogItem[];
}

let cache: LessonsCatalogIndex | null = null;

function loadIndex(): LessonsCatalogIndex | null {
  if (cache) return cache;
  if (!fs.existsSync(CATALOG_PATH)) return null;
  cache = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8")) as LessonsCatalogIndex;
  return cache;
}

export function getLessonsCatalog(): LessonCatalogItem[] | null {
  return loadIndex()?.lessons ?? null;
}

export function saveLessonsCatalog(lessons: LessonCatalogItem[]) {
  const index: LessonsCatalogIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    lessons,
  };
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(index, null, 2));
  cache = index;
}
