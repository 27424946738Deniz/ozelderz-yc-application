import { notFound } from "next/navigation";
import RoadmapView from "@/components/RoadmapView";
import { getRoadmap } from "@/lib/roadmap-registry";

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roadmap = getRoadmap(id);

  if (!roadmap) notFound();

  return <RoadmapView roadmap={roadmap} />;
}
