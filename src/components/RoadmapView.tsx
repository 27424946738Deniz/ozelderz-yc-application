"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  GitBranch,
  Map,
  RotateCcw,
} from "lucide-react";
import type {
  LessonRoadmap,
  RoadmapCheckpoint,
  RoadmapOutcome,
} from "@/types/roadmap";
import Header from "@/components/Header";
import { Panel } from "@/components/ui/Tabs";

interface RoadmapViewProps {
  roadmap: LessonRoadmap;
}

type OutcomeKind = "pass" | "partial" | "fail";

function statusColor(status: RoadmapCheckpoint["status"]) {
  if (status === "foundation") return "bg-sky-100 text-sky-700";
  if (status === "exam") return "bg-red-100 text-red-700";
  return "bg-stone-100 text-stone-700";
}

function outcomeStyles(kind: OutcomeKind) {
  if (kind === "pass") {
    return {
      border: "border-green-200",
      bg: "bg-green-50/70",
      badge: "bg-green-600 text-white",
      title: "text-green-800",
      text: "text-green-700",
      label: "Geçerse",
    };
  }
  if (kind === "partial") {
    return {
      border: "border-amber-200",
      bg: "bg-amber-50/70",
      badge: "bg-amber-500 text-white",
      title: "text-amber-900",
      text: "text-amber-800",
      label: "Kısmen",
    };
  }
  return {
    border: "border-orange-200",
    bg: "bg-orange-50/70",
    badge: "bg-orange-500 text-white",
    title: "text-orange-900",
    text: "text-orange-800",
    label: "Geçemezse",
  };
}

