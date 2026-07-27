import { NextRequest, NextResponse } from "next/server";
import {
  buildLessonById,
  buildLessonFromTranscript,
  loadTranscript,
} from "@/lib/build-lesson-from-transcript";
import { evaluateLesson } from "@/lib/lesson-evaluation";
import { buildLessonPreview } from "@/lib/lesson-insights-builder";
import { inferLessonContext } from "@/lib/lesson-context";
import {
  buildLessonCatalogItem,
  discoverLessonMetas,
  getLessonMeta,
  loadLessonTranscript,
} from "@/lib/lesson-registry";
import { mockUser } from "@/lib/mock-data";
import {
  buildAllStudentProfiles,
  buildAllTeacherProfiles,
} from "@/lib/profile-registry";
import { getRoadmap, listRoadmaps } from "@/lib/roadmap-registry";
import { analyzeTranscript } from "@/lib/transcript-analytics";
import {
  isValidCredentials,
  SESSION_COOKIE_NAME,
  SESSION_TOKEN,
} from "@/lib/auth";

export async function handleApiRequest(
  request: NextRequest,
  method: string,
  segments: string[]
): Promise<NextResponse> {
  const path = segments.join("/");

  if (method === "POST" && path === "auth/login") {
    return handleLogin(request);
  }

  if (method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (path === "lesson") {
    return NextResponse.json(buildLessonFromTranscript());
  }

  if (path === "lessons") {
    return handleLessonsList();
  }

  if (path === "transcript") {
    const transcript = loadTranscript();
    return NextResponse.json({
      segments: transcript.segments,
      duration: transcript.duration,
      speakers: transcript.speakers,
    });
  }

  if (path === "user") {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return NextResponse.json(mockUser);
  }

  if (path === "students") {
    return NextResponse.json(buildAllStudentProfiles());
  }

  if (path === "teachers") {
    return NextResponse.json(buildAllTeacherProfiles());
  }

  if (path === "roadmap") {
    return NextResponse.json(listRoadmaps());
  }

  const lessonTranscriptMatch = path.match(/^lessons\/([^/]+)\/transcript$/);
  if (lessonTranscriptMatch) {
    return handleLessonTranscript(lessonTranscriptMatch[1]);
  }

  const lessonMatch = path.match(/^lessons\/([^/]+)$/);
  if (lessonMatch) {
    return handleLessonById(lessonMatch[1]);
  }

  const roadmapMatch = path.match(/^roadmap\/([^/]+)$/);
  if (roadmapMatch) {
    return handleRoadmapById(roadmapMatch[1]);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function handleLogin(request: NextRequest) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!isValidCredentials(username, password)) {
    return NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}

function handleLessonsList() {
  const lessons = discoverLessonMetas()
    .map((meta) => {
      const transcript = loadLessonTranscript(meta);
      const context = inferLessonContext(transcript, meta);
      const analysis = analyzeTranscript(transcript);
      const evaluation = evaluateLesson(transcript, context.student, context);
      const preview = buildLessonPreview(
        context,
        transcript,
        evaluation,
        analysis.partTitles,
        analysis.parts
      );
      return buildLessonCatalogItem(
        { ...meta, title: context.title, subject: context.subject },
        transcript,
        evaluation.score,
        preview,
        {
          teacherName: context.teacher.name,
          teacherTitle: context.teacher.title,
          teacherAvatar: context.teacher.avatar,
          studentName: context.student.name,
        }
      );
    })
    .sort((a, b) => (b.transcribedAt ?? "").localeCompare(a.transcribedAt ?? ""));

  return NextResponse.json(lessons);
}

async function handleLessonById(id: string) {
  const lesson = await buildLessonById(id);
  if (!lesson) {
    return NextResponse.json({ error: "Ders bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(lesson);
}

function handleLessonTranscript(id: string) {
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

function handleRoadmapById(id: string) {
  const roadmap = getRoadmap(id);
  if (!roadmap) {
    return NextResponse.json({ error: "Yol haritası bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(roadmap);
}
