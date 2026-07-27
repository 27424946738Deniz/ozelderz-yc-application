/**
 * Liste sayfaları ve ders detay snapshot'ları için önceden hesaplanmış veri üretir.
 * Çıktı: data/lessons-catalog.json, data/students-catalog.json, data/lesson-snapshots.json
 */
import { buildLessonById } from "../src/lib/build-lesson-from-transcript";
import { buildLessonsCatalog } from "../src/lib/build-lessons-catalog";
import { buildStudentsCatalog } from "../src/lib/build-students-catalog";
import { saveLessonSnapshots } from "../src/lib/lesson-snapshot-store";
import { saveLessonsCatalog } from "../src/lib/lessons-catalog-store";
import { discoverLessonMetas } from "../src/lib/lesson-registry";
import { saveStudentsCatalog } from "../src/lib/students-catalog-store";
import type { LessonData } from "../src/types";

async function main() {
  console.log("Ders kataloğu üretiliyor…");
  const lessons = buildLessonsCatalog();
  saveLessonsCatalog(lessons);
  console.log(`  ✓ ${lessons.length} ders → data/lessons-catalog.json`);

  console.log("Öğrenci kataloğu üretiliyor…");
  const students = buildStudentsCatalog();
  saveStudentsCatalog(students);
  console.log(`  ✓ ${students.length} öğrenci → data/students-catalog.json`);

  console.log("Ders snapshot'ları üretiliyor…");
  const snapshots: Record<string, LessonData> = {};
  const metas = discoverLessonMetas();

  for (const meta of metas) {
    const lesson = await buildLessonById(meta.id);
    if (lesson) snapshots[meta.id] = lesson;
    process.stdout.write(`\r  … ${Object.keys(snapshots).length}/${metas.length}`);
  }

  saveLessonSnapshots(snapshots);
  console.log(`\n  ✓ ${Object.keys(snapshots).length} ders → data/lesson-snapshots.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
