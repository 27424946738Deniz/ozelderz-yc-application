"use client";

import type { MetricHeatmap as MetricHeatmapData } from "@/types/transcript";
import { useVideoSeek } from "@/context/VideoSeekContext";

const levelColors = {
  hot: "bg-red-400 hover:bg-red-500",
  warm: "bg-red-300 hover:bg-red-400",
  neutral: "bg-amber-200 hover:bg-amber-300",
  cool: "bg-sky-200 hover:bg-sky-300",
  cold: "bg-blue-400 hover:bg-blue-500",
};

interface MetricHeatmapProps {
  heatmap: MetricHeatmapData;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MetricHeatmap({ heatmap }: MetricHeatmapProps) {
  const { seekTo } = useVideoSeek();
  const totalDuration = heatmap.cells.reduce(
    (sum, cell) => sum + (cell.end - cell.start),
    0
  );

  return (
    <div className="mt-4 rounded-xl bg-stone-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-stone-800">{heatmap.title}</h3>
          <p className="text-xs text-stone-500">{heatmap.description}</p>
        </div>
        <div className="flex gap-2 text-[10px] text-stone-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-red-400" />
            {heatmap.hotLabel}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-blue-400" />
            {heatmap.coldLabel}
          </span>
        </div>
      </div>

      <div className="flex gap-0.5 overflow-x-auto">
        {heatmap.cells.map((cell) => {
          const widthPct = ((cell.end - cell.start) / totalDuration) * 100;
          return (
            <button
              key={`${cell.start}-${cell.end}`}
              type="button"
              title={cell.label}
              onClick={() => seekTo(cell.start)}
              style={{ flex: `${widthPct} 1 0`, minWidth: "20px" }}
              className={`h-8 rounded-md transition-colors ${levelColors[cell.level]}`}
            />
          );
        })}
      </div>

      <div className="mt-2 flex gap-0.5 overflow-x-auto">
        {heatmap.cells.map((cell) => {
          const widthPct = ((cell.end - cell.start) / totalDuration) * 100;
          return (
            <div
              key={`lbl-${cell.start}`}
              style={{ flex: `${widthPct} 1 0`, minWidth: "20px" }}
              className="truncate px-0.5 text-[8px] text-stone-400"
              title={cell.title}
            >
              {formatTime(cell.start)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
