import Link from "next/link";
import type { LessonCatalogItem } from "@/types";
import Header from "@/components/Header";
import { getLessonsCatalog } from "@/lib/lessons-catalog-store";
import { resolveTeacherAvatar } from "@/lib/teacher-photos";

function sourceLabel(source: string) {
  if (source.includes("deepgram")) return "Deepgram";
  if (source.includes("whisperx")) return "WhisperX";
  return source;
}

function groupByTeacher(lessons: LessonCatalogItem[]) {
  const groups = new Map<string, LessonCatalogItem[]>();

  for (const lesson of lessons) {
    const key = lesson.teacherName;
    const list = groups.get(key) ?? [];
    list.push(lesson);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([teacherName, items]) => {
      const sorted = [...items].sort((a, b) =>
        (b.transcribedAt ?? "").localeCompare(a.transcribedAt ?? "")
      );
      const scores = sorted
        .map((l) => l.evaluationScore)
        .filter((s): s is number => s !== undefined);
      const avgScore =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
            10
          : undefined;

      return {
        teacherName,
        teacherTitle: sorted[0].teacherTitle,
        teacherAvatar: resolveTeacherAvatar(teacherName),
        subjects: [...new Set(sorted.map((l) => l.subject))],
        lessons: sorted,
        avgScore,
        totalMinutes: sorted.reduce((sum, l) => sum + l.durationMin, 0),
      };
    })
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName, "tr"));
}

function LessonCard({ lesson }: { lesson: LessonCatalogItem }) {
  return (
    <Link
      href={`/dersler/${lesson.id}`}
      prefetch
      className="block rounded-xl border border-stone-100 bg-white p-4 transition-colors hover:border-red-200 hover:bg-red-50/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-stone-900">{lesson.title}</h3>
          <p className="mt-0.5 text-sm text-stone-500">
            {lesson.studentName} · {lesson.durationMin} dk
          </p>
          <p className="mt-1 font-mono text-[11px] text-stone-400">
            {lesson.meetCode}
          </p>
        </div>
        {lesson.evaluationScore !== undefined && (
          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-700">
            {lesson.evaluationScore}/10
          </span>
        )}
      </div>

      {lesson.summaryBrief && (
        <p className="mt-2 text-sm leading-relaxed text-stone-600 line-clamp-2">
          {lesson.summaryBrief}
        </p>
      )}

      {lesson.topTopics && lesson.topTopics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {lesson.topTopics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
          {lesson.subject}
        </span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
          {sourceLabel(lesson.transcriptSource)}
        </span>
        {lesson.transcribedAt && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
            {lesson.transcribedAt.slice(0, 10)}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function LessonsPage() {
  const lessons = getLessonsCatalog() ?? [];
  const teacherGroups = groupByTeacher(lessons);

  return (
    <div className="min-h-screen page-shell">
      <Header activeNav="Dersler" />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-stone-900">
            Transkript İnceleme
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {lessons.length} ders · {teacherGroups.length} hoca
          </p>
        </div>

        <div className="space-y-8">
          {teacherGroups.map((group) => (
            <section key={group.teacherName}>
              <div className="panel mb-3 flex items-center gap-4 p-4">
                <img
                  src={group.teacherAvatar}
                  alt={group.teacherName}
                  className="h-12 w-12 rounded-xl bg-stone-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-stone-900">
                    {group.teacherName}
                  </h2>
                  <p className="text-sm text-stone-500">
                    {group.teacherTitle}
                    {group.subjects.length > 0 &&
                      ` · ${group.subjects.join(", ")}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-stone-800">
                    {group.lessons.length} ders
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {group.totalMinutes} dk
                    {group.avgScore !== undefined && ` · ort. ${group.avgScore}`}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pl-1 sm:pl-3">
                {group.lessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {lessons.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">
            Henüz transkript yok.{" "}
            <code className="text-xs">npm run catalogs:generate</code> ile
            katalog oluşturun.
          </p>
        )}
      </main>
    </div>
  );
}
