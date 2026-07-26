"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Rocket, TrendingUp } from "lucide-react";
import type { InsightItem } from "@/types";

interface InsightsPanelProps {
  completedInsights: InsightItem[];
  growthInsights: InsightItem[];
}

type Tab = "completed" | "growth";

function InsightAccordion({
  items,
  defaultExpandedId,
}: {
  items: InsightItem[];
  defaultExpandedId?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(
      items
        .filter((i) => i.expanded || i.id === defaultExpandedId)
        .map((i) => i.id)
    )
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="divide-y divide-[#e2e8f0]">
      {items.map((item) => {
        const isOpen = expanded.has(item.id);
        return (
          <div key={item.id}>
            <button
              onClick={() => toggle(item.id)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
              {isOpen ? (
                <ChevronDown size={16} className="shrink-0 text-gray-400" />
              ) : (
                <ChevronRight size={16} className="shrink-0 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {item.title}
              </span>
            </button>
            {isOpen && (
              <div className="space-y-2 px-4 pb-4 pl-10">
                <p className="text-sm leading-relaxed text-gray-600">
                  {item.content}
                </p>
                {item.bullets && (
                  <ul className="space-y-1.5">
                    {item.bullets.map((bullet, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-gray-600 before:mt-2 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-red-400"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function InsightsPanel({
  completedInsights,
  growthInsights,
}: InsightsPanelProps) {
  const [tab, setTab] = useState<Tab>("completed");

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-sm">
      <div className="flex border-b border-[#e2e8f0]">
        <button
          onClick={() => setTab("completed")}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "completed"
              ? "border-b-2 border-green-500 text-green-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Rocket size={16} />
          Tamamlanan Adımlar
        </button>
        <button
          onClick={() => setTab("growth")}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "growth"
              ? "border-b-2 border-red-500 text-red-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <TrendingUp size={16} />
          Gelişim Potansiyeli
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "completed" ? (
          <InsightAccordion
            items={completedInsights}
            defaultExpandedId="concept-comprehension"
          />
        ) : (
          <InsightAccordion
            items={growthInsights}
            defaultExpandedId="coaching-tips"
          />
        )}
      </div>
    </div>
  );
}
