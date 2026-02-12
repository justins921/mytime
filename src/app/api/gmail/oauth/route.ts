import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeGoogleCode, getUserEmail, GMAIL_SCOPES } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/gmail/oauth`;

  if (error) {
    return NextResponse.redirect(
      `${origin}/settings?gmail_error=${encodeURIComponent(error)}`
    );
  }

  // No code = start OAuth flow
  if (!code) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        `${origin}/settings?gmail_error=${encodeURIComponent("GOOGLE_CLIENT_ID not configured")}`
      );
    }
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(GMAIL_SCOPES)}&access_type=offline&prompt=consent`;
    return NextResponse.redirect(url);
  }

  // Exchange code for tokens
  const data = await exchangeGoogleCode(code, redirectUri);

  if (data.error) {
    return NextResponse.redirect(
      `${origin}/settings?gmail_error=${encodeURIComponent(data.error_description || data.error)}`
    );
  }

  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
  const scope = data.scope || "";

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(
      `${origin}/settings?gmail_error=${encodeURIComponent("Missing tokens in response. Try disconnecting and reconnecting.")}`
    );
  }

  // Get user's email address
  const email = await getUserEmail(accessToken);
  if (!email) {
    return NextResponse.redirect(
      `${origin}/settings?gmail_error=${encodeURIComponent("Could not determine email address")}`
    );
  }

  await prisma.gmailAccount.upsert({
    where: { email },
    update: { accessToken, refreshToken, expiresAt, scope },
    create: { email, accessToken, refreshToken, expiresAt, scope },
  });

  return NextResponse.redirect(
    `${origin}/settings?gmail_connected=${encodeURIComponent(email)}`
  );
}
