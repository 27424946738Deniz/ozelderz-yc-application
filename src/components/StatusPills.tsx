"use client";

import { Check } from "lucide-react";
import type { StatusPill } from "@/types";

interface StatusPillsProps {
  pills: StatusPill[];
}

export default function StatusPills({ pills }: StatusPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
      {pills.map((pill) => (
        <div key={pill.id} className="flex items-center gap-2">
          <span className="text-xs text-stone-500">{pill.label}</span>
          {pill.type === "success" ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50">
              <Check size={12} className="text-green-600" strokeWidth={3} />
            </span>
          ) : pill.type === "score" ? (
            <span
              className={`text-sm font-semibold tabular-nums ${
                pill.id === "attention" && pill.value === "N/A"
                  ? "text-red-500"
                  : "text-red-600"
              }`}
            >
              {pill.value}
            </span>
          ) : (
            <span className="text-sm font-medium text-stone-600">
              {pill.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
