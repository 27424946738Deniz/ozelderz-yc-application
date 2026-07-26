"use client";

import { useState } from "react";
import type { LessonSummary } from "@/types";

interface SummaryPanelProps {
  summary: LessonSummary;
  embedded?: boolean;
}

export default function SummaryPanel({ summary, embedded }: SummaryPanelProps) {
  const [tab, setTab] = useState<"brief" | "detailed">("brief");
  const content = tab === "brief" ? summary.brief : summary.detailed;

  return (
    <div className={embedded ? "p-5" : "card-border shadow-sm p-5"}>
      <div className="mb-3 flex items-center gap-3 text-xs">
        {(["brief", "detailed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-medium transition-colors ${
              tab === t
                ? "text-red-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {t === "brief" ? "Kısa özet" : "Detaylı özet"}
          </button>
        ))}
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600">
        {content}
      </p>
    </div>
  );
}
