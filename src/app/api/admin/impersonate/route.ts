import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

const COOKIE_NAME = "impersonate_user_id";

/**
 * POST /api/admin/impersonate — start impersonating a user (admin only)
 * Body: { userId }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Don't allow impersonating yourself
  if (userId === admin.id) {
    return NextResponse.json({ error: "Cannot impersonate yourself" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour max
  });

  return NextResponse.json({ ok: true, user: target });
}

/**
 * DELETE /api/admin/impersonate — stop impersonating
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({ ok: true });
}

/**
 * GET /api/admin/impersonate — check current impersonation status
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ impersonating: false });
  }

  const cookieStore = await cookies();
  const targetId = cookieStore.get(COOKIE_NAME)?.value;

  if (!targetId) {
    return NextResponse.json({ impersonating: false });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, email: true, plan: true, role: true },
  });

  if (!target) {
    cookieStore.delete(COOKIE_NAME);
    return NextResponse.json({ impersonating: false });
  }

  return NextResponse.json({
    impersonating: true,
    user: target,
    adminName: admin.name || admin.email,
  });
}
