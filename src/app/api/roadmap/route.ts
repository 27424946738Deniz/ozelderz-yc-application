import { NextResponse } from "next/server";
import { listRoadmaps } from "@/lib/roadmap-registry";

export async function GET() {
  return NextResponse.json(listRoadmaps());
}
