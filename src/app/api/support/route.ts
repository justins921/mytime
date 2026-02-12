import { NextResponse } from "next/server";
import { getAuthUser, ADMIN_EMAIL } from "@/lib/auth-utils";
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

    // Send email notification to admin (fire-and-forget)
    sendAdminNotification(user.email, user.name, type, subject, message).catch((err) =>
      console.error("Failed to send support notification email:", err)
    );

    return NextResponse.json(ticket, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

async function sendAdminNotification(
  userEmail: string,
  userName: string | null,
  type: string,
  subject: string,
  message: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // Skip if Resend isn't configured

  const typeLabels: Record<string, string> = {
    bug: "Bug Report",
    feature: "Feature Request",
    integration: "Integration Request",
    feedback: "General Feedback",
    support: "Help / Support",
  };

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MyTime Support <notifications@updates.mytime.day>",
      to: ADMIN_EMAIL,
      subject: `[MyTime Support] ${typeLabels[type] || type}: ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #1a1a1a;">New Support Ticket</h2>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666; width: 100px;">From</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${userName || "Unknown"} (${userEmail})</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Type</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${typeLabels[type] || type}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Subject</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${subject}</td></tr>
          </table>
          <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
          <p style="margin-top: 16px; font-size: 12px; color: #999;">Reply to this user at ${userEmail}</p>
        </div>
      `,
      reply_to: userEmail,
    }),
  });
}
