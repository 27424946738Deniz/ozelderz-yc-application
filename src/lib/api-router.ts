import { NextRequest, NextResponse } from "next/server";
import { buildLessonById, buildLessonFromTranscript, loadTranscript } from "@/lib/build-lesson-from-transcript";
import { buildLessonsCatalog } from "@/lib/build-lessons-catalog";
import { getLessonSnapshot } from "@/lib/lesson-snapshot-store";
import { getLessonsCatalog } from "@/lib/lessons-catalog-store";
import {
  getLessonMeta,
  loadLessonTranscript,
} from "@/lib/lesson-registry";
import { mockUser } from "@/lib/mock-data";
import {
  buildAllTeacherProfiles,
  getStudentProfileById,
} from "@/lib/profile-registry";
import { getStudentsCatalog } from "@/lib/students-catalog-store";
import { getRoadmap, listRoadmaps } from "@/lib/roadmap-registry";
import {
  isValidCredentials,
  SESSION_COOKIE_NAME,
  SESSION_TOKEN,
} from "@/lib/auth";
import { loadEnvFile, headMediaFromR2, readMediaChunkFromR2 } from "../../lib/r2";

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

    if (method !== "GET" && method !== "HEAD") {
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
      return handleStudentsList();
    }

    if (path === "teachers") {
      return NextResponse.json(buildAllTeacherProfiles());
    }

    if (path === "roadmap") {
      return NextResponse.json(listRoadmaps());
    }

    const studentMatch = path.match(/^students\/([^/]+)$/);
    if (studentMatch) {
      return handleStudentById(studentMatch[1]);
    }

    const lessonTranscriptMatch = path.match(/^lessons\/([^/]+)\/transcript$/);
    if (lessonTranscriptMatch) {
      return handleLessonTranscript(lessonTranscriptMatch[1]);
    }

    const lessonVideoMatch = path.match(/^lessons\/([^/]+)\/video$/);
    if (lessonVideoMatch) {
      return await handleLessonVideo(lessonVideoMatch[1], request, method);
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
  const cached = getLessonsCatalog();
  if (cached) {
    return NextResponse.json(cached);
  }

  console.warn("lessons-catalog.json missing — run npm run catalogs:generate");
  return NextResponse.json(buildLessonsCatalog());
}

function handleStudentsList() {
  const cached = getStudentsCatalog();
  if (cached) {
    return NextResponse.json(cached);
  }

  console.warn("students-catalog.json missing — run npm run catalogs:generate");
  return NextResponse.json([]);
}

function handleStudentById(id: string) {
  const student = getStudentProfileById(id);
  if (!student) {
    return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(student);
}

async function handleLessonById(id: string) {
  const cached = getLessonSnapshot(id);
  if (cached) {
    return NextResponse.json(cached);
  }

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

async function handleLessonVideo(
  id: string,
  request: NextRequest,
  method: string
) {
  const meta = getLessonMeta(id);
  if (!meta?.r2Key) {
    return NextResponse.json({ error: "Video bulunamadı" }, { status: 404 });
  }

  loadEnvFile();

  if (method === "HEAD") {
    const headers = await headMediaFromR2(meta.r2Key);
    return new NextResponse(null, { status: 200, headers });
  }

  const range = request.headers.get("range");
  const { body, status, headers } = await readMediaChunkFromR2(
    meta.r2Key,
    range
  );

  return new NextResponse(Buffer.from(body), { status, headers });
}

function handleRoadmapById(id: string) {
  const roadmap = getRoadmap(id);
  if (!roadmap) {
    return NextResponse.json({ error: "Yol haritası bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(roadmap);
}
