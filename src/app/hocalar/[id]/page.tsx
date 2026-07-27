"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { TeacherProfileDetail } from "@/types";
import { fetchTeacherById } from "@/lib/api";
import Header from "@/components/Header";
import TeacherProfileView from "@/components/TeacherProfileView";
import { resolveTeacherAvatar } from "@/lib/teacher-photos";

export default function TeacherDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [teacher, setTeacher] = useState<TeacherProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherById(id)
      .then((profile) =>
        setTeacher({ ...profile, avatar: resolveTeacherAvatar(profile.name) })
      )
      .catch(() => setTeacher(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen page-shell">
        <Header activeNav="Hocalar" />
        <main className="mx-auto max-w-3xl animate-pulse px-4 py-6 sm:px-6">
          <div className="mb-4 h-4 w-28 rounded bg-stone-100" />
          <div className="h-32 rounded-xl bg-stone-100" />
        </main>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen page-shell">
        <Header activeNav="Hocalar" />
        <main className="mx-auto max-w-3xl px-4 py-12 text-center text-stone-500">
          Hoca bulunamadı.{" "}
          <Link href="/hocalar" className="text-red-600 hover:underline">
            Listeye dön
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-shell">
      <Header activeNav="Hocalar" />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Link
          href="/hocalar"
          className="mb-4 inline-flex text-sm text-stone-500 hover:text-red-600"
        >
          ← Tüm hocalar
        </Link>
        <TeacherProfileView teacher={teacher} />
      </main>
    </div>
  );
}
