import { NextResponse } from "next/server";
import { buildLessonById } from "@/lib/build-lesson-from-transcript";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lesson = await buildLessonById(id);

  if (!lesson) {
    return NextResponse.json({ error: "Ders bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(lesson);
}
