import { NextResponse } from "next/server";
import { buildAllTeacherProfiles } from "@/lib/profile-registry";

export async function GET() {
  const teachers = buildAllTeacherProfiles();
  return NextResponse.json(teachers);
}
