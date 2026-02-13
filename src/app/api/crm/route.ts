import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

/**
 * GET /api/crm — list user's CRM contacts
 * Query: ?stage=lead — filter by stage
 */
export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const stage = req.nextUrl.searchParams.get("stage");
  const where: Record<string, unknown> = { userId: user.id };
  if (stage) where.stage = stage;

  const contacts = await prisma.cRMContact.findMany({
    where,
    include: {
      activities: {
        orderBy: { date: "desc" },
        take: 1,
        select: { id: true, type: true, title: true, date: true },
      },
      _count: { select: { activities: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(contacts);
}

/**
 * POST /api/crm — create a new contact
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { name, email, phone, company, website, stage, source, estimatedValue, notes } = body as {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    website?: string;
    stage?: string;
    source?: string;
    estimatedValue?: number;
    notes?: string;
  };

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const contact = await prisma.cRMContact.create({
    data: {
      userId: user.id,
      name,
      email: email || "",
      phone: phone || "",
      company: company || "",
      website: website || "",
      stage: stage || "lead",
      source: source || "other",
      estimatedValue: estimatedValue || 0,
      notes: notes || "",
    },
    include: {
      activities: { orderBy: { date: "desc" }, take: 1, select: { id: true, type: true, title: true, date: true } },
      _count: { select: { activities: true } },
    },
  });

  return NextResponse.json(contact);
}

/**
 * PATCH /api/crm — update a contact
 */
export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { id, ...updates } = body as {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    website?: string;
    stage?: string;
    source?: string;
    estimatedValue?: number;
    notes?: string;
    linkedClientId?: string | null;
    lastContactedAt?: string | null;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Ensure contact belongs to user
  const existing = await prisma.cRMContact.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.email !== undefined) data.email = updates.email;
  if (updates.phone !== undefined) data.phone = updates.phone;
  if (updates.company !== undefined) data.company = updates.company;
  if (updates.website !== undefined) data.website = updates.website;
  if (updates.stage !== undefined) data.stage = updates.stage;
  if (updates.source !== undefined) data.source = updates.source;
  if (updates.estimatedValue !== undefined) data.estimatedValue = updates.estimatedValue;
  if (updates.notes !== undefined) data.notes = updates.notes;
  if (updates.linkedClientId !== undefined) data.linkedClientId = updates.linkedClientId;
  if (updates.lastContactedAt !== undefined) {
    data.lastContactedAt = updates.lastContactedAt ? new Date(updates.lastContactedAt) : null;
  }

  const contact = await prisma.cRMContact.update({
    where: { id },
    data,
    include: {
      activities: { orderBy: { date: "desc" }, take: 1, select: { id: true, type: true, title: true, date: true } },
      _count: { select: { activities: true } },
    },
  });

  return NextResponse.json(contact);
}

/**
 * DELETE /api/crm — delete a contact
 */
export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { id } = body as { id: string };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.cRMContact.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  await prisma.cRMContact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
