import { inferLessonContext } from "@/lib/lesson-context";
import {
  discoverLessonMetas,
  loadLessonTranscript,
} from "@/lib/lesson-registry";
import {
  profileContextFromLesson,
  studentProfileId,
  teacherProfileId,
} from "@/lib/profile-build-context";
import { buildStudentProfileFromTranscript } from "@/lib/student-profile-from-transcript";
import { buildTeacherProfileFromTranscript } from "@/lib/teacher-profile-from-transcript";
import type { StudentProfileDetail, TeacherProfileDetail } from "@/types";

export function buildAllStudentProfiles(): StudentProfileDetail[] {
  return discoverLessonMetas().map((meta) => {
    const transcript = loadLessonTranscript(meta);
    const lessonContext = inferLessonContext(transcript, meta);
    const profileContext = profileContextFromLesson(meta, lessonContext);
    return buildStudentProfileFromTranscript(transcript, profileContext);
  });
}

export function buildAllTeacherProfiles(): TeacherProfileDetail[] {
  return discoverLessonMetas().map((meta) => {
    const transcript = loadLessonTranscript(meta);
    const lessonContext = inferLessonContext(transcript, meta);
    const profileContext = profileContextFromLesson(meta, lessonContext);
    return buildTeacherProfileFromTranscript(transcript, profileContext);
  });
}

export function getStudentProfileByLessonId(
  lessonId: string
): StudentProfileDetail | null {
  return buildAllStudentProfiles().find((p) => p.lessonId === lessonId) ?? null;
}

export function getTeacherProfileByLessonId(
  lessonId: string
): TeacherProfileDetail | null {
  return buildAllTeacherProfiles().find((p) => p.lessonId === lessonId) ?? null;
}
