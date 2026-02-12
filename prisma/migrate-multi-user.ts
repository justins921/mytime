/**
 * Migration script: single-user → multi-user
 *
 * Uses only raw SQL to avoid Prisma client schema mismatch.
 * The generated Prisma client expects the NEW schema, but the
 * database still has the OLD schema at this point.
 *
 * Safe to run multiple times — each step checks before acting.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // First add Stripe/auth columns to User BEFORE any queries,
  // since the Prisma client expects them to exist
  const userFields = [
    { name: "stripeCustomerId", type: "TEXT" },
    { name: "stripeSubscriptionId", type: "TEXT" },
    { name: "plan", type: "TEXT", default: "'free'" },
    { name: "planExpiresAt", type: "TIMESTAMP(3)" },
    { name: "passwordHash", type: "TEXT" },
  ];

  for (const field of userFields) {
    const colCheck = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = $1`,
      field.name
    );
    if (colCheck.length === 0) {
      const defaultClause = field.default ? ` DEFAULT ${field.default}` : "";
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "User" ADD COLUMN "${field.name}" ${field.type}${defaultClause}`
      );
      console.log(`  ✓ Added User.${field.name}`);
    }
  }

  // Now find the first user using raw SQL to avoid schema mismatch
  const users = await prisma.$queryRawUnsafe<Array<{ id: string; email: string }>>(
    `SELECT id, email FROM "User" ORDER BY "createdAt" ASC LIMIT 1`
  );

  if (users.length === 0) {
    console.log("No users found — skipping migration (fresh database).");
    return;
  }

  const user = users[0];
  console.log(`Backfilling userId with user: ${user.id} (${user.email})`);

  // Tables that need a userId column added
  const tables = [
    "Client",
    "ScheduleBlock",
    "TimeEntry",
    "TriageDismissal",
    "SlackWorkspace",
    "GmailAccount",
    "TimeOff",
    "FloatingTask",
    "CalendarFeed",
    "Note",
    "NotionWorkspace",
    "Settings",
  ];

  for (const table of tables) {
    const tableName = `"${table}"`;

    // Check if userId column exists
    const colCheck = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = 'userId'`,
      table
    );

    if (colCheck.length === 0) {
      // Add nullable userId column
      console.log(`  Adding userId column to ${table}...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE ${tableName} ADD COLUMN "userId" TEXT`);

      // Backfill
      await prisma.$executeRawUnsafe(`UPDATE ${tableName} SET "userId" = $1`, user.id);

      // Make NOT NULL
      await prisma.$executeRawUnsafe(`ALTER TABLE ${tableName} ALTER COLUMN "userId" SET NOT NULL`);

      console.log(`  ✓ ${table} userId column added and backfilled`);
    } else {
      // Column exists — check for NULLs and backfill them
      const nullCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE "userId" IS NULL`
      );
      if (Number(nullCount[0].count) > 0) {
        await prisma.$executeRawUnsafe(`UPDATE ${tableName} SET "userId" = $1 WHERE "userId" IS NULL`, user.id);
        console.log(`  ✓ ${table} backfilled ${nullCount[0].count} NULL rows`);
      } else {
        console.log(`  ✓ ${table} already has userId column — no backfill needed`);
      }
    }
  }

  // Handle Settings singleton → per-user migration
  const settingsRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Settings" WHERE id = 'singleton'`
  );
  if (settingsRows.length > 0) {
    console.log("  Updating Settings singleton id to cuid...");
    const newId = `settings_${user.id}`;
    await prisma.$executeRawUnsafe(`UPDATE "Settings" SET id = $1 WHERE id = 'singleton'`, newId);
    console.log(`  ✓ Settings singleton id updated`);
  }

  // Drop old unique constraints that are being replaced with compound ones
  await safeDropConstraint("TriageDismissal", "TriageDismissal_clickupTaskId_key");
  await safeDropConstraint("SlackWorkspace", "SlackWorkspace_teamId_key");
  await safeDropConstraint("GmailAccount", "GmailAccount_email_key");
  await safeDropConstraint("NotionWorkspace", "NotionWorkspace_workspaceId_key");

  // Create SupportTicket table if it doesn't exist (new table)
  const supportTableCheck = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
    `SELECT table_name FROM information_schema.tables WHERE table_name = 'SupportTicket'`
  );
  if (supportTableCheck.length === 0) {
    console.log("  Creating SupportTicket table...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "SupportTicket" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'open',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId")`);
    console.log(`  ✓ SupportTicket table created`);
  }

  console.log("\nMigration complete!");
}

async function safeDropConstraint(table: string, constraint: string) {
  try {
    const check = await prisma.$queryRawUnsafe<Array<{ constraint_name: string }>>(
      `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = $1 AND constraint_name = $2`,
      table,
      constraint
    );
    if (check.length > 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DROP CONSTRAINT "${constraint}"`);
      console.log(`  ✓ Dropped old constraint ${constraint}`);
    }
  } catch {
    // Constraint doesn't exist — fine
  }
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
