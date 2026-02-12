/**
 * Migration script: single-user → multi-user
 *
 * Adds userId columns (nullable) to all tables that need them,
 * backfills from the first user, then makes them NOT NULL.
 * Also handles Settings migration from singleton → per-user,
 * and updates unique constraints for compound keys.
 *
 * Safe to run multiple times — each step checks before acting.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the first (and likely only) user to backfill
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    console.log("No users found — skipping migration (fresh database).");
    return;
  }

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

  // Handle Settings singleton → per-user migration:
  // Remove old singleton id if it exists
  const settingsRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Settings" WHERE id = 'singleton'`
  );
  if (settingsRows.length > 0) {
    console.log("  Updating Settings singleton id to cuid...");
    // Give it a proper cuid-style id
    const newId = `settings_${user.id}`;
    await prisma.$executeRawUnsafe(`UPDATE "Settings" SET id = $1 WHERE id = 'singleton'`, newId);
    console.log(`  ✓ Settings singleton id updated`);
  }

  // Add Stripe columns to User if they don't exist
  const stripeFields = [
    { name: "stripeCustomerId", type: "TEXT" },
    { name: "stripeSubscriptionId", type: "TEXT" },
    { name: "plan", type: "TEXT", default: "'free'" },
    { name: "planExpiresAt", type: "TIMESTAMP(3)" },
    { name: "passwordHash", type: "TEXT" },
  ];

  for (const field of stripeFields) {
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

  // Drop old unique constraints that are being replaced with compound ones
  // TriageDismissal: clickupTaskId → (userId, clickupTaskId)
  await safeDropConstraint("TriageDismissal", "TriageDismissal_clickupTaskId_key");
  // SlackWorkspace: teamId → (userId, teamId)
  await safeDropConstraint("SlackWorkspace", "SlackWorkspace_teamId_key");
  // GmailAccount: email → (userId, email)
  await safeDropConstraint("GmailAccount", "GmailAccount_email_key");
  // NotionWorkspace: workspaceId → (userId, workspaceId)
  await safeDropConstraint("NotionWorkspace", "NotionWorkspace_workspaceId_key");

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
