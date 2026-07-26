"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  GitBranch,
  Map,
  RotateCcw,
  User,
} from "lucide-react";
import type { LessonRoadmap, RoadmapCheckpoint } from "@/types/roadmap";
import { fetchUser } from "@/lib/api";
import { mockUser } from "@/lib/mock-data";
import type { UserData } from "@/types";
import Header from "@/components/Header";
import { Panel } from "@/components/ui/Tabs";

interface RoadmapViewProps {
  roadmap: LessonRoadmap;
}

type CheckpointResult = "pending" | "pass" | "fail";

function statusColor(status: RoadmapCheckpoint["status"]) {
  if (status === "foundation") return "bg-sky-100 text-sky-700";
  if (status === "exam") return "bg-red-100 text-red-700";
  return "bg-stone-100 text-stone-700";
}

function CheckpointCard({
  checkpoint,
  index,
  result,
  score,
  onScoreChange,
  onEvaluate,
  unlocked,
}: {
  checkpoint: RoadmapCheckpoint;
  index: number;
  result: CheckpointResult;
  score: number | null;
  onScoreChange: (v: number) => void;
  onEvaluate: () => void;
  unlocked: boolean;
}) {
  const [open, setOpen] = useState(index === 0);

  if (!unlocked) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-3 opacity-60">
        <p className="text-sm text-stone-400">
          🔒 {checkpoint.title} — önceki checkpoint&apos;i geç
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        result === "pass"
          ? "border-green-200 bg-green-50/30"
          : result === "fail"
            ? "border-orange-200 bg-orange-50/20"
            : "border-red-100 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5"
      >
        <div className="flex gap-3">
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              result === "pass"
                ? "bg-green-600 text-white"
                : result === "fail"
                  ? "bg-orange-500 text-white"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {result === "pass" ? <CheckCircle2 size={16} /> : index + 1}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-stone-900">{checkpoint.title}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${statusColor(checkpoint.status)}`}
              >
                {checkpoint.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">{checkpoint.weekRange}</p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`mt-1 shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-stone-100 px-4 pb-5 pt-4 sm:px-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">
                Hoca odak
              </p>
              <ul className="bullet-list stone text-sm">
                {checkpoint.teacherFocus.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-600">
                Öğrenci görevleri
              </p>
              <ul className="bullet-list sky text-sm">
                {checkpoint.studentTasks.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-red-100 bg-red-50/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
              Checkpoint testi
            </p>
            <p className="mt-1 font-medium text-stone-900">
              {checkpoint.test.label}
            </p>
            <p className="mt-1 text-sm text-stone-600">
              {checkpoint.test.description}
            </p>
            <p className="mt-2 text-xs text-stone-500">
              {checkpoint.test.questionCount} soru · Geçiş: ≥
              {checkpoint.test.passScore} doğru · {checkpoint.test.format}
            </p>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex-1 min-w-[140px]">
                <span className="mb-1 block text-xs font-medium text-stone-600">
                  Doğru sayısı (simülasyon)
                </span>
                <input
                  type="number"
                  min={0}
                  max={checkpoint.test.questionCount}
                  value={score ?? ""}
                  onChange={(e) =>
                    onScoreChange(
                      Math.min(
                        checkpoint.test.questionCount,
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    )
                  }
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-mono focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder={`0–${checkpoint.test.questionCount}`}
                />
              </label>
              <button
                type="button"
                onClick={onEvaluate}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Değerlendir
              </button>
            </div>
          </div>

          {result === "pass" && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
                <ArrowRight size={16} />
                {checkpoint.onPass.headline}
              </p>
              <p className="mt-2 text-sm text-green-700">
                {checkpoint.onPass.detail}
              </p>
            </div>
          )}

          {result === "fail" && (
            <div className="mt-4 space-y-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-orange-800">
                <GitBranch size={16} />
                Retry branch — geçemedi
              </p>
              <div className="rounded-lg bg-white/80 p-3 text-sm">
                <p className="font-medium text-stone-800">
                  Zayıf alan: {checkpoint.onFail.weakArea}
                </p>
                <p className="mt-2 text-stone-600">
                  <User size={12} className="mr-1 inline" />
                  Mizaç notu: {checkpoint.onFail.temperamentNote}
                </p>
                <p className="mt-2 text-stone-600">
                  Hoca: {checkpoint.onFail.teacherAction}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-orange-700">
                  Öğrenci tekrar planı
                </p>
                <ul className="bullet-list orange text-sm">
                  {checkpoint.onFail.studentRetry.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={onEvaluate}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 hover:underline"
              >
                <RotateCcw size={12} />
                Tekrar değerlendir
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RoadmapView({ roadmap }: RoadmapViewProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [results, setResults] = useState<Record<string, CheckpointResult>>({});

  const allCheckpoints = useMemo(
    () => roadmap.phases.flatMap((p) => p.checkpoints),
    [roadmap]
  );

  useEffect(() => {
    fetchUser()
      .then(setUser)
      .catch(() => setUser(mockUser));
  }, []);

  function isUnlocked(checkpointId: string) {
    const idx = allCheckpoints.findIndex((c) => c.id === checkpointId);
    if (idx === 0) return true;
    const prev = allCheckpoints[idx - 1];
    return results[prev.id] === "pass";
  }

  function evaluate(checkpoint: RoadmapCheckpoint) {
    const score = scores[checkpoint.id];
    if (score === null || score === undefined) return;
    const passed = score >= checkpoint.test.passScore;
    setResults((prev) => ({
      ...prev,
      [checkpoint.id]: passed ? "pass" : "fail",
    }));
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center page-shell">
        <div className="h-7 w-7 animate-spin rounded-full border-2 spinner-brand border-t-transparent" />
      </div>
    );
  }

  const passedCount = Object.values(results).filter((r) => r === "pass").length;

  return (
    <div className="min-h-screen page-shell">
      <Header user={user} activeNav="Yol Haritası" />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Link
          href="/yol-haritasi"
          className="mb-4 inline-block text-xs text-red-600 hover:underline"
        >
          ← Tüm yol haritaları
        </Link>

        <div className="panel overflow-hidden">
          <div className="border-b border-stone-100 bg-gradient-to-r from-red-50/80 to-white p-5 sm:p-6">
            <div className="flex items-center gap-2 text-red-600">
              <Map size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Öğretmen & öğrenci roadmap
              </span>
            </div>
            <h1 className="mt-2 text-xl font-semibold text-stone-900 sm:text-2xl">
              {roadmap.title}
            </h1>
            <p className="mt-1 text-sm text-stone-500">{roadmap.subject}</p>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5">
                <img
                  src={roadmap.teacher.avatar}
                  alt=""
                  className="h-6 w-6 rounded-full"
                />
                <span className="text-sm text-stone-700">
                  {roadmap.teacher.name}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5">
                <img
                  src={roadmap.student.avatar}
                  alt=""
                  className="h-6 w-6 rounded-full"
                />
                <span className="text-sm text-stone-700">
                  {roadmap.student.name}
                </span>
              </div>
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                {passedCount}/{allCheckpoints.length} checkpoint
              </span>
            </div>
          </div>

          <div className="grid gap-4 border-b border-stone-100 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase text-stone-400">
                Öğrenme profili
              </p>
              <p className="mt-1 text-sm font-medium text-stone-800">
                {roadmap.student.learningStyle}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-stone-400">
                Kaynak
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {roadmap.generatedFrom}
              </p>
            </div>
          </div>
        </div>

        <Panel title="Tanışma dersinden çıkarımlar" className="mt-6">
          <ul className="bullet-list stone text-sm">
            {roadmap.introLessonInsights.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Mizaç sinyalleri (retry branch'lerde kullanılır)"
          className="mt-4"
        >
          <ul className="bullet-list orange text-sm">
            {roadmap.student.temperamentSignals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Panel>

        <div className="mt-8 space-y-10">
          {roadmap.phases.map((phase) => (
            <section key={phase.id}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600">
                    {phase.label} · {phase.months}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-stone-900">
                    {phase.goal}
                  </h2>
                </div>
              </div>
              <div className="space-y-3">
                {phase.checkpoints.map((cp, i) => {
                  const globalIndex = allCheckpoints.findIndex(
                    (c) => c.id === cp.id
                  );
                  return (
                    <CheckpointCard
                      key={cp.id}
                      checkpoint={cp}
                      index={globalIndex}
                      result={results[cp.id] ?? "pending"}
                      score={scores[cp.id] ?? null}
                      onScoreChange={(v) =>
                        setScores((prev) => ({ ...prev, [cp.id]: v }))
                      }
                      onEvaluate={() => evaluate(cp)}
                      unlocked={isUnlocked(cp.id)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3 pb-10">
          <Link
            href={`/dersler/${roadmap.lessonId}`}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-red-200"
          >
            Derse git
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/ogrenciler"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-red-200"
          >
            Öğrenci profili
          </Link>
          <Link
            href="/hocalar"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-red-200"
          >
            Hoca profili
          </Link>
        </div>
      </main>
    </div>
  );
}
