import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireManager } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { LANDING_DEFAULTS, type LandingSections } from "@/lib/landing-defaults";

/**
 * GET /api/admin/landing — return all sections with DB overrides (admin only)
 */
export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;
  const denied = requireManager(user);
  if (denied) return denied;

  const rows = await prisma.landingPageSection.findMany();
  const sections: Record<string, unknown> = { ...LANDING_DEFAULTS };

  for (const row of rows) {
    try {
      sections[row.section] = JSON.parse(row.content);
    } catch {
      // skip
    }
  }

  return NextResponse.json(sections as LandingSections);
}

/**
 * PATCH /api/admin/landing — update a single section
 * Body: { section: string, content: object }
 */
export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;
  const denied = requireManager(user);
  if (denied) return denied;

  const body = await req.json();
  const { section, content } = body as { section: keyof LandingSections; content: unknown };

  if (!section || !content) {
    return NextResponse.json({ error: "section and content are required" }, { status: 400 });
  }

  if (!(section in LANDING_DEFAULTS)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const contentJson = JSON.stringify(content);

  const result = await prisma.landingPageSection.upsert({
    where: { section },
    update: { content: contentJson },
    create: { section, content: contentJson },
  });

  return NextResponse.json({ section: result.section, content: JSON.parse(result.content) });
}

/**
 * DELETE /api/admin/landing — reset a section to defaults
 * Body: { section: string }
 */
export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;
  const denied = requireManager(user);
  if (denied) return denied;

  const body = await req.json();
  const { section } = body as { section: string };

  if (!section) {
    return NextResponse.json({ error: "section is required" }, { status: 400 });
  }

  try {
    await prisma.landingPageSection.delete({ where: { section } });
  } catch {
    // already doesn't exist
  }

  return NextResponse.json({ ok: true });
}
