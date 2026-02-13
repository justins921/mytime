import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeMicrosoftCode, getUserEmail, OUTLOOK_SCOPES } from "@/lib/outlook";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/outlook/oauth`;

  if (error) {
    return NextResponse.redirect(
      `${origin}/settings?outlook_error=${encodeURIComponent(error)}`
    );
  }

  // No code = start OAuth flow
  if (!code) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        `${origin}/settings?outlook_error=${encodeURIComponent("MICROSOFT_CLIENT_ID not configured")}`
      );
    }
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(OUTLOOK_SCOPES)}&response_mode=query`;
    return NextResponse.redirect(url);
  }

  // Exchange code for tokens
  const data = await exchangeMicrosoftCode(code, redirectUri);

  if (data.error) {
    return NextResponse.redirect(
      `${origin}/settings?outlook_error=${encodeURIComponent(data.error_description || data.error)}`
    );
  }

  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
  const scope = data.scope || "";

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(
      `${origin}/settings?outlook_error=${encodeURIComponent("Missing tokens. Try reconnecting.")}`
    );
  }

  const email = await getUserEmail(accessToken);
  if (!email) {
    return NextResponse.redirect(
      `${origin}/settings?outlook_error=${encodeURIComponent("Could not determine email address")}`
    );
  }

  await prisma.outlookAccount.upsert({
    where: { userId_email: { userId: user.id, email } },
    update: { accessToken, refreshToken, expiresAt, scope },
    create: { email, accessToken, refreshToken, expiresAt, scope, userId: user.id },
  });

  return NextResponse.redirect(
    `${origin}/settings?outlook_connected=${encodeURIComponent(email)}`
  );
}
