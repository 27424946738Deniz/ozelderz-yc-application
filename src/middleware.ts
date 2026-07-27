import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isAuthenticated,
  SESSION_COOKIE_NAME,
  SESSION_TOKEN,
} from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authed = isAuthenticated(session);

  if (pathname === "/login" && authed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (authed) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|branding/).*)",
  ],
};
