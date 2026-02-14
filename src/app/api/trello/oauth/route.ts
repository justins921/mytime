import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { getTrelloAuthorizeUrl } from "@/lib/trello-oauth";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const origin = req.nextUrl.origin;
  const apiKey = process.env.TRELLO_API_KEY;

  if (!apiKey) {
    return NextResponse.redirect(
      `${origin}/settings?trello_error=${encodeURIComponent("TRELLO_API_KEY not configured")}`
    );
  }

  const returnUrl = `${origin}/trello-callback`;
  const url = getTrelloAuthorizeUrl(returnUrl);
  return NextResponse.redirect(url);
}

// POST: receives the token from the client-side callback page
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  // Validate the token by making a test API call
  const apiKey = process.env.TRELLO_API_KEY || "";
  const testRes = await fetch(
    `https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`
  );
  if (!testRes.ok) {
    return NextResponse.json({ error: "Invalid Trello token" }, { status: 400 });
  }

  let settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { userId: user.id } });
  }

  await prisma.settings.update({
    where: { userId: user.id },
    data: { trelloApiToken: token },
  });

  return NextResponse.json({ ok: true });
}
