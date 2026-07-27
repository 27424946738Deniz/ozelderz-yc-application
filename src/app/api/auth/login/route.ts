import { NextResponse } from "next/server";
import {
  isValidCredentials,
  SESSION_COOKIE_NAME,
  SESSION_TOKEN,
} from "@/lib/auth";

export async function POST(request: Request) {
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
