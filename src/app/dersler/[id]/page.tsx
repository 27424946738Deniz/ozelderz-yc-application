import Dashboard from "@/components/Dashboard";
import { getLessonSnapshot } from "@/lib/lesson-snapshot-store";
import { getStoredRoadmap } from "@/lib/roadmap-store";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LessonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const initialLesson = getLessonSnapshot(id);
  const hasRoadmap = Boolean(getStoredRoadmap(id));

  return (
    <Dashboard
      lessonId={id}
      initialLesson={initialLesson}
      initialHasRoadmap={hasRoadmap}
    />
  );
}
