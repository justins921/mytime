import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/signup"
    || pathname === "/forgot-password" || pathname === "/reset-password"
    || pathname === "/privacy" || pathname === "/terms";
  const isAuthApi = pathname.startsWith("/api/auth");
  const isPublicApi = pathname === "/api/stripe/webhook" || pathname === "/api/landing"
    || pathname === "/api/kb";

  if (isAuthApi || isPublicApi) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/schedule", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
