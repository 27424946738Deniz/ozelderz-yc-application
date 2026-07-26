"use client";

import type { SpeechSegment } from "@/types";

interface SpeechTimelineProps {
  segments: SpeechSegment[];
  duration: number;
}

export default function SpeechTimeline({
  segments = [],
  duration,
}: SpeechTimelineProps) {
  return (
    <div className="relative h-7 overflow-hidden rounded-md bg-stone-100">
      {segments.map((seg, i) => {
        const left = (seg.start / duration) * 100;
        const width = ((seg.end - seg.start) / duration) * 100;
        return (
          <div
            key={i}
            className="absolute top-0 h-full rounded-sm bg-stone-600"
            style={{ left: `${left}%`, width: `${width}%` }}
          />
        );
      })}
    </div>
  );
}
