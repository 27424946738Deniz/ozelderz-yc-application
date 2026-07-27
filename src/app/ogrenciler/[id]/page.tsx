"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { StudentProfileDetail } from "@/types";
import { fetchStudentById } from "@/lib/api";
import Header from "@/components/Header";
import StudentProfileView from "@/components/StudentProfileView";

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [student, setStudent] = useState<StudentProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentById(id)
      .then(setStudent)
      .catch(() => setStudent(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center page-shell">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen page-shell">
        <Header activeNav="Öğrenciler" />
        <main className="mx-auto max-w-3xl px-4 py-12 text-center text-stone-500">
          Öğrenci bulunamadı.{" "}
          <Link href="/ogrenciler" className="text-red-600 hover:underline">
            Listeye dön
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-shell">
      <Header activeNav="Öğrenciler" />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Link
          href="/ogrenciler"
          className="mb-4 inline-flex text-sm text-stone-500 hover:text-red-600"
        >
          ← Tüm öğrenciler
        </Link>
        <StudentProfileView student={student} />
      </main>
    </div>
  );
}
