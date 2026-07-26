import { NextResponse } from "next/server";
import { loadTranscript } from "@/lib/build-lesson-from-transcript";

export async function GET() {
  const transcript = loadTranscript();
  return NextResponse.json({
    segments: transcript.segments,
    duration: transcript.duration,
    speakers: transcript.speakers,
  });
}
