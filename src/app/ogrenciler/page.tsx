"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StudentProfileDetail, UserData } from "@/types";
import { fetchStudents, fetchUser } from "@/lib/api";
import Header from "@/components/Header";
import LearningStyleSchema from "@/components/LearningStyleSchema";
import Tabs, { Panel } from "@/components/ui/Tabs";

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentProfileDetail[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("learning");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchStudents(), fetchUser()])
      .then(([studentsData, userData]) => {
        setStudents(studentsData);
        setSelectedId(studentsData[0]?.id ?? null);
        setUser(userData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center page-shell">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-500">Veri yüklenemedi.</p>
      </div>
    );
  }

  const student = students.find((s) => s.id === selectedId) ?? students[0];
  if (!student) {
    return (
      <div className="min-h-screen page-shell">
        <Header user={user} activeNav="Öğrenciler" />
        <main className="mx-auto max-w-3xl px-4 py-12 text-center text-stone-500">
          Henüz profil yok.
        </main>
      </div>
    );
  }

  const firstName = student.name.split(" ")[0];

  return (
    <div className="min-h-screen page-shell">
      <Header user={user} activeNav="Öğrenciler" />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {students.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  s.id === student.id
                    ? "bg-red-100 font-medium text-red-800"
                    : "bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {s.name.split(" ")[0]}
                <span className="ml-1 text-xs text-stone-400">
                  · {s.lessonsSummary.subjects[0]?.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Hero */}
        <div className="panel mb-6 overflow-hidden">
          <div className="flex items-start gap-4 p-5">
            <img
              src={student.avatar}
              alt={student.name}
              className="h-16 w-16 rounded-2xl bg-stone-100"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-stone-900">
                {student.name}
              </h1>
              <p className="text-sm text-stone-500">
                {student.grade} · {student.school}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {student.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {student.comprehensionScore}
              </p>
              <p className="text-[10px] text-stone-400">katılım</p>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-stone-100 border-t border-stone-100 bg-stone-50/50">
            {[
              { l: "Tur", v: student.engagementMetrics.turnCount },
              { l: "Soru", v: student.engagementMetrics.questionCount },
              { l: "Katılım", v: `%${student.engagementMetrics.participationPct}` },
              { l: "Ders", v: student.engagementMetrics.lessonCount },
            ].map(({ l, v }) => (
              <div key={l} className="px-3 py-3 text-center">
                <p className="text-sm font-semibold text-stone-800">{v}</p>
                <p className="text-[10px] text-stone-400">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <Tabs
          tabs={[
            { id: "learning", label: "Öğrenme Stili" },
            { id: "profile", label: "Profil" },
            { id: "quotes", label: "Alıntılar" },
          ]}
          active={tab}
          onChange={setTab}
          className="mb-5"
        />

        {tab === "learning" && (
          <LearningStyleSchema
            analysis={student.learningStyleAnalysis}
            studentName={student.name}
          />
        )}

        {tab === "profile" && (
          <div className="space-y-4">
            <Panel title="Hedefler">
              <ul className="bullet-list stone">
                {student.goals.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </Panel>

            <Panel title="İlgi alanları">
              <div className="grid gap-2 sm:grid-cols-2">
                {student.interestAreas.map((a) => (
                  <div
                    key={a.label}
                    className="rounded-xl bg-stone-50 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-stone-800">
                      {a.label}
                    </p>
                    <p className="text-xs text-stone-500">{a.detail}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2">
              <Panel title="Güçlü yönler">
                <ul className="bullet-list green">
                  {student.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Gelişim alanları">
                <ul className="bullet-list orange">
                  {student.challenges.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </Panel>
            </div>

            <Panel title={`${firstName} ile çalışma önerileri`}>
              <ul className="bullet-list stone">
                {student.teachingTips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Panel>
          </div>
        )}

        {tab === "quotes" && (
          <Panel title="Transkriptten alıntılar">
            <div className="space-y-3">
              {student.notableQuotes.map((q) => (
                <blockquote
                  key={`${q.time}-${q.text.slice(0, 16)}`}
                  className="rounded-xl bg-stone-50 px-4 py-3"
                >
                  <p className="text-sm italic text-stone-600">
                    &ldquo;{q.text}&rdquo;
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-red-500">
                    {q.time}
                  </p>
                </blockquote>
              ))}
            </div>
          </Panel>
        )}

        <p className="mt-6 text-center text-xs text-stone-400">
          {student.lessonsSummary.lastLessonTitle} transkriptinden üretildi ·{" "}
          {student.lessonId && (
            <>
              <Link
                href={`/dersler/${student.lessonId}`}
                className="text-red-600 hover:underline"
              >
                Derse git
              </Link>
              {" · "}
            </>
          )}
          <Link href="/hocalar" className="text-red-600 hover:underline">
            Hoca profili
          </Link>
        </p>
      </main>
    </div>
  );
}
