import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: retrieve a page's content blocks
export async function GET(req: NextRequest) {
  const pageId = req.nextUrl.searchParams.get("pageId");
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");

  if (!pageId || !workspaceId) {
    return NextResponse.json({ error: "pageId and workspaceId required" }, { status: 400 });
  }

  const workspace = await prisma.notionWorkspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const headers = {
    Authorization: `Bearer ${workspace.accessToken}`,
    "Notion-Version": "2022-06-28",
  };

  // Fetch page metadata
  const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { headers });
  if (!pageRes.ok) {
    return NextResponse.json({ error: "Failed to fetch page" }, { status: pageRes.status });
  }
  const page = await pageRes.json();

  // Fetch page blocks (content)
  const blocksRes = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    { headers }
  );
  const blocksData = blocksRes.ok ? await blocksRes.json() : { results: [] };

  // Render blocks to simple markdown-like text
  const content = renderBlocks(blocksData.results || []);

  // Get title
  const titleProp = Object.values(page.properties || {}).find(
    (p: unknown) => (p as Record<string, unknown>).type === "title"
  ) as Record<string, unknown> | undefined;
  const titleArr = (titleProp?.title as Array<{ plain_text: string }>) || [];
  const title = titleArr.map((t) => t.plain_text).join("") || "Untitled";

  return NextResponse.json({
    id: page.id,
    title,
    url: page.url,
    content,
    lastEditedTime: page.last_edited_time,
    icon: page.icon,
  });
}

function renderBlocks(blocks: Record<string, unknown>[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    const type = block.type as string;
    const data = block[type] as Record<string, unknown> | undefined;
    if (!data) continue;

    const richText = (data.rich_text as Array<{ plain_text: string }>) || [];
    const text = richText.map((t) => t.plain_text).join("");

    switch (type) {
      case "paragraph":
        lines.push(text);
        break;
      case "heading_1":
        lines.push(`# ${text}`);
        break;
      case "heading_2":
        lines.push(`## ${text}`);
        break;
      case "heading_3":
        lines.push(`### ${text}`);
        break;
      case "bulleted_list_item":
        lines.push(`- ${text}`);
        break;
      case "numbered_list_item":
        lines.push(`1. ${text}`);
        break;
      case "to_do": {
        const checked = data.checked ? "x" : " ";
        lines.push(`- [${checked}] ${text}`);
        break;
      }
      case "toggle":
        lines.push(`> ${text}`);
        break;
      case "quote":
        lines.push(`> ${text}`);
        break;
      case "code": {
        const lang = (data.language as string) || "";
        lines.push(`\`\`\`${lang}\n${text}\n\`\`\``);
        break;
      }
      case "divider":
        lines.push("---");
        break;
      case "callout":
        lines.push(`> ${text}`);
        break;
      default:
        if (text) lines.push(text);
        break;
    }
  }

  return lines.join("\n\n");
}
