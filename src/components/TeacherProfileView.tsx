"use client";

import { useState } from "react";
import Link from "next/link";
import type { TeacherProfileDetail } from "@/types";
import TeachingStyleSchema from "@/components/TeachingStyleSchema";
import Tabs, { Panel } from "@/components/ui/Tabs";

function matchColor(score: number) {
  if (score >= 75) return "text-green-600 bg-green-50";
  if (score >= 55) return "text-red-600 bg-red-50";
  return "text-stone-500 bg-stone-100";
}

interface TeacherProfileViewProps {
  teacher: TeacherProfileDetail;
}

export default function TeacherProfileView({ teacher }: TeacherProfileViewProps) {
  const [tab, setTab] = useState("style");
  const firstName = teacher.name.split(" ")[0];

  return (
    <>
      <div className="panel mb-6 overflow-hidden">
        <div className="flex items-start gap-4 p-5">
          <img
            src={teacher.avatar}
            alt={teacher.name}
            className="h-16 w-16 rounded-2xl bg-stone-100 object-cover"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-stone-900">
              {teacher.name}
            </h1>
            <p className="text-sm text-stone-500">
              {teacher.title} · {teacher.subject}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {teacher.tags.map((tag) => (
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
              {teacher.teachingScore}
            </p>
            <p className="text-[10px] text-stone-400">ders skoru</p>
          </div>
        </div>
        <div className="grid grid-cols-4 divide-x divide-stone-100 border-t border-stone-100 bg-stone-50/50">
          {[
            { l: "Konuşma", v: `%${teacher.teachingMetrics.talkRatioPct}` },
            { l: "Soru", v: teacher.teachingMetrics.questionCount },
            { l: "Hız", v: `${teacher.teachingMetrics.wpm} wpm` },
            { l: "Kontrol", v: teacher.teachingMetrics.checkInCount },
          ].map(({ l, v }) => (
            <div key={l} className="px-3 py-3 text-center">
              <p className="text-sm font-semibold text-stone-800">{v}</p>
              <p className="text-[10px] text-stone-400">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <Panel
        title="Öğrenci eşleştirme özeti"
        description={`${firstName}'nın güçlü yönlerine göre yönlendirme rehberi`}
        className="mb-6"
      >
        <p className="mb-4 text-sm leading-relaxed text-stone-600">
          Bu hocanın güçlü yönleri{" "}
          <strong className="font-medium text-stone-800">
            {teacher.teachingStyleAnalysis.primaryStyle.toLowerCase()}
          </strong>{" "}
          ve{" "}
          <strong className="font-medium text-stone-800">
            {teacher.teachingStyleAnalysis.secondaryStyle.toLowerCase()}
          </strong>{" "}
          — bu profildeki öğrenciler öncelikle buraya yönlendirilmelidir.
        </p>
        <div className="space-y-3">
          {teacher.studentTypeMatches.map((match) => (
            <div
              key={match.studentType}
              className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/50 p-4"
            >
              <span
                className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${matchColor(match.matchScore)}`}
              >
                %{match.matchScore}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-800">
                  {match.studentType}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  {match.reason}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {match.traits.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full bg-white px-2 py-0.5 text-[10px] text-stone-500"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
                {match.caution && (
                  <p className="mt-2 text-xs text-red-600">⚠ {match.caution}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Tabs
        tabs={[
          { id: "style", label: "Öğretim Tarzı" },
          { id: "profile", label: "Profil" },
          { id: "quotes", label: "Alıntılar" },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-5"
      />

      {tab === "style" && (
        <TeachingStyleSchema
          analysis={teacher.teachingStyleAnalysis}
          teacherName={teacher.name}
        />
      )}

      {tab === "profile" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel title="Güçlü yönler">
              <ul className="bullet-list green">
                {teacher.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Panel>
            <Panel title="Gelişim alanları">
              <ul className="bullet-list orange">
                {teacher.developmentAreas.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Tüm öğrenci tipi eşleşmeleri">
            <div className="space-y-3">
              {teacher.studentTypeMatches.map((match) => (
                <div
                  key={match.studentType}
                  className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800">
                      {match.studentType}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-stone-500">
                      {match.reason}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${matchColor(match.matchScore)}`}
                  >
                    %{match.matchScore}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Koordinatör notları">
            <ul className="bullet-list stone">
              {teacher.coordinatorTips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      {tab === "quotes" && (
        <Panel title="Transkriptten alıntılar">
          <div className="space-y-3">
            {teacher.notableQuotes.map((q) => (
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
        {teacher.lessonsSummary.lastLessonTitle} transkriptinden üretildi ·{" "}
        {teacher.lessonId && (
          <>
            <Link
              href={`/dersler/${teacher.lessonId}`}
              className="text-red-600 hover:underline"
            >
              Derse git
            </Link>
            {" · "}
            <Link
              href={`/ogrenciler/student-${teacher.lessonId}`}
              className="text-red-600 hover:underline"
            >
              Öğrenci profili
            </Link>
          </>
        )}
      </p>
    </>
  );
}
