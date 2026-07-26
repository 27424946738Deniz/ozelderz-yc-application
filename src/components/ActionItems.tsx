"use client";

import type { ActionItem } from "@/types";

interface ActionItemsProps {
  items: ActionItem[];
  embedded?: boolean;
}

export default function ActionItems({ items, embedded }: ActionItemsProps) {
  return (
    <ul className={`space-y-2 ${embedded ? "p-5" : ""}`}>
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/50 px-3 py-3"
        >
          <div className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-stone-300" />
          <div>
            <p className="text-sm text-stone-700">{item.text}</p>
            {item.assignee && (
              <p className="mt-0.5 text-xs text-stone-400">{item.assignee}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
