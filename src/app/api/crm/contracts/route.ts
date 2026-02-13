import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

/**
 * GET /api/crm/contracts?contactId=xxx — list contracts for a contact (or all)
 */
export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const contactId = req.nextUrl.searchParams.get("contactId");
  const where: Record<string, unknown> = { userId: user.id };
  if (contactId) where.contactId = contactId;

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      contact: { select: { id: true, name: true, company: true } },
      template: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(contracts);
}

/**
 * POST /api/crm/contracts — generate a contract from a template
 * Body: { contactId, templateId, name?, overrides?: Record<string, string> }
 *
 * overrides lets the user supply values for custom merge fields
 * that can't be auto-filled from the contact.
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { contactId, templateId, name, overrides } = body as {
    contactId: string;
    templateId: string;
    name?: string;
    overrides?: Record<string, string>;
  };

  if (!contactId || !templateId) {
    return NextResponse.json({ error: "contactId and templateId are required" }, { status: 400 });
  }

  // Load contact
  const contact = await prisma.cRMContact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  // Load template
  const template = await prisma.contractTemplate.findFirst({ where: { id: templateId, userId: user.id } });
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Load linked client for rate/retainer data
  let client = null;
  if (contact.linkedClientId) {
    client = await prisma.client.findFirst({ where: { id: contact.linkedClientId, userId: user.id } });
  }

  // Build merge field values
  const now = new Date();
  const fields: Record<string, string> = {
    date: now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    your_name: user.name || "Your Name",
    client_name: contact.name,
    client_email: contact.email,
    client_phone: contact.phone,
    client_company: contact.company || "N/A",
    client_website: contact.website,
    estimated_value: contact.estimatedValue.toLocaleString(),
    // Client-linked fields
    retainer_monthly: client?.retainerMonthly?.toLocaleString() || "TBD",
    hourly_rate: client?.baselineRateHourly?.toLocaleString() || "TBD",
    monthly_cap_hours: client?.monthlyCapHours?.toString() || "TBD",
    weekly_target_hours: client?.weeklyTargetHours?.toString() || "TBD",
    // Overrides (user-supplied values for custom fields)
    ...overrides,
  };

  // Render template — replace {{field}} with values, leave unresolved ones as-is
  let content = template.content;
  for (const [key, value] of Object.entries(fields)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  const contractName = name || `${template.name} — ${contact.name}`;

  const contract = await prisma.contract.create({
    data: {
      userId: user.id,
      contactId,
      templateId,
      name: contractName,
      content,
    },
    include: {
      contact: { select: { id: true, name: true, company: true } },
      template: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(contract);
}

/**
 * PATCH /api/crm/contracts — update a contract (edit content, change status)
 */
export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { id, name, content, status } = body as {
    id: string;
    name?: string;
    content?: string;
    status?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.contract.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (content !== undefined) data.content = content;
  if (status !== undefined) {
    data.status = status;
    if (status === "sent" && !existing.sentAt) data.sentAt = new Date();
    if (status === "signed" && !existing.signedAt) data.signedAt = new Date();
  }

  const contract = await prisma.contract.update({
    where: { id },
    data,
    include: {
      contact: { select: { id: true, name: true, company: true } },
      template: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(contract);
}

/**
 * DELETE /api/crm/contracts — delete a contract
 */
export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { id } = body as { id: string };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.contract.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
