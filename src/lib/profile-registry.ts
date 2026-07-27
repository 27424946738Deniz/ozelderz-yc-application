import { inferLessonContext } from "@/lib/lesson-context";
import {
  discoverLessonMetas,
  getLessonMeta,
  loadLessonTranscript,
} from "@/lib/lesson-registry";
import {
  profileContextFromLesson,
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

function lessonIdFromStudentId(id: string): string {
  return id.startsWith("student-") ? id.slice("student-".length) : id;
}

export function getStudentProfileById(id: string): StudentProfileDetail | null {
  const lessonId = lessonIdFromStudentId(id);
  const meta = getLessonMeta(lessonId);
  if (!meta) return null;

  const transcript = loadLessonTranscript(meta);
  const lessonContext = inferLessonContext(transcript, meta);
  const profileContext = profileContextFromLesson(meta, lessonContext);
  return buildStudentProfileFromTranscript(transcript, profileContext);
}

export function getStudentProfileByLessonId(
  lessonId: string
): StudentProfileDetail | null {
  return getStudentProfileById(`student-${lessonId}`);
}

export function getTeacherProfileByLessonId(
  lessonId: string
): TeacherProfileDetail | null {
  return buildAllTeacherProfiles().find((p) => p.lessonId === lessonId) ?? null;
}
