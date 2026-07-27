"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";
import type { LearningStyleAnalysis } from "@/types";
import type { LessonRoadmap } from "@/types/roadmap";
import Tabs, { Panel } from "@/components/ui/Tabs";

const barColors = {
  high: "bg-green-500",
  medium: "bg-red-400",
  low: "bg-stone-300",
};

interface LearningStyleSchemaProps {
  analysis: LearningStyleAnalysis;
  studentName: string;
  lessonId?: string;
}

export default function LearningStyleSchema({
  analysis,
  studentName,
  lessonId,
}: LearningStyleSchemaProps) {
  const [tab, setTab] = useState("dimensions");
  const [roadmap, setRoadmap] = useState<LessonRoadmap | null>(null);
  const firstName = studentName.split(" ")[0];

  useEffect(() => {
    if (!lessonId) return;
    fetch(`/api/roadmap/${lessonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setRoadmap)
      .catch(() => setRoadmap(null));
  }, [lessonId]);

  const checkpointCount =
    roadmap?.phases.reduce((n, p) => n + p.checkpoints.length, 0) ?? 0;

  return (
    <Panel noPadding>
      <div className="border-b border-stone-100 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-red-600">
          Öğrenme stili
        </p>
        <h2 className="mt-1 text-lg font-semibold text-stone-900">
          {analysis.primaryStyle}
        </h2>
        <p className="mt-0.5 text-sm text-stone-500">
          + {analysis.secondaryStyle}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          {analysis.overview}
        </p>
      </div>

      <div className="border-b border-stone-100 px-5 py-3">
        <Tabs
          tabs={[
            { id: "dimensions", label: "Boyutlar" },
            { id: "understands", label: "Daha iyi anlıyor" },
            { id: "guide", label: "Rehber" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="p-5">
        {tab === "dimensions" && (
          <div className="space-y-4">
            {analysis.dimensions.map((dim) => (
              <div key={dim.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-800">
                    {dim.label}
                  </span>
                  <span className="text-xs tabular-nums text-stone-400">
                    {dim.score}
                  </span>
                </div>
                <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={`h-full rounded-full ${barColors[dim.level]}`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
                <p className="text-xs text-stone-600">{dim.insight}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "understands" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold text-green-700">
                {firstName} şunlardan daha iyi anlıyor
              </p>
              <ul className="space-y-2">
                {analysis.understandsBetter.length === 0 && (
                  <li className="rounded-xl border border-dashed border-stone-200 p-3 text-xs text-stone-400">
                    Bu ders için henüz transkript tabanlı analiz üretilmedi.
                  </li>
                )}
                {analysis.understandsBetter.map((item, i) => (
                  <li
                    key={`${item.area}-${i}`}
                    className="rounded-xl border border-green-100 bg-green-50/40 p-3"
                  >
                    <p className="text-sm font-medium text-stone-800">
                      {item.area}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">{item.reason}</p>
                    {item.example && (
                      <p className="mt-2 border-l-2 border-green-300 pl-2 text-xs italic text-stone-500">
                        &ldquo;{item.example}&rdquo;
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold text-red-700">
                Zorlandığı alanlar
              </p>
              <ul className="space-y-2">
                {analysis.understandsLess.length === 0 && (
                  <li className="rounded-xl border border-dashed border-stone-200 p-3 text-xs text-stone-400">
                    Transkriptte belirgin zorlanma sinyali çıkmadı veya analiz henüz üretilmedi.
                  </li>
                )}
                {analysis.understandsLess.map((item, i) => (
                  <li
                    key={`${item.area}-${i}`}
                    className="rounded-xl border border-red-100 bg-red-50/30 p-3"
                  >
                    <p className="text-sm font-medium text-stone-800">
                      {item.area}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">{item.reason}</p>
                    <p className="mt-2 text-xs text-red-700">
                      → {item.alternative}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "guide" && (
          <div className="space-y-4">
            {lessonId && roadmap && (
              <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50/80 to-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-600">
                      <Map size={14} />
                      Yol haritası
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">
                      {roadmap.subject}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {roadmap.phases.length} faz · {checkpointCount} checkpoint ·
                      what-if ağacı
                    </p>
                  </div>
                  <Link
                    href={`/yol-haritasi/${lessonId}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Git
                    <ArrowRight size={12} />
                  </Link>
                </div>

                {roadmap.introLessonInsights.length > 0 && (
                  <ul className="bullet-list stone mt-3 text-xs">
                    {roadmap.introLessonInsights.slice(0, 3).map((insight) => (
                      <li key={insight}>{insight}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 space-y-2">
                  {roadmap.phases.map((phase) => (
                    <div
                      key={phase.id}
                      className="rounded-lg border border-stone-100 bg-white/80 px-3 py-2"
                    >
                      <p className="text-xs font-medium text-stone-800">
                        {phase.label} · {phase.months}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">{phase.goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lessonId && !roadmap && (
              <p className="text-sm text-stone-400">
                Bu ders için yol haritası yükleniyor veya henüz üretilmedi.
              </p>
            )}

            {analysis.approachGuide.length === 0 && !roadmap && (
              <p className="text-sm text-stone-400">
                Bu ders için henüz taktik üretilmedi.
              </p>
            )}

            {analysis.approachGuide.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Öğretim taktikleri
              </p>
            )}

            {analysis.approachGuide.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-stone-100 p-4"
              >
                <p className="text-sm font-semibold text-stone-900">
                  {item.title}
                </p>
                <p className="mt-2 text-xs text-red-700">
                  Eksiklik: {item.gap}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">
                  {item.tactic}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
