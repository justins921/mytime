import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, requireOwner } from "@/lib/auth-utils";

/**
 * GET /api/dev-notes — List dev notes (owner only)
 */
export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res!;

  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  const notes = await prisma.devNote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

/**
 * POST /api/dev-notes — Create a dev note (owner only)
 * Body: { content, pageUrl?, screenshot? }
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res!;

  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  const { content, pageUrl, screenshot } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const note = await prisma.devNote.create({
    data: {
      userId: user.id,
      content: content.trim(),
      pageUrl: pageUrl || null,
      screenshot: screenshot || null,
    },
  });

  return NextResponse.json(note);
}

/**
 * DELETE /api/dev-notes — Delete a dev note (owner only)
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res!;

  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.devNote.deleteMany({ where: { id, userId: user.id } });

  return NextResponse.json({ ok: true });
}
