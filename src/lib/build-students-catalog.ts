import { buildAllStudentProfiles } from "@/lib/profile-registry";
import type { StudentCatalogItem } from "@/types";

export function buildStudentsCatalog(): StudentCatalogItem[] {
  return buildAllStudentProfiles()
    .map((student) => ({
      id: student.id,
      lessonId: student.lessonId ?? student.id.replace(/^student-/, ""),
      name: student.name,
      avatar: student.avatar,
      grade: student.grade,
      school: student.school,
      comprehensionScore: student.comprehensionScore,
      lessonsSummary: {
        subjects: student.lessonsSummary.subjects,
        lastLessonTitle: student.lessonsSummary.lastLessonTitle,
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}
