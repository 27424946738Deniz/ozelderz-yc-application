"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";
import type { RoadmapCatalogItem } from "@/types/roadmap";
import { fetchUser } from "@/lib/api";
import { mockUser } from "@/lib/mock-data";
import type { UserData } from "@/types";
import Header from "@/components/Header";

export default function RoadmapListPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [roadmaps, setRoadmaps] = useState<RoadmapCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchUser().catch(() => mockUser),
      fetch("/api/roadmap").then((r) => r.json()),
    ])
      .then(([userData, roadmapData]) => {
        setUser(userData);
        setRoadmaps(roadmapData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center page-shell">
        <div className="h-7 w-7 animate-spin rounded-full border-2 spinner-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-shell">
      <Header user={user} activeNav="Yol Haritası" />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-red-600">
            <Map size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Roadmap
            </span>
          </div>
          <h1 className="mt-2 text-xl font-semibold text-stone-900">
            Öğretmen & öğrenci yol haritaları
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Tanışma dersinden çıkarılan mizaç ve müfredat sinyallerine göre ay
            ay checkpoint&apos;ler. Her testte skor gir — geçersen ilerle,
            geçemezsen mizaç bazlı retry branch açılır.
          </p>
        </div>

        <div className="space-y-3">
          {roadmaps.map((r) => (
            <Link
              key={r.lessonId}
              href={`/yol-haritasi/${r.lessonId}`}
              className="panel block p-5 transition-colors hover:border-red-200 hover:bg-red-50/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-stone-900">{r.title}</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {r.teacherName} → {r.studentName} · {r.subject}
                  </p>
                  <p className="mt-2 text-xs text-stone-400">
                    {r.phaseCount} faz · {r.checkpointCount} checkpoint
                  </p>
                </div>
                <ArrowRight size={18} className="mt-1 shrink-0 text-red-400" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
