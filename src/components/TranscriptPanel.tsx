"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { TranscriptData } from "@/types/transcript";
import { useVideoSeek } from "@/context/VideoSeekContext";
import { Panel } from "@/components/ui/Tabs";

interface TranscriptPanelProps {
  teacherName: string;
  studentName: string;
  lessonId?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function speakerLabel(
  speaker: string | undefined,
  teacherName: string,
  studentName: string
) {
  if (speaker === "SPEAKER_00") return teacherName.split(" ")[0];
  if (speaker === "SPEAKER_01") return studentName.split(" ")[0];
  return "?";
}

export default function TranscriptPanel({
  teacherName,
  studentName,
  lessonId,
}: TranscriptPanelProps) {
  const { seekTo } = useVideoSeek();
  const [query, setQuery] = useState("");
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = lessonId
      ? `/api/lessons/${lessonId}/transcript`
      : "/api/transcript";
    fetch(url)
      .then((res) => res.json())
      .then(setTranscript)
      .finally(() => setLoading(false));
  }, [lessonId]);

  const filtered = useMemo(() => {
    if (!transcript) return [];
    const q = query.trim().toLowerCase();
    if (!q) return transcript.segments;
    return transcript.segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [query, transcript]);

  if (loading) {
    return (
      <Panel>
        <p className="py-12 text-center text-sm text-stone-400">Yükleniyor…</p>
      </Panel>
    );
  }

  if (!transcript) return null;

  return (
    <Panel
      title="Ders Transkripti"
      description={`${transcript.segments.length} segment · tıklayarak videoda o ana git`}
      noPadding
    >
      <div className="border-b border-stone-100 px-4 py-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="search"
            placeholder="Ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm text-stone-700 placeholder:text-stone-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>
      </div>

      <div className="max-h-[480px] overflow-y-auto px-2 py-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">Sonuç yok</p>
        ) : (
          <ul className="divide-y divide-stone-50">
            {filtered.map((seg, i) => {
              const isTeacher = seg.speaker === "SPEAKER_00";
              return (
                <li key={`${seg.start}-${i}`}>
                  <button
                    type="button"
                    onClick={() => seekTo(seg.start)}
                    className="group flex w-full gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-stone-50"
                  >
                    <span className="shrink-0 pt-0.5 font-mono text-[11px] tabular-nums text-red-500">
                      {formatTime(seg.start)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          isTeacher ? "text-red-600" : "text-sky-600"
                        }`}
                      >
                        {speakerLabel(seg.speaker, teacherName, studentName)}
                      </span>
                      <p className="text-sm leading-relaxed text-stone-600">
                        {seg.text}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
