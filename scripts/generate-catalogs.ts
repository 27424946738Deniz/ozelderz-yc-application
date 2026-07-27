/**
 * Liste sayfaları ve ders detay snapshot'ları için önceden hesaplanmış veri üretir.
 * Çıktı: lessons-catalog, students-catalog, teachers-catalog, lesson-snapshots/
 */
import fs from "fs";
import path from "path";
import { buildLessonById } from "../src/lib/build-lesson-from-transcript";
import { buildLessonsCatalog } from "../src/lib/build-lessons-catalog";
import { buildStudentsCatalog } from "../src/lib/build-students-catalog";
import { buildTeachersCatalog } from "../src/lib/build-teachers-catalog";
import { saveLessonSnapshots } from "../src/lib/lesson-snapshot-store";
import { saveLessonsCatalog } from "../src/lib/lessons-catalog-store";
import { discoverLessonMetas } from "../src/lib/lesson-registry";
import { saveStudentsCatalog } from "../src/lib/students-catalog-store";
import { saveTeachersCatalog } from "../src/lib/teachers-catalog-store";
import type { LessonData } from "../src/types";

const LEGACY_SNAPSHOT_FILE = path.join(
  process.cwd(),
  "data/lesson-snapshots.json"
);

async function main() {
  console.log("Ders kataloğu üretiliyor…");
  const lessons = buildLessonsCatalog();
  saveLessonsCatalog(lessons);
  console.log(`  ✓ ${lessons.length} ders → data/lessons-catalog.json`);

  console.log("Öğrenci kataloğu üretiliyor…");
  const students = buildStudentsCatalog();
  saveStudentsCatalog(students);
  console.log(`  ✓ ${students.length} öğrenci → data/students-catalog.json`);

  console.log("Hoca kataloğu üretiliyor…");
  const teachers = buildTeachersCatalog();
  saveTeachersCatalog(teachers);
  console.log(`  ✓ ${teachers.length} hoca → data/teachers-catalog.json`);

  console.log("Ders snapshot'ları üretiliyor…");
  const snapshots: Record<string, LessonData> = {};
  const metas = discoverLessonMetas();

  for (const meta of metas) {
    const lesson = await buildLessonById(meta.id);
    if (lesson) snapshots[meta.id] = lesson;
    process.stdout.write(`\r  … ${Object.keys(snapshots).length}/${metas.length}`);
  }

  saveLessonSnapshots(snapshots);
  console.log(
    `\n  ✓ ${Object.keys(snapshots).length} ders → data/lesson-snapshots/*.json`
  );

  if (fs.existsSync(LEGACY_SNAPSHOT_FILE)) {
    fs.unlinkSync(LEGACY_SNAPSHOT_FILE);
    console.log("  ✓ Eski data/lesson-snapshots.json silindi");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
