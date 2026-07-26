import { NextResponse } from "next/server";
import { buildAllStudentProfiles } from "@/lib/profile-registry";

export async function GET() {
  const students = buildAllStudentProfiles();
  return NextResponse.json(students);
}
