import { NextResponse } from "next/server";
import { mockUser } from "@/lib/mock-data";

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return NextResponse.json(mockUser);
}
