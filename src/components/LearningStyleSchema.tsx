"use client";

import { useState } from "react";
import type { LearningStyleAnalysis } from "@/types";
import Tabs, { Panel } from "@/components/ui/Tabs";

const barColors = {
  high: "bg-green-500",
  medium: "bg-red-400",
  low: "bg-stone-300",
};

interface LearningStyleSchemaProps {
  analysis: LearningStyleAnalysis;
  studentName: string;
}

export default function LearningStyleSchema({
  analysis,
  studentName,
}: LearningStyleSchemaProps) {
  const [tab, setTab] = useState("dimensions");
  const firstName = studentName.split(" ")[0];

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
                {analysis.understandsBetter.map((item) => (
                  <li
                    key={item.area}
                    className="rounded-xl border border-green-100 bg-green-50/40 p-3"
                  >
                    <p className="text-sm font-medium text-stone-800">
                      {item.area}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold text-red-700">
                Zorlandığı alanlar
              </p>
              <ul className="space-y-2">
                {analysis.understandsLess.map((item) => (
                  <li
                    key={item.area}
                    className="rounded-xl border border-red-100 bg-red-50/30 p-3"
                  >
                    <p className="text-sm font-medium text-stone-800">
                      {item.area}
                    </p>
                    <p className="mt-1 text-xs text-red-700">
                      → {item.alternative}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "guide" && (
          <div className="space-y-3">
            {analysis.approachGuide.map((step, i) => (
              <div
                key={step.when}
                className="flex gap-3 rounded-xl border border-stone-100 p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                  {i + 1}
                </span>
                <div>
                  <p className="text-xs font-medium text-red-600">
                    {step.when}
                  </p>
                  <p className="mt-1 text-sm text-stone-800">{step.doThis}</p>
                  <p className="mt-1 text-xs text-stone-500">{step.because}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
