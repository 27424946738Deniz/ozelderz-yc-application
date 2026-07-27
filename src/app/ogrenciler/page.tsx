"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StudentProfileDetail } from "@/types";
import { fetchStudents } from "@/lib/api";
import Header from "@/components/Header";

function StudentCard({ student }: { student: StudentProfileDetail }) {
  const subject = student.lessonsSummary.subjects[0] ?? "Ders";

  return (
    <Link
      href={`/ogrenciler/${student.id}`}
      className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white p-4 transition-colors hover:border-red-200 hover:bg-red-50/30"
    >
      <img
        src={student.avatar}
        alt={student.name}
        className="h-12 w-12 shrink-0 rounded-xl bg-stone-100 object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-stone-900">{student.name}</h3>
        <p className="mt-0.5 text-sm text-stone-500">
          {student.grade} · {student.school}
        </p>
        <p className="mt-1 text-xs text-stone-400">
          {subject} · {student.lessonsSummary.lastLessonTitle}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-700">
          {student.comprehensionScore}
        </span>
        <p className="mt-1 text-[10px] text-stone-400">katılım</p>
      </div>
    </Link>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentProfileDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents()
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...students].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [students]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center page-shell">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-shell">
      <Header activeNav="Öğrenciler" />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-stone-900">
            Öğrenci Profilleri
          </h1>
          <p className="mt-1 text-sm text-stone-500">{sorted.length} öğrenci</p>
        </div>

        <div className="space-y-3">
          {sorted.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>

        {sorted.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">
            Henüz öğrenci profili yok.
          </p>
        )}
      </main>
    </div>
  );
}
