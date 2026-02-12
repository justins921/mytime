import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  try {
    const { type, subject, message } = await req.json();

    if (!type || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        type,
        subject,
        message,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
