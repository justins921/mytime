import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID || "";
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET || "";
const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI || "";

// GET: initiate OAuth or handle callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    // Redirect to Notion OAuth consent page
    const params = new URLSearchParams({
      client_id: NOTION_CLIENT_ID,
      response_type: "code",
      owner: "user",
      redirect_uri: NOTION_REDIRECT_URI,
    });
    return NextResponse.redirect(`https://api.notion.com/v1/oauth/authorize?${params.toString()}`);
  }

  // Exchange code for token
  const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: NOTION_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return NextResponse.redirect(
      `${req.nextUrl.origin}/notion?error=${encodeURIComponent("OAuth failed: " + err)}`
    );
  }

  const tokenData = await tokenRes.json();
  const { access_token, workspace_id, workspace_name, workspace_icon, bot_id } = tokenData;

  // Upsert workspace
  await prisma.notionWorkspace.upsert({
    where: { workspaceId: workspace_id },
    create: {
      workspaceId: workspace_id,
      workspaceName: workspace_name || "Workspace",
      accessToken: access_token,
      botId: bot_id || "",
      icon: workspace_icon || "",
    },
    update: {
      workspaceName: workspace_name || "Workspace",
      accessToken: access_token,
      botId: bot_id || "",
      icon: workspace_icon || "",
    },
  });

  return NextResponse.redirect(`${req.nextUrl.origin}/notion?connected=${encodeURIComponent(workspace_name || workspace_id)}`);
}
