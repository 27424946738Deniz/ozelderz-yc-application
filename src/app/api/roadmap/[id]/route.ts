import { NextResponse } from "next/server";
import { getRoadmap } from "@/lib/roadmap-registry";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roadmap = getRoadmap(id);

  if (!roadmap) {
    return NextResponse.json({ error: "Yol haritası bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(roadmap);
}
