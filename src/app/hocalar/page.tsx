"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { TeacherProfileDetail } from "@/types";
import { fetchTeachers } from "@/lib/api";
import Header from "@/components/Header";
import { resolveTeacherAvatar } from "@/lib/teacher-photos";

interface TeacherGroup {
  name: string;
  avatar: string;
  title: string;
  subjects: string[];
  lessonCount: number;
  avgScore: number;
  profileId: string;
}

function groupTeachers(teachers: TeacherProfileDetail[]): TeacherGroup[] {
  const map = new Map<string, TeacherProfileDetail[]>();

  for (const t of teachers) {
    const list = map.get(t.name) ?? [];
    list.push(t);
    map.set(t.name, list);
  }

  return [...map.entries()]
    .map(([name, items]) => {
      const scores = items.map((i) => i.teachingScore);
      const avgScore =
        Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
        10;
      const best = [...items].sort((a, b) => b.teachingScore - a.teachingScore)[0];

      return {
        name,
        avatar: resolveTeacherAvatar(name),
        title: best.title,
        subjects: [...new Set(items.map((i) => i.subject))],
        lessonCount: items.length,
        avgScore,
        profileId: best.id,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

function TeacherCard({ group }: { group: TeacherGroup }) {
  return (
    <Link
      href={`/hocalar/${group.profileId}`}
      className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white p-4 transition-colors hover:border-red-200 hover:bg-red-50/30"
    >
      <img
        src={group.avatar}
        alt={group.name}
        className="h-14 w-14 shrink-0 rounded-xl bg-stone-100 object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-stone-900">{group.name}</h3>
        <p className="mt-0.5 text-sm text-stone-500">{group.title}</p>
        <p className="mt-1 text-xs text-stone-400">
          {group.subjects.join(", ")} · {group.lessonCount} ders
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="rounded-full bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-700">
          {group.avgScore}/10
        </span>
        <p className="mt-1 text-[10px] text-stone-400">ort. skor</p>
      </div>
    </Link>
  );
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherProfileDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers()
      .then(setTeachers)
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => groupTeachers(teachers), [teachers]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center page-shell">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-shell">
      <Header activeNav="Hocalar" />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-stone-900">Hocalar</h1>
          <p className="mt-1 text-sm text-stone-500">
            {groups.length} hoca · {teachers.length} ders
          </p>
        </div>

        <div className="space-y-3">
          {groups.map((group) => (
            <TeacherCard key={group.name} group={group} />
          ))}
        </div>

        {groups.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">
            Henüz hoca profili yok.
          </p>
        )}
      </main>
    </div>
  );
}
