import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, requireAdmin, requireManager } from "@/lib/auth-utils";

/**
 * GET /api/admin/users — List all users (manager+)
 */
export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const forbidden = requireManager(user);
  if (forbidden) return forbidden;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      createdAt: true,
      _count: {
        select: {
          clients: true,
          timeEntries: true,
          supportTickets: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

/**
 * PATCH /api/admin/users — Update a user's role (admin only)
 * Body: { userId, role }
 */
export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;

  const { userId, role, plan } = await req.json();

  if (!userId || (!role && !plan)) {
    return NextResponse.json({ error: "userId and role or plan are required" }, { status: 400 });
  }

  const data: Record<string, string> = {};

  if (role) {
    const validRoles = ["user", "manager", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be: ${validRoles.join(", ")}` }, { status: 400 });
    }
    // Prevent admin from demoting themselves
    if (userId === user.id && role !== "admin") {
      return NextResponse.json({ error: "Cannot change your own admin role" }, { status: 400 });
    }
    data.role = role;
  }

  if (plan) {
    const validPlans = ["free", "starter", "pro", "business"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: `Invalid plan. Must be: ${validPlans.join(", ")}` }, { status: 400 });
    }
    data.plan = plan;
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/admin/users — Delete a user (admin only)
 * Body: { userId }
 */
export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;

  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Cannot delete yourself
  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Cascade delete will remove all user data
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
