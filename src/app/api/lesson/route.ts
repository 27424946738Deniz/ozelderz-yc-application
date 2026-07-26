import { NextResponse } from "next/server";
import { buildLessonFromTranscript } from "@/lib/build-lesson-from-transcript";

export async function GET() {
  const lesson = buildLessonFromTranscript();
  return NextResponse.json(lesson);
}
