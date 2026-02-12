import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/triage-dismissals — returns all dismissed task IDs and notes
 */
export async function GET() {
  const dismissals = await prisma.triageDismissal.findMany();
  return NextResponse.json(dismissals);
}

/**
 * POST /api/triage-dismissals — dismiss a task or save notes
 * Body: { clickupTaskId, action, notes? }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clickupTaskId, action, notes } = body as {
    clickupTaskId: string;
    action: string;
    notes?: string;
  };

  if (!clickupTaskId || !action) {
    return NextResponse.json(
      { error: "clickupTaskId and action are required" },
      { status: 400 }
    );
  }

  const dismissal = await prisma.triageDismissal.upsert({
    where: { clickupTaskId },
    create: { clickupTaskId, action, notes: notes || "" },
    update: { action, notes: notes ?? undefined },
  });

  return NextResponse.json(dismissal);
}

/**
 * PUT /api/triage-dismissals — update notes on a task (without dismissing)
 * Body: { clickupTaskId, notes }
 */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { clickupTaskId, notes } = body as {
    clickupTaskId: string;
    notes: string;
  };

  if (!clickupTaskId) {
    return NextResponse.json(
      { error: "clickupTaskId is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.triageDismissal.findUnique({
    where: { clickupTaskId },
  });

  if (existing) {
    const updated = await prisma.triageDismissal.update({
      where: { clickupTaskId },
      data: { notes },
    });
    return NextResponse.json(updated);
  }

  // Create a record just for notes (no dismissal action yet)
  const created = await prisma.triageDismissal.create({
    data: { clickupTaskId, action: "noted", notes },
  });
  return NextResponse.json(created);
}

/**
 * DELETE /api/triage-dismissals — restore a dismissed task
 * Body: { clickupTaskId }
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { clickupTaskId } = body as { clickupTaskId: string };

  if (!clickupTaskId) {
    return NextResponse.json(
      { error: "clickupTaskId is required" },
      { status: 400 }
    );
  }

  await prisma.triageDismissal.deleteMany({
    where: { clickupTaskId },
  });

  return NextResponse.json({ ok: true });
}
