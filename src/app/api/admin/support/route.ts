import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, requireManager } from "@/lib/auth-utils";

/**
 * GET /api/admin/support — List ALL support tickets (manager+)
 */
export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const forbidden = requireManager(user);
  if (forbidden) return forbidden;

  const status = req.nextUrl.searchParams.get("status");

  const tickets = await prisma.supportTicket.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

/**
 * PATCH /api/admin/support — Update a ticket status (manager+)
 * Body: { ticketId, status }
 */
export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const forbidden = requireManager(user);
  if (forbidden) return forbidden;

  const { ticketId, status } = await req.json();

  if (!ticketId || !status) {
    return NextResponse.json({ error: "ticketId and status are required" }, { status: 400 });
  }

  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be: ${validStatuses.join(", ")}` }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(ticket);
}
