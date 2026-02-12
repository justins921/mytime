import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const query = req.nextUrl.searchParams.get("query") || "";
  const startCursor = req.nextUrl.searchParams.get("cursor") || undefined;

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const workspace = await prisma.notionWorkspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const body: Record<string, unknown> = {
    page_size: 20,
    filter: { property: "object", value: "page" },
  };
  if (query) body.query = query;
  if (startCursor) body.start_cursor = startCursor;

  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${workspace.accessToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Notion API error: ${err}` }, { status: res.status });
  }

  const data = await res.json();

  // Extract page info
  const pages = (data.results || []).map((page: Record<string, unknown>) => {
    const titleProp = Object.values(
      (page.properties as Record<string, Record<string, unknown>>) || {}
    ).find((p) => p.type === "title") as Record<string, unknown> | undefined;

    const titleArr = (titleProp?.title as Array<{ plain_text: string }>) || [];
    const title = titleArr.map((t) => t.plain_text).join("") || "Untitled";

    const iconObj = page.icon as Record<string, string> | null;
    let icon = "";
    if (iconObj) {
      if (iconObj.type === "emoji") icon = iconObj.emoji || "";
      else if (iconObj.type === "external") icon = iconObj.external || "";
    }

    return {
      id: page.id,
      title,
      icon,
      url: page.url,
      lastEditedTime: page.last_edited_time,
      parentType: (page.parent as Record<string, unknown>)?.type || "workspace",
    };
  });

  return NextResponse.json({
    pages,
    hasMore: data.has_more,
    nextCursor: data.next_cursor,
  });
}
