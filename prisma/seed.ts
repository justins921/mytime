import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Upsert settings singleton
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  // Create clients
  const natalie = await prisma.client.upsert({
    where: { id: "client-natalie" },
    update: {},
    create: {
      id: "client-natalie",
      name: "Natalie",
      retainerMonthly: 2000,
      baselineRateHourly: 50,
      weeklyTargetHours: 10,
      monthlyCapHours: 40,
      priorityWeight: 70,
      style: "DeepWork",
      dailyTouch: false,
      color: "#8b5cf6",
      sortOrder: 0,
    },
  });

  const chandler = await prisma.client.upsert({
    where: { id: "client-chandler" },
    update: {},
    create: {
      id: "client-chandler",
      name: "Chandler",
      retainerMonthly: 2000,
      baselineRateHourly: 50,
      weeklyTargetHours: 6,
      monthlyCapHours: 40,
      priorityWeight: 30,
      style: "DeepWork",
      dailyTouch: true,
      color: "#3b82f6",
      sortOrder: 1,
    },
  });

  const payton = await prisma.client.upsert({
    where: { id: "client-payton" },
    update: {},
    create: {
      id: "client-payton",
      name: "Payton",
      retainerMonthly: 2000,
      baselineRateHourly: 50,
      weeklyTargetHours: 5,
      monthlyCapHours: 40,
      priorityWeight: 0,
      style: "Support",
      dailyTouch: false,
      color: "#10b981",
      sortOrder: 2,
    },
  });

  // Create projects
  // Natalie
  await prisma.project.upsert({
    where: { id: "proj-natalie-general" },
    update: {},
    create: {
      id: "proj-natalie-general",
      clientId: natalie.id,
      name: "General",
      weight: 1.0,
    },
  });

  // Chandler
  await prisma.project.upsert({
    where: { id: "proj-chandler-uc30" },
    update: {},
    create: {
      id: "proj-chandler-uc30",
      clientId: chandler.id,
      name: "UC30",
      tags: "UC30",
      weight: 0.2,
    },
  });

  await prisma.project.upsert({
    where: { id: "proj-chandler-motel" },
    update: {},
    create: {
      id: "proj-chandler-motel",
      clientId: chandler.id,
      name: "Motel",
      weight: 1.0,
    },
  });

  await prisma.project.upsert({
    where: { id: "proj-chandler-website" },
    update: {},
    create: {
      id: "proj-chandler-website",
      clientId: chandler.id,
      name: "Website/Events",
      weight: 1.0,
    },
  });

  // Payton
  await prisma.project.upsert({
    where: { id: "proj-payton-support" },
    update: {},
    create: {
      id: "proj-payton-support",
      clientId: payton.id,
      name: "Support Emails",
      weight: 1.0,
    },
  });

  await prisma.project.upsert({
    where: { id: "proj-payton-semflow" },
    update: {},
    create: {
      id: "proj-payton-semflow",
      clientId: payton.id,
      name: "Semflow/Clicks Support",
      weight: 0.5,
    },
  });

  await prisma.project.upsert({
    where: { id: "proj-payton-testing" },
    update: {},
    create: {
      id: "proj-payton-testing",
      clientId: payton.id,
      name: "Testing",
      weight: 0.3,
    },
  });

  // Update deep work split in settings
  await prisma.settings.update({
    where: { id: "singleton" },
    data: {
      deepWorkSplitJson: JSON.stringify({
        splits: [
          { clientId: natalie.id, weight: 70 },
          { clientId: chandler.id, weight: 30 },
        ],
      }),
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
