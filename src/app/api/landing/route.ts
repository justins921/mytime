import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LANDING_DEFAULTS, type LandingSections } from "@/lib/landing-defaults";

/**
 * GET /api/landing — return all landing page sections (public)
 * Merges DB overrides with defaults so the page always has content.
 */
export async function GET() {
  try {
    const rows = await prisma.landingPageSection.findMany();
    const sections: Record<string, unknown> = { ...LANDING_DEFAULTS };

    for (const row of rows) {
      try {
        sections[row.section] = JSON.parse(row.content);
      } catch {
        // skip invalid JSON
      }
    }

    return NextResponse.json(sections as LandingSections);
  } catch {
    // If DB is unavailable, return defaults
    return NextResponse.json(LANDING_DEFAULTS);
  }
}
