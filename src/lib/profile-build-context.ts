import type { LessonContext } from "@/lib/lesson-context";
import type { LessonMeta } from "@/lib/lesson-registry";

export interface ProfileBuildContext {
  lessonId: string;
  subject: string;
  lessonTitle: string;
  lessonType: LessonContext["lessonType"];
  studentName: string;
  studentGrade: string;
  teacherName: string;
  teacherTitle: string;
  studentAvatar: string;
  teacherAvatar: string;
}

export function profileContextFromLesson(
  meta: LessonMeta,
  lessonContext: LessonContext
): ProfileBuildContext {
  const studentSlug = lessonContext.student.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const teacherSlug = lessonContext.teacher.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return {
    lessonId: meta.id,
    subject: lessonContext.subject,
    lessonTitle: lessonContext.title,
    lessonType: lessonContext.lessonType,
    studentName: lessonContext.student.name,
    studentGrade: lessonContext.student.grade,
    teacherName: lessonContext.teacher.name,
    teacherTitle: lessonContext.teacher.title,
    studentAvatar: lessonContext.student.avatar,
    teacherAvatar: lessonContext.teacher.avatar,
    studentSlug,
    teacherSlug,
  } as ProfileBuildContext & { studentSlug: string; teacherSlug: string };
}

export function studentProfileId(ctx: ProfileBuildContext) {
  return `student-${ctx.lessonId}`;
}

export function teacherProfileId(ctx: ProfileBuildContext) {
  return `teacher-${ctx.lessonId}`;
}

export function isMathSubject(subject: string) {
  return subject.includes("Matematik");
}

export function isHistorySubject(subject: string) {
  return subject.includes("İnkılap");
}
