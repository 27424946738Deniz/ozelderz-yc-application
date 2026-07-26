import Dashboard from "@/components/Dashboard";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Dashboard lessonId={id} />;
}
