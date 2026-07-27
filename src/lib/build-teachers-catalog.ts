import { buildAllTeacherProfiles } from "@/lib/profile-registry";
import type { TeacherCatalogItem } from "@/types";

export function buildTeachersCatalog(): TeacherCatalogItem[] {
  return buildAllTeacherProfiles()
    .map((teacher) => ({
      id: teacher.id,
      lessonId: teacher.lessonId ?? teacher.id.replace(/^teacher-/, ""),
      name: teacher.name,
      title: teacher.title,
      subject: teacher.subject,
      teachingScore: teacher.teachingScore,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}
