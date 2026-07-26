"use client";

import { TrendingUp } from "lucide-react";
import type { MetricStatus } from "@/types";

interface MetricCardProps {
  id: string;
  label: string;
  value: string;
  status: MetricStatus;
  suggested: string;
  trend?: "up" | "down";
  selected?: boolean;
  onSelect?: (id: string) => void;
}

const statusColors: Record<MetricStatus, string> = {
  good: "text-green-600",
  warning: "text-red-600",
  bad: "text-red-600",
};

export default function MetricCard({
  id,
  label,
  value,
  status,
  suggested,
  trend,
  selected,
  onSelect,
}: MetricCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
        selected
          ? "border-red-300 bg-red-50 ring-2 ring-red-100"
          : "border-stone-100 bg-white hover:border-stone-200 hover:bg-stone-50"
      }`}
    >
      <span className="text-[11px] font-medium text-stone-500">{label}</span>
      <p className={`mt-0.5 text-base font-semibold ${statusColors[status]}`}>
        {value}
        {trend === "up" && (
          <TrendingUp
            size={12}
            className="ml-1 inline text-red-400"
            aria-hidden
          />
        )}
      </p>
      {(selected || status !== "good") && (
        <p className="mt-1 text-[10px] leading-snug text-stone-400">
          {suggested}
        </p>
      )}
    </button>
  );
}
