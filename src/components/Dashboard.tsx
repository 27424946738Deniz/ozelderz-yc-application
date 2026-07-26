"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Map } from "lucide-react";
import type { LessonData, UserData } from "@/types";
import { fetchLesson, fetchLessonById, fetchUser } from "@/lib/api";
import { VideoSeekProvider } from "@/context/VideoSeekContext";
import Header from "@/components/Header";
import VideoSection from "@/components/VideoSection";
import CoachingPanel from "@/components/CoachingPanel";
import TranscriptPanel from "@/components/TranscriptPanel";
import LessonInsights from "@/components/LessonInsights";
import Tabs from "@/components/ui/Tabs";

interface DashboardProps {
  lessonId?: string;
}

export default function Dashboard({ lessonId }: DashboardProps) {
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState("coaching");
  const [hasRoadmap, setHasRoadmap] = useState(false);

  useEffect(() => {
    Promise.all([
      lessonId ? fetchLessonById(lessonId) : fetchLesson(),
      fetchUser(),
    ])
      .then(([lessonData, userData]) => {
        setLesson(lessonData);
        setUser(userData);
      })
      .finally(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId) return;
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then((items: { lessonId: string }[]) =>
        setHasRoadmap(items.some((i) => i.lessonId === lessonId))
      )
      .catch(() => setHasRoadmap(false));
  }, [lessonId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center page-shell">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 spinner-brand border-t-transparent" />
          <span className="text-sm text-stone-500">Yükleniyor…</span>
        </div>
      </div>
    );
  }

  if (!lesson || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-500">Veri yüklenemedi.</p>
      </div>
    );
  }

  return (
    <VideoSeekProvider>
      <div className="min-h-screen page-shell">
        <Header user={user} activeNav="Dersler" />

        <div className="border-b border-stone-200/60 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              {lessonId && (
                <Link
                  href="/dersler"
                  className="mb-1 inline-block text-xs text-red-600 hover:underline"
                >
                  ← Tüm dersler
                </Link>
              )}
              <h1 className="truncate text-lg font-semibold text-stone-900">
                {lesson.title}
              </h1>
              <p className="mt-0.5 text-sm text-stone-500">
                {lesson.subject} · {Math.floor(lesson.duration / 60)} dk
                {lessonId && (
                  <span className="text-stone-400"> · {lessonId}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasRoadmap && lessonId && (
                <Link
                  href={`/yol-haritasi/${lessonId}`}
                  className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  <Map size={14} />
                  Yol haritası
                </Link>
              )}
              <Link
                href="/hocalar"
                className="hidden items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:border-red-200 hover:bg-red-50 sm:flex"
              >
                <img
                  src={lesson.teacher.avatar}
                  alt=""
                  className="h-5 w-5 rounded-full"
                />
                {lesson.teacher.name.split(" ")[0]}
              </Link>
              <Link
                href="/ogrenciler"
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:border-red-200 hover:bg-red-50"
              >
                <img
                  src={lesson.student.avatar}
                  alt=""
                  className="h-5 w-5 rounded-full"
                />
                {lesson.student.name.split(" ")[0]}
              </Link>
              <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                {lesson.lessonEvaluation.score}/10
              </span>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <VideoSection
                videoUrl={lesson.videoUrl}
                title={lesson.title}
                teacherName={lesson.teacher.name}
                teacherAvatar={lesson.teacher.avatar}
                statusPills={lesson.statusPills}
                videoType={lesson.videoType}
              />

              <Tabs
                tabs={[
                  { id: "coaching", label: "Koçluk" },
                  { id: "transcript", label: "Transkript" },
                ]}
                active={mainTab}
                onChange={setMainTab}
              />

              {mainTab === "coaching" && <CoachingPanel lesson={lesson} />}
              {mainTab === "transcript" && (
                <TranscriptPanel
                  lessonId={lessonId ?? lesson.id}
                  teacherName={lesson.teacher.name}
                  studentName={lesson.student.name}
                />
              )}
            </div>

            <aside className="lg:sticky lg:top-16 lg:self-start">
              <LessonInsights lesson={lesson} />
            </aside>
          </div>
        </main>
      </div>
    </VideoSeekProvider>
  );
}
