import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeClickUpCode } from "@/lib/clickup-oauth";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const origin = req.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(
      `${origin}/settings?clickup_error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    const clientId = process.env.CLICKUP_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        `${origin}/settings?clickup_error=${encodeURIComponent("CLICKUP_CLIENT_ID not configured")}`
      );
    }
    const redirectUri = `${origin}/api/clickup/oauth`;
    const url = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    return NextResponse.redirect(url);
  }

  const data = await exchangeClickUpCode(code);

  if (!data.access_token) {
    return NextResponse.redirect(
      `${origin}/settings?clickup_error=${encodeURIComponent(data.error || data.err || "OAuth failed")}`
    );
  }

  let settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { userId: user.id } });
  }

  await prisma.settings.update({
    where: { userId: user.id },
    data: { clickupApiToken: data.access_token },
  });

  return NextResponse.redirect(
    `${origin}/settings?clickup_connected=true`
  );
}
