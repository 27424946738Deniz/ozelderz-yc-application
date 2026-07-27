import fs from "fs";
import path from "path";
import type { TeacherCatalogItem } from "@/types";

const CATALOG_PATH = path.join(process.cwd(), "data/teachers-catalog.json");

interface TeachersCatalogIndex {
  version: number;
  generatedAt: string;
  teachers: TeacherCatalogItem[];
}

let cache: TeachersCatalogIndex | null = null;

function loadIndex(): TeachersCatalogIndex | null {
  if (cache) return cache;
  if (!fs.existsSync(CATALOG_PATH)) return null;
  cache = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8")) as TeachersCatalogIndex;
  return cache;
}

export function getTeachersCatalog(): TeacherCatalogItem[] | null {
  return loadIndex()?.teachers ?? null;
}

export function saveTeachersCatalog(teachers: TeacherCatalogItem[]) {
  const index: TeachersCatalogIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    teachers,
  };
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(index, null, 2));
  cache = index;
}
