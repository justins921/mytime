import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeNotionCode } from "@/lib/notion-oauth";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/notion/oauth`;

  if (error) {
    return NextResponse.redirect(
      `${origin}/settings?notion_error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    const clientId = process.env.NOTION_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        `${origin}/settings?notion_error=${encodeURIComponent("NOTION_CLIENT_ID not configured")}`
      );
    }
    const url = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;
    return NextResponse.redirect(url);
  }

  const data = await exchangeNotionCode(code, redirectUri);

  if (data.error) {
    return NextResponse.redirect(
      `${origin}/settings?notion_error=${encodeURIComponent(data.error)}`
    );
  }

  const accessToken = data.access_token;
  const workspaceId = data.workspace_id;
  const workspaceName = data.workspace_name || "Notion Workspace";
  const botId = data.bot_id || "";
  const workspaceIcon = data.workspace_icon || "";

  if (!accessToken || !workspaceId) {
    return NextResponse.redirect(
      `${origin}/settings?notion_error=${encodeURIComponent("Missing workspace info in response")}`
    );
  }

  await prisma.notionWorkspace.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    update: { workspaceName, accessToken, botId, icon: workspaceIcon },
    create: { workspaceId, workspaceName, accessToken, botId, icon: workspaceIcon, userId: user.id },
  });

  return NextResponse.redirect(
    `${origin}/settings?notion_connected=${encodeURIComponent(workspaceName)}`
  );
}
