import type {
  LessonCatalogItem,
  LessonData,
  StudentCatalogItem,
  StudentProfileDetail,
  TeacherCatalogItem,
  TeacherProfileDetail,
  UserData,
} from "@/types";

async function parseApiError(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  throw new Error(body.error ?? `${fallback} (${res.status})`);
}

export async function fetchLesson(): Promise<LessonData> {
  const res = await fetch("/api/lesson");
  if (!res.ok) return parseApiError(res, "Ders verisi alınamadı");
  return res.json();
}

export async function fetchLessons(): Promise<LessonCatalogItem[]> {
  const res = await fetch("/api/lessons");
  if (!res.ok) return parseApiError(res, "Ders listesi alınamadı");
  return res.json();
}

export async function fetchLessonById(id: string): Promise<LessonData> {
  const res = await fetch(`/api/lessons/${id}`);
  if (!res.ok) return parseApiError(res, "Ders verisi alınamadı");
  return res.json();
}

export async function fetchUser(): Promise<UserData> {
  const res = await fetch("/api/user");
  if (!res.ok) throw new Error("Kullanıcı verisi alınamadı");
  return res.json();
}

export async function fetchStudents(): Promise<StudentCatalogItem[]> {
  const res = await fetch("/api/students");
  if (!res.ok) throw new Error("Öğrenci verisi alınamadı");
  return res.json();
}

export async function fetchStudentById(id: string): Promise<StudentProfileDetail> {
  const res = await fetch(`/api/students/${encodeURIComponent(id)}`);
  if (!res.ok) return parseApiError(res, "Öğrenci profili alınamadı");
  return res.json();
}

export async function fetchTeachers(): Promise<TeacherCatalogItem[]> {
  const res = await fetch("/api/teachers");
  if (!res.ok) throw new Error("Hoca verisi alınamadı");
  return res.json();
}

export async function fetchTeacherById(id: string): Promise<TeacherProfileDetail> {
  const res = await fetch(`/api/teachers/${encodeURIComponent(id)}`);
  if (!res.ok) return parseApiError(res, "Hoca profili alınamadı");
  return res.json();
}
