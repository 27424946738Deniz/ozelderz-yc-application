import { NextRequest, NextResponse } from "next/server";
import { getLessonMeta } from "@/lib/lesson-registry";
import {
  getPresignedMediaUrl,
  headMediaFromR2,
  loadEnvFile,
} from "../../../../../../lib/r2";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function HEAD(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const meta = getLessonMeta(id);
  if (!meta?.r2Key) {
    return NextResponse.json({ error: "Video bulunamadı" }, { status: 404 });
  }

  try {
    loadEnvFile();
    const headers = await headMediaFromR2(meta.r2Key);
    return new NextResponse(null, { status: 200, headers });
  } catch (error) {
    console.error(`Video HEAD error [${id}]:`, error);
    return NextResponse.json({ error: "Video başlığı alınamadı" }, { status: 500 });
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const meta = getLessonMeta(id);
  if (!meta?.r2Key) {
    return NextResponse.json({ error: "Video bulunamadı" }, { status: 404 });
  }

  try {
    loadEnvFile();
    const url = await getPresignedMediaUrl(meta.r2Key, 60 * 60 * 6);
    return NextResponse.redirect(url, 307);
  } catch (error) {
    console.error(`Video redirect error [${id}]:`, error);
    return NextResponse.json({ error: "Video yüklenemedi" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
