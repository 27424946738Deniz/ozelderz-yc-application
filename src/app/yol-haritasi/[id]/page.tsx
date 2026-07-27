"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { LessonRoadmap } from "@/types/roadmap";
import RoadmapView from "@/components/RoadmapView";
import Header from "@/components/Header";

export default function RoadmapDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [roadmap, setRoadmap] = useState<LessonRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/roadmap/${id}`)
      .then((res) => {
        if (!res.ok) {
          setMissing(true);
          return null;
        }
        return res.json() as Promise<LessonRoadmap>;
      })
      .then((data) => setRoadmap(data))
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center page-shell">
        <div className="h-7 w-7 animate-spin rounded-full border-2 spinner-brand border-t-transparent" />
      </div>
    );
  }

  if (missing || !roadmap) {
    return (
      <div className="min-h-screen page-shell">
        <Header activeNav="Yol Haritası" />
        <main className="mx-auto max-w-3xl px-4 py-12 text-center text-stone-500">
          Yol haritası bulunamadı.{" "}
          <Link href="/yol-haritasi" className="text-red-600 hover:underline">
            Listeye dön
          </Link>
        </main>
      </div>
    );
  }

  return <RoadmapView roadmap={roadmap} />;
}
