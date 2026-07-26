"use client";

import { useState } from "react";
import type { LessonData } from "@/types";
import MetricCard from "./MetricCard";
import MetricHeatmap from "./MetricHeatmap";
import SpeechTimeline from "./SpeechTimeline";
import { Panel } from "@/components/ui/Tabs";

interface CoachingPanelProps {
  lesson: LessonData;
}

export default function CoachingPanel({ lesson }: CoachingPanelProps) {
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  const heatmap =
    selectedMetricId && lesson.heatmaps
      ? lesson.heatmaps[selectedMetricId]
      : null;

  return (
    <Panel noPadding>
      <div className="space-y-5 p-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-500">
              Konuşma dağılımı
            </span>
            <span className="text-[11px] text-stone-400">
              Metrik seç → videoda o bölüme git
            </span>
          </div>
          <SpeechTimeline
            segments={lesson.speechTimeline ?? []}
            duration={lesson.duration}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {lesson.metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              {...metric}
              selected={selectedMetricId === metric.id}
              onSelect={(id) =>
                setSelectedMetricId((prev) => (prev === id ? null : id))
              }
            />
          ))}
        </div>

        {heatmap ? (
          <MetricHeatmap heatmap={heatmap} />
        ) : (
          <p className="rounded-xl bg-stone-50 px-4 py-3 text-center text-xs text-stone-400">
            Detaylı zaman çizelgesi için bir metrik seçin
          </p>
        )}
      </div>
    </Panel>
  );
}
