import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/auth/verify-email?token=...&email=...
 * Verifies a user's email address via the link sent on signup.
 * Redirects to login with a success message.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
  }

  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: `verify:${email}`,
      token,
    },
  });

  if (!record) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: `verify:${email}`, token },
    });
    return NextResponse.redirect(new URL("/login?error=expired-link", req.url));
  }

  // Mark email as verified
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  // Clean up the token
  await prisma.verificationToken.deleteMany({
    where: { identifier: `verify:${email}` },
  });

  return NextResponse.redirect(new URL("/login?verified=true", req.url));
}
