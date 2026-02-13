import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, requireOwner } from "@/lib/auth-utils";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "justins921/mytime"

/**
 * POST /api/dev-notes/send — Send a dev note to GitHub as an issue (owner only)
 * Body: { id }
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res!;

  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return NextResponse.json(
      { error: "GitHub integration not configured. Set GITHUB_TOKEN and GITHUB_REPO environment variables." },
      { status: 400 }
    );
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const note = await prisma.devNote.findFirst({ where: { id, userId: user.id } });
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // Build GitHub issue title from first line, truncated
  const firstLine = note.content.split("\n")[0].trim();
  const title = firstLine.length > 70 ? firstLine.slice(0, 67) + "..." : firstLine;

  // Build issue body
  const bodyParts = [note.content];
  if (note.pageUrl) {
    bodyParts.push(`\n---\n**Page:** ${note.pageUrl}`);
  }
  if (note.screenshot) {
    bodyParts.push(`\n**Screenshot attached in dev notes dashboard.**`);
  }
  bodyParts.push(`\n*Sent from MyTime dev notes on ${new Date().toISOString()}*`);

  const body = bodyParts.join("\n");

  // Create GitHub issue
  const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body,
      labels: ["dev-note"],
    }),
  });

  if (!ghRes.ok) {
    const err = await ghRes.text();
    return NextResponse.json({ error: `GitHub API error: ${err}` }, { status: 500 });
  }

  const issue = await ghRes.json();

  // Update note status
  await prisma.devNote.update({
    where: { id },
    data: { status: "sent", githubIssueUrl: issue.html_url },
  });

  return NextResponse.json({ ok: true, issueUrl: issue.html_url });
}
