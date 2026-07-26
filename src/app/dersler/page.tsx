"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LessonCatalogItem, UserData } from "@/types";
import { fetchLessons, fetchUser } from "@/lib/api";
import Header from "@/components/Header";

function sourceLabel(source: string) {
  if (source.includes("deepgram")) return "Deepgram";
  if (source.includes("whisperx")) return "WhisperX";
  return source;
}

function speakerSummary(split: Record<string, number>) {
  const total = Object.values(split).reduce((a, b) => a + b, 0) || 1;
  const student = split.SPEAKER_01 ?? 0;
  return `%${Math.round((student / total) * 100)} öğrenci`;
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonCatalogItem[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLessons(), fetchUser()])
      .then(([lessonsData, userData]) => {
        setLessons(lessonsData);
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

  return (
    <div className="min-h-screen page-shell">
      <Header user={user} activeNav="Dersler" />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-stone-900">
            Transkript İnceleme
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Her kart transkript analizinden üretildi — tıklayarak tam incelemeyi
            açın.
          </p>
        </div>

        <div className="space-y-4">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/dersler/${lesson.id}`}
              className="panel block p-5 transition-colors hover:border-red-200 hover:bg-red-50/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold text-stone-900">{lesson.title}</h2>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {lesson.subject} · {lesson.durationMin} dk
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-stone-400">
                    {lesson.meetCode}
                  </p>
                </div>
                {lesson.evaluationScore !== undefined && (
                  <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-700">
                    {lesson.evaluationScore}/10
                  </span>
                )}
              </div>

              {lesson.summaryBrief && (
                <p className="mt-3 text-sm leading-relaxed text-stone-600 line-clamp-2">
                  {lesson.summaryBrief}
                </p>
              )}

              {lesson.topTopics && lesson.topTopics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {lesson.topTopics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  { l: "Segment", v: lesson.segmentCount },
                  { l: "Kelime", v: lesson.wordCount },
                  { l: "Soru", v: lesson.questionCount ?? "—" },
                  { l: "Bölüm", v: lesson.partCount ?? "—" },
                  { l: "Konuşma", v: speakerSummary(lesson.speakerSplit) },
                ].map(({ l, v }) => (
                  <div
                    key={l}
                    className="rounded-lg bg-stone-50 px-3 py-2 text-center"
                  >
                    <p className="text-sm font-semibold text-stone-800">{v}</p>
                    <p className="text-[10px] text-stone-400">{l}</p>
                  </div>
                ))}
              </div>

              {lesson.evaluationOverview && (
                <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-xs leading-relaxed text-stone-500 line-clamp-2">
                  {lesson.evaluationOverview}
                </p>
              )}

              {(lesson.topStrength || lesson.topWeakness) && (
                <div className="mt-3 space-y-1.5">
                  {lesson.topStrength && (
                    <p className="text-xs text-stone-600">
                      <span className="font-medium text-green-700">+ </span>
                      {lesson.topStrength}
                    </p>
                  )}
                  {lesson.topWeakness && (
                    <p className="text-xs text-stone-600 line-clamp-2">
                      <span className="font-medium text-red-600">△ </span>
                      {lesson.topWeakness}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
                  {sourceLabel(lesson.transcriptSource)}
                </span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
                  {lesson.speakers.length} konuşmacı
                </span>
                {lesson.hasVideo && (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
                    {lesson.videoType === "stream" ? "Cloudflare" : "R2 video"}
                  </span>
                )}
                {lesson.transcribedAt && (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
                    {lesson.transcribedAt.slice(0, 10)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {lessons.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">
            Henüz transkript yok.{" "}
            <code className="text-xs">npm run transcribe:deepgram</code> ile
            ekleyin.
          </p>
        )}
      </main>
    </div>
  );
}
