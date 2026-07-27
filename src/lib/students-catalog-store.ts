import fs from "fs";
import path from "path";
import type { StudentCatalogItem } from "@/types";

const CATALOG_PATH = path.join(process.cwd(), "data/students-catalog.json");

interface StudentsCatalogIndex {
  version: number;
  generatedAt: string;
  students: StudentCatalogItem[];
}

let cache: StudentsCatalogIndex | null = null;

function loadIndex(): StudentsCatalogIndex | null {
  if (cache) return cache;
  if (!fs.existsSync(CATALOG_PATH)) return null;
  cache = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8")) as StudentsCatalogIndex;
  return cache;
}

export function getStudentsCatalog(): StudentCatalogItem[] | null {
  return loadIndex()?.students ?? null;
}

export function saveStudentsCatalog(students: StudentCatalogItem[]) {
  const index: StudentsCatalogIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    students,
  };
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(index, null, 2));
  cache = index;
}
