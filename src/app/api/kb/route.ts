import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

/**
 * GET /api/kb — list published knowledge base articles
 * Query params:
 *   ?category=getting-started — filter by category
 *   ?q=search term — search title/content
 *   ?slug=article-slug — get single article by slug
 */
export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const slug = req.nextUrl.searchParams.get("slug");
  const category = req.nextUrl.searchParams.get("category");
  const query = req.nextUrl.searchParams.get("q");

  // Single article by slug
  if (slug) {
    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { slug },
    });
    if (!article || article.status !== "published") {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(article);
  }

  // List published articles
  const where: Record<string, unknown> = { status: "published" };

  if (category) {
    where.category = category;
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
      { tags: { contains: query, mode: "insensitive" } },
    ];
  }

  const articles = await prisma.knowledgeBaseArticle.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      tags: true,
      relatedTicketTypes: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(articles);
}
