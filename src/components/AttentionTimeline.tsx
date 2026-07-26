"use client";

import type { AttentionSegment } from "@/types";

interface AttentionTimelineProps {
  segments: AttentionSegment[];
  duration: number;
}

const levelColors = {
  high: "bg-violet-500",
  medium: "bg-violet-300",
  low: "bg-violet-100",
};

const levelLabels = {
  high: "Yüksek dikkat",
  medium: "Orta dikkat",
  low: "Düşük dikkat",
};

export default function AttentionTimeline({
  segments,
  duration,
}: AttentionTimelineProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          Dikkat Zaman Çizelgesi
        </span>
        <div className="flex items-center gap-3">
          {(["high", "medium", "low"] as const).map((level) => (
            <div key={level} className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-sm ${levelColors[level]}`} />
              <span className="text-[10px] text-gray-400">
                {levelLabels[level]}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="group relative flex h-8 overflow-hidden rounded-md bg-gray-100">
        {segments.map((seg, i) => {
          const width = ((seg.end - seg.start) / duration) * 100;
          return (
            <div
              key={i}
              className={`${levelColors[seg.level]} h-full transition-opacity hover:opacity-80`}
              style={{ width: `${width}%` }}
              title={seg.label}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>0:00</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
