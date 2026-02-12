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

  // Fetch all blocks with pagination
  const blocks = await fetchAllBlocks(pageId, headers);

  // Recursively fetch children for blocks that have them
  await fetchChildBlocks(blocks, headers);

  // Render blocks to markdown
  const content = renderBlocks(blocks);

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

interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  children?: NotionBlock[];
  [key: string]: unknown;
}

interface RichTextItem {
  type: string;
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  equation?: { expression: string };
}

async function fetchAllBlocks(
  blockId: string,
  headers: Record<string, string>
): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | null = null;

  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.set("page_size", "100");
    if (cursor) url.searchParams.set("start_cursor", cursor);

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) break;

    const data = await res.json();
    blocks.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return blocks;
}

async function fetchChildBlocks(
  blocks: NotionBlock[],
  headers: Record<string, string>,
  depth = 0
): Promise<void> {
  if (depth > 3) return;

  for (const block of blocks) {
    if (block.has_children) {
      block.children = await fetchAllBlocks(block.id, headers);
      await fetchChildBlocks(block.children, headers, depth + 1);
    }
  }
}

function renderRichText(richText: RichTextItem[]): string {
  if (!richText || richText.length === 0) return "";

  return richText
    .map((item) => {
      if (item.type === "equation" && item.equation) {
        return `\`${item.equation.expression}\``;
      }

      let text = item.plain_text;
      if (!text) return "";

      if (item.annotations?.code) {
        text = `\`${text}\``;
      } else {
        // Only apply inline formatting when not already code
        if (item.annotations?.bold) text = `**${text}**`;
        if (item.annotations?.italic) text = `*${text}*`;
        if (item.annotations?.strikethrough) text = `~~${text}~~`;
      }

      if (item.href) {
        text = `[${text}](${item.href})`;
      }

      return text;
    })
    .join("");
}

function getMediaUrl(data: Record<string, unknown>): string {
  if (data.type === "external") {
    return ((data.external as Record<string, unknown>)?.url as string) || "";
  }
  if (data.type === "file") {
    return ((data.file as Record<string, unknown>)?.url as string) || "";
  }
  return "";
}

function renderBlocks(blocks: NotionBlock[], indent = 0): string {
  const lines: string[] = [];
  const pad = "  ".repeat(indent);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const type = block.type;
    const data = block[type] as Record<string, unknown> | undefined;
    if (!data && type !== "divider") continue;

    const richText = (data?.rich_text as RichTextItem[]) || [];
    const text = renderRichText(richText);
    const children = block.children;
    let childrenHandled = false;

    switch (type) {
      case "paragraph":
        lines.push(`${pad}${text}`);
        break;

      case "heading_1":
        lines.push(`${pad}# ${text}`);
        break;

      case "heading_2":
        lines.push(`${pad}## ${text}`);
        break;

      case "heading_3":
        lines.push(`${pad}### ${text}`);
        break;

      case "bulleted_list_item":
        lines.push(`${pad}- ${text}`);
        break;

      case "numbered_list_item": {
        let num = 1;
        for (let j = i - 1; j >= 0; j--) {
          if (blocks[j].type === "numbered_list_item") num++;
          else break;
        }
        lines.push(`${pad}${num}. ${text}`);
        break;
      }

      case "to_do": {
        const checked = data?.checked ? "x" : " ";
        lines.push(`${pad}- [${checked}] ${text}`);
        break;
      }

      case "toggle":
        lines.push(`${pad}**${text}**`);
        break;

      case "quote": {
        const quoteLines = text.split("\n").map((l: string) => `${pad}> ${l}`);
        lines.push(quoteLines.join("\n"));
        break;
      }

      case "callout": {
        const icon = data?.icon as Record<string, unknown> | undefined;
        const emoji =
          icon?.type === "emoji" ? (icon.emoji as string) + " " : "";
        lines.push(`${pad}> ${emoji}${text}`);
        break;
      }

      case "code": {
        const lang = (data?.language as string) || "";
        lines.push(`${pad}\`\`\`${lang}\n${text}\n${pad}\`\`\``);
        break;
      }

      case "divider":
        lines.push(`${pad}---`);
        break;

      case "image": {
        const caption = renderRichText((data?.caption as RichTextItem[]) || []);
        const url = getMediaUrl(data as Record<string, unknown>);
        if (url) lines.push(`${pad}![${caption || "image"}](${url})`);
        break;
      }

      case "video": {
        const url = getMediaUrl(data as Record<string, unknown>);
        const caption = renderRichText((data?.caption as RichTextItem[]) || []);
        if (url) lines.push(`${pad}[${caption || "Video"}](${url})`);
        break;
      }

      case "file":
      case "pdf":
      case "audio": {
        const caption = renderRichText((data?.caption as RichTextItem[]) || []);
        const url = getMediaUrl(data as Record<string, unknown>);
        if (url) {
          const label =
            caption || type.charAt(0).toUpperCase() + type.slice(1);
          lines.push(`${pad}[${label}](${url})`);
        }
        break;
      }

      case "bookmark":
      case "link_preview": {
        const linkUrl = (data?.url as string) || "";
        if (linkUrl) {
          const caption = renderRichText(
            (data?.caption as RichTextItem[]) || []
          );
          lines.push(`${pad}[${caption || linkUrl}](${linkUrl})`);
        }
        break;
      }

      case "embed": {
        const embedUrl = (data?.url as string) || "";
        if (embedUrl) lines.push(`${pad}[${embedUrl}](${embedUrl})`);
        break;
      }

      case "equation": {
        const expression = (data?.expression as string) || "";
        if (expression) lines.push(`${pad}\`${expression}\``);
        break;
      }

      case "table": {
        if (children && children.length > 0) {
          const hasHeader = data?.has_column_header as boolean;
          for (let rowIdx = 0; rowIdx < children.length; rowIdx++) {
            const row = children[rowIdx];
            const rowData = row.table_row as Record<string, unknown> | undefined;
            const cells = (rowData?.cells as RichTextItem[][]) || [];
            const cellTexts = cells.map((cell) => renderRichText(cell));
            lines.push(`${pad}| ${cellTexts.join(" | ")} |`);
            if (rowIdx === 0 && hasHeader) {
              lines.push(`${pad}| ${cellTexts.map(() => "---").join(" | ")} |`);
            }
          }
        }
        childrenHandled = true;
        break;
      }

      case "column_list": {
        if (children) {
          for (const column of children) {
            if (column.children) {
              lines.push(renderBlocks(column.children, indent));
            }
          }
        }
        childrenHandled = true;
        break;
      }

      case "synced_block":
        // Children rendered below
        break;

      case "child_page":
        lines.push(`${pad}📄 ${(data?.title as string) || "Untitled page"}`);
        break;

      case "child_database":
        lines.push(
          `${pad}📊 ${(data?.title as string) || "Untitled database"}`
        );
        break;

      case "table_of_contents":
      case "breadcrumb":
        break;

      default:
        if (text) lines.push(`${pad}${text}`);
        break;
    }

    // Render children for blocks that support nesting
    if (children && !childrenHandled) {
      lines.push(renderBlocks(children, indent + 1));
    }
  }

  return lines.join("\n\n");
}
