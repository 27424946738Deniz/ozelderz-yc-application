"use client";

import { useParams } from "next/navigation";
import Dashboard from "@/components/Dashboard";

export default function LessonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <Dashboard lessonId={id} />;
}