function OutcomeBranch({
  outcome,
  kind,
  active,
}: {
  outcome: RoadmapOutcome;
  kind: OutcomeKind;
  active: boolean;
}) {
  const styles = outcomeStyles(kind);

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${styles.border} ${styles.bg} ${
        active ? "ring-2 ring-offset-1 ring-stone-300" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles.badge}`}
        >
          {styles.label}
        </span>
        <span className="font-mono text-xs text-stone-600">{outcome.condition}</span>
      </div>

      <p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${styles.title}`}>
        <GitBranch size={14} />
        {outcome.headline}
      </p>
      <p className={`mt-1 text-sm ${styles.text}`}>{outcome.detail}</p>

      {outcome.nextCheckpointTitle && (
        <p className="mt-2 text-xs font-medium text-stone-500">
          Sonraki adım: {outcome.nextCheckpointTitle}
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
            Hoca
          </p>
          <ul className="bullet-list stone mt-1 text-xs">
            {outcome.teacherSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
            Öğrenci
          </p>
          <ul className="bullet-list sky mt-1 text-xs">
            {outcome.studentSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {outcome.temperamentNote && (
        <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-stone-600">
          Mizaç notu: {outcome.temperamentNote}
        </p>
      )}
    </div>
  );
}

function CheckpointCard({
  checkpoint,
  index,
  activeOutcome,
  score,
  onScoreChange,
  onEvaluate,
}: {
  checkpoint: RoadmapCheckpoint;
  index: number;
  activeOutcome: OutcomeKind | null;
  score: number | null;
  onScoreChange: (v: number) => void;
  onEvaluate: () => void;
}) {
  const [open, setOpen] = useState(index < 2);

  return (
    <div className="relative">
      {index > 0 && (
        <div className="absolute -top-3 left-6 h-3 w-px bg-stone-200" aria-hidden />
      )}

      <div className="rounded-2xl border border-red-100 bg-white">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5"
        >
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
              {index + 1}
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
              {checkpoint.transcriptContext && (
                <p className="mt-1 text-xs italic text-stone-400">
                  {checkpoint.transcriptContext}
                </p>
              )}
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

            <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                Ödev
              </p>
              <p className="mt-1 font-medium text-stone-900">
                {checkpoint.homework.title}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {checkpoint.homework.description}
              </p>
              <p className="mt-2 text-xs text-stone-500">
                {checkpoint.homework.quantity}
                {checkpoint.homework.estimatedMinutes
                  ? ` · ~${checkpoint.homework.estimatedMinutes} dk`
                  : ""}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-red-100 bg-red-50/40 p-4">
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
                {checkpoint.test.passScore} doğru
                {checkpoint.test.partialScore !== undefined
                  ? ` · Kısmi: ≥${checkpoint.test.partialScore}`
                  : ""}{" "}
                · {checkpoint.test.format}
              </p>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="min-w-[140px] flex-1">
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
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                    placeholder={`0–${checkpoint.test.questionCount}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={onEvaluate}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Dalı seç
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                <GitBranch size={14} />
                What-if ağacı — tüm yollar görünür
              </p>
              <div className="grid gap-3 lg:grid-cols-3">
                <OutcomeBranch
                  outcome={checkpoint.outcomes.pass}
                  kind="pass"
                  active={activeOutcome === "pass"}
                />
                {checkpoint.outcomes.partial && (
                  <OutcomeBranch
                    outcome={checkpoint.outcomes.partial}
                    kind="partial"
                    active={activeOutcome === "partial"}
                  />
                )}
                <OutcomeBranch
                  outcome={checkpoint.outcomes.fail}
                  kind="fail"
                  active={activeOutcome === "fail"}
                />
              </div>
            </div>

            {activeOutcome && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
                <CheckCircle2 size={14} className="text-green-600" />
                Simülasyon:{" "}
                <span className="font-medium">
                  {outcomeStyles(activeOutcome).label}
                </span>{" "}
                dalı seçildi
                <button
                  type="button"
                  onClick={onEvaluate}
                  className="ml-auto inline-flex items-center gap-1 text-orange-700 hover:underline"
                >
                  <RotateCcw size={12} />
                  Yeniden değerlendir
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoadmapView({ roadmap }: RoadmapViewProps) {
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [activeOutcomes, setActiveOutcomes] = useState<
    Record<string, OutcomeKind | null>
  >({});

  const allCheckpoints = useMemo(
    () => roadmap.phases.flatMap((p) => p.checkpoints),
    [roadmap]
  );

  function evaluate(checkpoint: RoadmapCheckpoint) {
    const score = scores[checkpoint.id];
    if (score === null || score === undefined) return;

    const { passScore, partialScore = 0, questionCount } = checkpoint.test;
    let kind: OutcomeKind = "fail";

    if (score >= passScore) {
      kind = "pass";
    } else if (partialScore > 0 && score >= partialScore) {
      kind = "partial";
    } else if (score === 0) {
      kind = "fail";
    } else {
      kind = score >= partialScore ? "partial" : "fail";
    }

    setActiveOutcomes((prev) => ({ ...prev, [checkpoint.id]: kind }));
  }

  const simulatedCount = Object.values(activeOutcomes).filter(Boolean).length;

  return (
    <div className="min-h-screen page-shell">
      <Header activeNav="Yol Haritası" />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
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
                {allCheckpoints.length} checkpoint · what-if ağacı
              </span>
              {simulatedCount > 0 && (
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                  {simulatedCount} simülasyon
                </span>
              )}
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

        <Panel title="Mizaç sinyalleri" className="mt-4">
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
              <div className="relative space-y-6 border-l-2 border-stone-200 pl-4 sm:pl-6">
                {phase.checkpoints.map((cp) => {
                  const globalIndex = allCheckpoints.findIndex(
                    (c) => c.id === cp.id
                  );
                  return (
                    <CheckpointCard
                      key={cp.id}
                      checkpoint={cp}
                      index={globalIndex}
                      activeOutcome={activeOutcomes[cp.id] ?? null}
                      score={scores[cp.id] ?? null}
                      onScoreChange={(v) =>
                        setScores((prev) => ({ ...prev, [cp.id]: v }))
                      }
                      onEvaluate={() => evaluate(cp)}
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
            href={`/ogrenciler/student-${roadmap.lessonId}`}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-red-200"
          >
            Öğrenci profili
          </Link>
          <Link
            href={`/hocalar/teacher-${roadmap.lessonId}`}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-red-200"
          >
            Hoca profili
          </Link>
        </div>
      </main>
    </div>
  );
}
