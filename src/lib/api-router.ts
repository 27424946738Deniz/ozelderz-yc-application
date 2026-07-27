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
import { loadEnvFile, getMediaRedirectUrl, streamMediaFromR2 } from "../../lib/r2";

export async function handleApiRequest(
  request: NextRequest,
  method: string,
  segments: string[]
): Promise<NextResponse> {
  const path = segments.join("/");

  try {
    if (method === "POST" && path === "auth/login") {
      return await handleLogin(request);
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

    const lessonVideoMatch = path.match(/^lessons\/([^/]+)\/video$/);
    if (lessonVideoMatch) {
      return await handleLessonVideo(lessonVideoMatch[1], request);
    }

    const lessonMatch = path.match(/^lessons\/([^/]+)$/);
    if (lessonMatch) {
      return await handleLessonById(lessonMatch[1]);
    }

    const roadmapMatch = path.match(/^roadmap\/([^/]+)$/);
    if (roadmapMatch) {
      return handleRoadmapById(roadmapMatch[1]);
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error(`API error [${method} /api/${path}]:`, error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Sunucu hatası",
      },
      { status: 500 }
    );
  }
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

async function handleLessonVideo(id: string, request: NextRequest) {
  const meta = getLessonMeta(id);
  if (!meta?.r2Key) {
    return NextResponse.json({ error: "Video bulunamadı" }, { status: 404 });
  }

  loadEnvFile();

  const mode = request.nextUrl.searchParams.get("mode");

  // Default: redirect to presigned R2 URL (no Vercel bandwidth / timeout).
  // Fallback: ?mode=proxy streams capped byte ranges through our API.
  if (mode !== "proxy") {
    const url = await getMediaRedirectUrl(meta.r2Key);
    return NextResponse.redirect(url, 307);
  }

  const range = request.headers.get("range");
  const { body, status, headers } = await streamMediaFromR2(meta.r2Key, range);

  return new NextResponse(body, { status, headers });
}

function handleRoadmapById(id: string) {
  const roadmap = getRoadmap(id);
  if (!roadmap) {
    return NextResponse.json({ error: "Yol haritası bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(roadmap);
}
