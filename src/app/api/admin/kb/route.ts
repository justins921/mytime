import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireManager } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/kb — list all articles (including drafts)
 */
export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;
  const denied = requireManager(user);
  if (denied) return denied;

  const articles = await prisma.knowledgeBaseArticle.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(articles);
}

/**
 * POST /api/admin/kb — create a new article
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;
  const denied = requireManager(user);
  if (denied) return denied;

  const body = await req.json();
  const { title, content, category, tags, relatedTicketTypes, status } = body as {
    title: string;
    content: string;
    category: string;
    tags?: string;
    relatedTicketTypes?: string;
    status?: string;
  };

  if (!title || !content || !category) {
    return NextResponse.json({ error: "title, content, and category are required" }, { status: 400 });
  }

  // Generate slug from title
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Ensure uniqueness
  let slug = baseSlug;
  let suffix = 0;
  while (await prisma.knowledgeBaseArticle.findUnique({ where: { slug } })) {
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }

  const article = await prisma.knowledgeBaseArticle.create({
    data: {
      title,
      slug,
      content,
      category,
      tags: tags || "",
      relatedTicketTypes: relatedTicketTypes || "",
      status: status || "draft",
    },
  });

  return NextResponse.json(article);
}

/**
 * PATCH /api/admin/kb — update an article
 */
export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;
  const denied = requireManager(user);
  if (denied) return denied;

  const body = await req.json();
  const { id, title, content, category, tags, relatedTicketTypes, status, sortOrder } = body as {
    id: string;
    title?: string;
    content?: string;
    category?: string;
    tags?: string;
    relatedTicketTypes?: string;
    status?: string;
    sortOrder?: number;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.knowledgeBaseArticle.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // Regenerate slug if title changed
  let slug = existing.slug;
  if (title && title !== existing.title) {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    slug = baseSlug;
    let suffix = 0;
    while (true) {
      const conflict = await prisma.knowledgeBaseArticle.findUnique({ where: { slug } });
      if (!conflict || conflict.id === id) break;
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }
  }

  const article = await prisma.knowledgeBaseArticle.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title, slug } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(relatedTicketTypes !== undefined ? { relatedTicketTypes } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    },
  });

  return NextResponse.json(article);
}

/**
 * DELETE /api/admin/kb — delete an article
 */
export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;
  const denied = requireManager(user);
  if (denied) return denied;

  const body = await req.json();
  const { id } = body as { id: string };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.knowledgeBaseArticle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
