import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeMondayCode } from "@/lib/monday-oauth";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/monday/oauth`;

  if (error) {
    return NextResponse.redirect(
      `${origin}/settings?monday_error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    const clientId = process.env.MONDAY_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        `${origin}/settings?monday_error=${encodeURIComponent("MONDAY_CLIENT_ID not configured")}`
      );
    }
    const url = `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    return NextResponse.redirect(url);
  }

  const data = await exchangeMondayCode(code, redirectUri);

  if (!data.access_token) {
    return NextResponse.redirect(
      `${origin}/settings?monday_error=${encodeURIComponent(data.error || "OAuth failed")}`
    );
  }

  let settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { userId: user.id } });
  }

  await prisma.settings.update({
    where: { userId: user.id },
    data: { mondayApiToken: data.access_token },
  });

  return NextResponse.redirect(
    `${origin}/settings?monday_connected=true`
  );
}
