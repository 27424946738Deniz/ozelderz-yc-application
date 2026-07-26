import type {
  LessonCatalogItem,
  LessonData,
  StudentProfileDetail,
  TeacherProfileDetail,
  UserData,
} from "@/types";

export async function fetchLesson(): Promise<LessonData> {
  const res = await fetch("/api/lesson");
  if (!res.ok) throw new Error("Ders verisi alınamadı");
  return res.json();
}

export async function fetchLessons(): Promise<LessonCatalogItem[]> {
  const res = await fetch("/api/lessons");
  if (!res.ok) throw new Error("Ders listesi alınamadı");
  return res.json();
}

export async function fetchLessonById(id: string): Promise<LessonData> {
  const res = await fetch(`/api/lessons/${id}`);
  if (!res.ok) throw new Error("Ders verisi alınamadı");
  return res.json();
}

export async function fetchUser(): Promise<UserData> {
  const res = await fetch("/api/user");
  if (!res.ok) throw new Error("Kullanıcı verisi alınamadı");
  return res.json();
}

export async function fetchStudents(): Promise<StudentProfileDetail[]> {
  const res = await fetch("/api/students");
  if (!res.ok) throw new Error("Öğrenci verisi alınamadı");
  return res.json();
}

export async function fetchTeachers(): Promise<TeacherProfileDetail[]> {
  const res = await fetch("/api/teachers");
  if (!res.ok) throw new Error("Hoca verisi alınamadı");
  return res.json();
}
