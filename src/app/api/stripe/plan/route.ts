import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const settings = await prisma.settings.findUnique({
    where: { userId: user.id },
    select: { hiddenSidebarItemsJson: true },
  });

  let hiddenSidebarItems: string[] = [];
  try {
    hiddenSidebarItems = JSON.parse(settings?.hiddenSidebarItemsJson || "[]");
  } catch {
    hiddenSidebarItems = [];
  }

  return NextResponse.json({
    plan: user.plan,
    role: user.role,
    email: user.email,
    name: user.name,
    planExpiresAt: user.planExpiresAt,
    stripeCustomerId: !!user.stripeCustomerId,
    stripeSubscriptionId: !!user.stripeSubscriptionId,
    hiddenSidebarItems,
  });
}
