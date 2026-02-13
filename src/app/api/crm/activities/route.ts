import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

/**
 * GET /api/crm/activities?contactId=xxx — list activities for a contact
 */
export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const contactId = req.nextUrl.searchParams.get("contactId");
  if (!contactId) {
    return NextResponse.json({ error: "contactId is required" }, { status: 400 });
  }

  // Verify contact belongs to user
  const contact = await prisma.cRMContact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const activities = await prisma.cRMActivity.findMany({
    where: { contactId, userId: user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(activities);
}

/**
 * POST /api/crm/activities — log an activity
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { contactId, type, title, description, date } = body as {
    contactId: string;
    type: string;
    title: string;
    description?: string;
    date?: string;
  };

  if (!contactId || !type || !title) {
    return NextResponse.json({ error: "contactId, type, and title are required" }, { status: 400 });
  }

  // Verify contact belongs to user
  const contact = await prisma.cRMContact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const activity = await prisma.cRMActivity.create({
    data: {
      userId: user.id,
      contactId,
      type,
      title,
      description: description || "",
      date: date ? new Date(date) : new Date(),
    },
  });

  // Update lastContactedAt on the contact
  await prisma.cRMContact.update({
    where: { id: contactId },
    data: { lastContactedAt: activity.date },
  });

  return NextResponse.json(activity);
}

/**
 * DELETE /api/crm/activities — delete an activity
 */
export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { id } = body as { id: string };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.cRMActivity.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  await prisma.cRMActivity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
