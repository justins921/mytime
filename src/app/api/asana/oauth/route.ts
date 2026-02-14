import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeAsanaCode } from "@/lib/asana-oauth";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/asana/oauth`;

  if (error) {
    return NextResponse.redirect(
      `${origin}/settings?asana_error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    const clientId = process.env.ASANA_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        `${origin}/settings?asana_error=${encodeURIComponent("ASANA_CLIENT_ID not configured")}`
      );
    }
    const url = `https://app.asana.com/-/oauth_authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    return NextResponse.redirect(url);
  }

  const data = await exchangeAsanaCode(code, redirectUri);

  if (data.error) {
    return NextResponse.redirect(
      `${origin}/settings?asana_error=${encodeURIComponent(data.error_description || data.error)}`
    );
  }

  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresIn = data.expires_in || 3600;

  if (!accessToken) {
    return NextResponse.redirect(
      `${origin}/settings?asana_error=${encodeURIComponent("Missing token in response")}`
    );
  }

  let settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { userId: user.id } });
  }

  await prisma.settings.update({
    where: { userId: user.id },
    data: {
      asanaApiToken: accessToken,
      asanaRefreshToken: refreshToken || "",
      asanaTokenExpiresAt: Math.floor(Date.now() / 1000) + expiresIn,
    },
  });

  return NextResponse.redirect(
    `${origin}/settings?asana_connected=true`
  );
}
