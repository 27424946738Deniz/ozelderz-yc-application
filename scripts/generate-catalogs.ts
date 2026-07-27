/**
 * Ders ve öğrenci liste sayfaları için önceden hesaplanmış kataloglar üretir.
 * Çıktı: data/lessons-catalog.json, data/students-catalog.json
 */
import { buildLessonsCatalog } from "../src/lib/build-lessons-catalog";
import { buildStudentsCatalog } from "../src/lib/build-students-catalog";
import { saveLessonsCatalog } from "../src/lib/lessons-catalog-store";
import { saveStudentsCatalog } from "../src/lib/students-catalog-store";

async function main() {
  console.log("Ders kataloğu üretiliyor…");
  const lessons = buildLessonsCatalog();
  saveLessonsCatalog(lessons);
  console.log(`  ✓ ${lessons.length} ders → data/lessons-catalog.json`);

  console.log("Öğrenci kataloğu üretiliyor…");
  const students = buildStudentsCatalog();
  saveStudentsCatalog(students);
  console.log(`  ✓ ${students.length} öğrenci → data/students-catalog.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
