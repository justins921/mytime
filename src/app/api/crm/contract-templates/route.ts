import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

// ─── Default starter templates ─────────────────────

const STARTER_TEMPLATES = [
  {
    name: "Freelance Retainer Agreement",
    content: `# Retainer Agreement

**Date:** {{date}}

**Between:** {{your_name}} ("Contractor")
**And:** {{client_name}} ("Client")
**Company:** {{client_company}}

---

## 1. Services

The Contractor agrees to provide professional services to the Client on a monthly retainer basis, as described below.

## 2. Scope of Work

{{scope_of_work}}

## 3. Compensation

{{payment_terms}}

Invoices are due within 14 days of receipt. Late payments accrue interest at 1.5% per month.

## 4. Term

This agreement begins on {{start_date}} and continues on a month-to-month basis. Either party may terminate with 30 days written notice.

## 5. Confidentiality

Both parties agree to keep confidential any proprietary information shared during the engagement.

## 6. Intellectual Property

All work product created under this agreement becomes the property of the Client upon full payment.

---

**Contractor Signature:** _________________________ Date: _________

**Client Signature:** _________________________ Date: _________

---
*This document is generated as a starting point and does not constitute legal advice. Please consult an attorney for your specific situation.*`,
  },
  {
    name: "Fixed-Price Project Contract",
    content: `# Project Contract

**Date:** {{date}}

**Between:** {{your_name}} ("Contractor")
**And:** {{client_name}} ("Client")
**Company:** {{client_company}}

---

## 1. Project Description

{{scope_of_work}}

## 2. Timeline

- **Start Date:** {{start_date}}
- **Estimated Completion:** {{end_date}}
- **Milestones:** As agreed upon separately

## 3. Compensation

{{payment_terms}}

## 4. Cancellation

If the Client cancels the project after work has begun, the Contractor retains all payments for completed milestones plus a pro-rated amount for work in progress.

## 5. Revisions

This project includes up to {{revision_rounds}} rounds of revisions. Additional revisions beyond this will be billed at the out-of-scope rate specified above.

## 6. Confidentiality

Both parties agree to keep confidential any proprietary information shared during the engagement.

## 7. Intellectual Property

All work product becomes the property of the Client upon full payment.

---

**Contractor Signature:** _________________________ Date: _________

**Client Signature:** _________________________ Date: _________

---
*This document is generated as a starting point and does not constitute legal advice. Please consult an attorney for your specific situation.*`,
  },
  {
    name: "Statement of Work (SOW)",
    content: `# Statement of Work

**Date:** {{date}}
**SOW Reference:** SOW-{{sow_number}}

**Prepared by:** {{your_name}}
**Prepared for:** {{client_name}}, {{client_company}}

---

## 1. Overview

This Statement of Work outlines the services, deliverables, and terms for the engagement between {{your_name}} and {{client_name}}.

## 2. Scope of Work

{{scope_of_work}}

## 3. Timeline

- **Kickoff:** {{start_date}}
- **Target Completion:** {{end_date}}
- **Weekly Check-in:** {{check_in_day}} at {{check_in_time}}

## 4. Compensation

{{payment_terms}}

Hours are tracked and reported weekly. The Client will be notified when usage approaches any defined caps.

## 5. Assumptions

- Client will provide timely feedback (within 2 business days)
- Client will designate a single point of contact
- Access to required tools and systems will be provided

## 6. Acceptance

By signing below, both parties agree to the terms outlined in this Statement of Work.

---

**Contractor Signature:** _________________________ Date: _________

**Client Signature:** _________________________ Date: _________

---
*This document is generated as a starting point and does not constitute legal advice. Please consult an attorney for your specific situation.*`,
  },
];

/**
 * Ensure the user has the 3 starter templates (created once, editable after).
 */
async function ensureStarterTemplates(userId: string) {
  const count = await prisma.contractTemplate.count({ where: { userId } });
  if (count === 0) {
    await prisma.contractTemplate.createMany({
      data: STARTER_TEMPLATES.map((t) => ({
        userId,
        name: t.name,
        content: t.content,
        isDefault: true,
      })),
    });
  }
}

/**
 * GET /api/crm/contract-templates — list user's templates
 */
export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  await ensureStarterTemplates(user.id);

  const templates = await prisma.contractTemplate.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, isDefault: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(templates);
}

/**
 * POST /api/crm/contract-templates — create a custom template
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { name, content } = body as { name: string; content: string };

  if (!name || !content) {
    return NextResponse.json({ error: "name and content are required" }, { status: 400 });
  }

  const template = await prisma.contractTemplate.create({
    data: { userId: user.id, name, content },
  });

  return NextResponse.json(template);
}

/**
 * PATCH /api/crm/contract-templates — update a template
 */
export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { id, name, content } = body as { id: string; name?: string; content?: string };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.contractTemplate.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (content !== undefined) data.content = content;

  const template = await prisma.contractTemplate.update({ where: { id }, data });
  return NextResponse.json(template);
}

/**
 * DELETE /api/crm/contract-templates — delete a template
 */
export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { id } = body as { id: string };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.contractTemplate.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  await prisma.contractTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
