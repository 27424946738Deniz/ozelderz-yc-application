import { NextResponse } from "next/server";
import {
  getLessonMeta,
  loadLessonTranscript,
} from "@/lib/lesson-registry";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meta = getLessonMeta(id);

  if (!meta) {
    return NextResponse.json({ error: "Transkript bulunamadı" }, { status: 404 });
  }

  const transcript = loadLessonTranscript(meta);
  return NextResponse.json({
    segments: transcript.segments,
    duration: transcript.duration,
    speakers: transcript.speakers,
    source: transcript.source,
  });
}
