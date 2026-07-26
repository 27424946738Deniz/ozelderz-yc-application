"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Send, Sparkles } from "lucide-react";

interface AskScribeProps {
  prompts: string[];
}

export default function AskScribe({ prompts }: AskScribeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="card-border shadow-sm">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <h3 className="text-base font-semibold text-stone-800">Ders Asistanı</h3>
        {collapsed ? (
          <ChevronDown size={18} className="text-stone-400" />
        ) : (
          <ChevronUp size={18} className="text-stone-400" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-4 border-t border-red-50 px-5 pb-5 pt-4">
          <p className="text-sm leading-relaxed text-stone-500">
            Ders tartışmalarının özetlerini alın, sorularınıza yanıt bulun ve
            önemli noktalar hakkında içgörüler edinin.
          </p>

          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-400" />
            <span className="text-sm font-medium text-stone-700">
              Ne öğrenmek istersiniz?
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setMessage(prompt)}
                className="rounded-full border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-red-100 bg-white p-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Asistana mesaj yazın..."
              rows={2}
              className="w-full resize-none text-sm text-stone-700 outline-none placeholder:text-stone-400"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-stone-400">
                40/40 kalan kredi
              </span>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
