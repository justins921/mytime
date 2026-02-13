import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export const GET = handlers.GET;

// Wrap POST to add rate limiting on login attempts
export async function POST(req: NextRequest) {
  // Rate limit: 10 login attempts per IP per 15 minutes
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (limited) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  return handlers.POST(req);
}
