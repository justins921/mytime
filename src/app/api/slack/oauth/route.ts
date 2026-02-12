import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeOAuthCode, SLACK_USER_SCOPES } from "@/lib/slack";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/slack/oauth`;

  if (error) {
    return NextResponse.redirect(
      `${origin}/settings?slack_error=${encodeURIComponent(error)}`
    );
  }

  // No code = start OAuth flow
  if (!code) {
    const clientId = process.env.SLACK_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        `${origin}/settings?slack_error=${encodeURIComponent("SLACK_CLIENT_ID not configured")}`
      );
    }
    const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=${SLACK_USER_SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    return NextResponse.redirect(url);
  }

  // Exchange code for token
  const data = await exchangeOAuthCode(code, redirectUri);

  if (!data.ok) {
    return NextResponse.redirect(
      `${origin}/settings?slack_error=${encodeURIComponent(data.error || "OAuth failed")}`
    );
  }

  const teamId = data.team?.id;
  const teamName = data.team?.name || "Unknown";
  const accessToken = data.authed_user?.access_token;
  const scope = data.authed_user?.scope || "";

  if (!teamId || !accessToken) {
    return NextResponse.redirect(
      `${origin}/settings?slack_error=${encodeURIComponent("Missing team or token in response")}`
    );
  }

  await prisma.slackWorkspace.upsert({
    where: { teamId },
    update: { teamName, accessToken, scope },
    create: { teamId, teamName, accessToken, scope },
  });

  return NextResponse.redirect(
    `${origin}/settings?slack_connected=${encodeURIComponent(teamName)}`
  );
}
