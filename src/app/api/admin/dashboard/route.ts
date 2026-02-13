import { NextResponse } from "next/server";
import { getAuthUser, requireManager } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/dashboard — aggregated platform metrics
 */
export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;
  const denied = requireManager(user);
  if (denied) return denied;

  // Run all queries in parallel
  const [
    totalUsers,
    planCounts,
    churnedUsers,
    totalClients,
    totalProjects,
    hoursAgg,
    schedulesGenerated,
    totalTasks,
    totalTimeEntries,
    totalSupportTickets,
    openTickets,
    userSignupsByMonth,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Users grouped by plan
    prisma.user.groupBy({
      by: ["plan"],
      _count: { id: true },
    }),

    // Churned: users who had a subscription but are now free
    prisma.user.count({
      where: {
        plan: "free",
        stripeSubscriptionId: { not: null },
      },
    }),

    // Total clients across all users
    prisma.client.count(),

    // Total projects
    prisma.project.count(),

    // Total hours logged (sum of durationMinutes)
    prisma.timeEntry.aggregate({
      _sum: { durationMinutes: true },
    }),

    // Schedules generated (schedule blocks with generated=true)
    prisma.scheduleBlock.count({
      where: { generated: true },
    }),

    // Total tasks
    prisma.task.count(),

    // Total time entries
    prisma.timeEntry.count(),

    // Total support tickets
    prisma.supportTicket.count(),

    // Open/in-progress tickets
    prisma.supportTicket.count({
      where: { status: { in: ["open", "in_progress"] } },
    }),

    // User signups by month (last 12 months)
    prisma.$queryRawUnsafe<{ month: string; count: bigint }[]>(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*) as count
       FROM "User"
       WHERE "createdAt" > NOW() - INTERVAL '12 months'
       GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
       ORDER BY month ASC`
    ),
  ]);

  // Build plan breakdown
  const plans: Record<string, number> = { free: 0, starter: 0, pro: 0, business: 0 };
  for (const row of planCounts) {
    plans[row.plan] = row._count.id;
  }

  const paidUsers = totalUsers - (plans.free || 0);
  const conversionRate = totalUsers > 0 ? paidUsers / totalUsers : 0;
  const totalHours = (hoursAgg._sum.durationMinutes || 0) / 60;

  // Format signups for chart
  const signupTrend = (userSignupsByMonth || []).map((row) => ({
    month: row.month,
    count: Number(row.count),
  }));

  return NextResponse.json({
    totalUsers,
    paidUsers,
    plans,
    conversionRate,
    churnedUsers,
    totalClients,
    totalProjects,
    totalTasks,
    totalHours: Math.round(totalHours * 10) / 10,
    totalTimeEntries,
    schedulesGenerated,
    totalSupportTickets,
    openTickets,
    signupTrend,
  });
}
