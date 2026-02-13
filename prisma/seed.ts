import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create or find seed user
  const seedUser = await prisma.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: {
      id: "seed-user",
      email: "dev@example.com",
      name: "Dev User",
    },
  });

  // Upsert settings for seed user
  await prisma.settings.upsert({
    where: { userId: seedUser.id },
    update: {},
    create: { userId: seedUser.id },
  });

  // Create clients
  const natalie = await prisma.client.upsert({
    where: { id: "client-natalie" },
    update: {},
    create: {
      id: "client-natalie",
      userId: seedUser.id,
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
      userId: seedUser.id,
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
      userId: seedUser.id,
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
    where: { userId: seedUser.id },
    data: {
      deepWorkSplitJson: JSON.stringify({
        splits: [
          { clientId: natalie.id, weight: 70 },
          { clientId: chandler.id, weight: 30 },
        ],
      }),
    },
  });

  // ─── Knowledge Base Articles ─────────────────────
  const kbArticles = [
    // Getting Started
    {
      id: "kb-what-is-mytime",
      title: "What is MyTime?",
      slug: "what-is-mytime",
      category: "getting-started",
      tags: "overview,intro,about",
      relatedTicketTypes: "support",
      sortOrder: 0,
      content: `MyTime is a workday management tool built for freelancers, consultants, and independent contractors who juggle multiple clients.

## What it does

- **Schedule generation** — Add your clients, availability, and hour targets. Hit one button and your entire week appears, balanced across every client by priority weight and weekly targets.
- **Time tracking** — One-click timer tied to your current client and project. Warns you if you context-switch.
- **Client management** — Every client has their own profile with retainer, hourly rate, weekly targets, monthly caps, projects, tasks, and notes.
- **CRM pipeline** — Track leads from first touch to won deal. Log activities. Generate contracts from templates.
- **Integrations** — Slack, Gmail, Outlook, Notion, Calendar, ClickUp, Trello, Asana, and Monday.com all surface inside MyTime.
- **Triage inbox** — Tasks from your project tools land in one inbox. Accept, schedule, or dismiss.
- **Reports** — See where every hour went, export to CSV, track monthly caps.

## What it doesn't do

MyTime intentionally skips invoicing. Invoicing touches payments, taxes, and compliance — things that dedicated tools like FreshBooks, Wave, and QuickBooks handle well. We focus on the workday itself.`,
    },
    {
      id: "kb-getting-started-guide",
      title: "Getting started in 5 minutes",
      slug: "getting-started-in-5-minutes",
      category: "getting-started",
      tags: "setup,quickstart,onboarding",
      relatedTicketTypes: "support",
      sortOrder: 1,
      content: `Here's how to go from signup to a fully planned week in about 5 minutes.

## Step 1: Add your clients

Go to **Clients** in the sidebar and click **Add Client**. For each client, fill in:

- **Name** — The client or company name
- **Weekly target hours** — How many hours per week you want to allocate
- **Monthly cap hours** — The max hours per month (for retainer clients)
- **Hourly rate** — Your rate for this client
- **Style** — Deep Work, Support, Mixed, or Personal
- **Priority weight** — Higher numbers get more schedule priority

## Step 2: Set your availability

Go to **Settings** and configure:

- **Work hours** — Your start and end time
- **Working days** — Which days of the week you work
- **Block length** — How long each schedule block should be (default 2 hours)
- **Breaks** — Lunch time and break durations

## Step 3: Generate your schedule

Go to **Schedule** and click **Generate**. Your entire week will be created in seconds, balanced across all your clients based on priority weights and weekly targets.

## Step 4: Start the timer

Click on any schedule block and hit the timer button. The timer ties to that client and project automatically. When you're done, stop the timer and your time entry is logged.

## Step 5: Connect your tools (Pro)

Go to **Settings → Integrations** to connect Slack, Gmail, Notion, Calendar feeds, and project management tools. Everything surfaces inside MyTime so you can stop tab-switching.`,
    },
    {
      id: "kb-adding-clients",
      title: "Adding and managing clients",
      slug: "adding-and-managing-clients",
      category: "features",
      tags: "clients,retainer,hourly rate,monthly cap",
      relatedTicketTypes: "support",
      sortOrder: 10,
      content: `Clients are the core of MyTime. Every schedule block, time entry, and report ties back to a client.

## Creating a client

Go to **Clients** in the sidebar and click **Add Client**. Fill in:

- **Name** — The client or company name
- **Retainer (monthly)** — The monthly retainer amount in dollars
- **Hourly rate** — Your base rate for this client
- **Weekly target hours** — How many hours/week you want allocated to this client
- **Monthly cap hours** — The maximum hours per month (for cap tracking)
- **Priority weight** — A number that controls how the schedule generator distributes time. Higher = more priority.
- **Style** — Controls how blocks appear on your schedule:
  - **Deep Work** — Long focused blocks
  - **Support** — Short responsive blocks
  - **Mixed** — Combination of both
  - **Personal** — Non-billable time
- **Daily touch** — If enabled, this client gets at least one block every working day
- **Color** — Pick a color for easy visual identification

## Editing a client

Click on any client card to open their detail page. All fields are editable inline. Changes save automatically.

## Archiving vs. deleting

Archive a client to hide them from the schedule generator while keeping all their time entries and history. Delete removes everything permanently.`,
    },
    {
      id: "kb-schedule-generation",
      title: "How schedule generation works",
      slug: "how-schedule-generation-works",
      category: "features",
      tags: "schedule,generator,blocks,availability",
      relatedTicketTypes: "support,feature",
      sortOrder: 11,
      content: `The schedule generator is the core feature of MyTime. It creates your entire week in seconds.

## How it works

1. It reads your **availability** (work hours, working days, breaks)
2. It looks at each client's **weekly target hours** and **priority weight**
3. It distributes time blocks across the week, weighted by priority
4. It respects **daily touch** settings (some clients need at least one block per day)
5. It weaves in **floating tasks** (one-off tasks with time estimates and due dates)
6. It locks any **protected blocks** you've set (deep work, admin time, etc.)

## Regenerating

You can regenerate your schedule at any time. Protected blocks stay locked. Everything else gets recalculated.

## Manual adjustments

After generation, you can:
- **Drag and drop** blocks to rearrange
- **Resize** blocks to change duration
- **Lock** blocks you don't want regeneration to move
- **Delete** blocks you don't need

## Tips

- Set priority weights relative to each other (e.g., 70 for your biggest client, 30 for a smaller one)
- Use **daily touch** for clients who need responsive support
- Lock your best deep work slots so regeneration doesn't move them`,
    },
    {
      id: "kb-time-tracking",
      title: "Time tracking and the timer",
      slug: "time-tracking-and-timer",
      category: "features",
      tags: "timer,time tracking,entries,stopwatch",
      relatedTicketTypes: "support,bug",
      sortOrder: 12,
      content: `MyTime includes a built-in timer that ties directly to your clients and projects.

## Starting the timer

There are two ways to start tracking time:

1. **From the schedule** — Click on any block and hit the timer button. The timer auto-fills the client and project.
2. **From the timer page** — Go to **Timer** in the sidebar, select a client and project, and click start.

## Context-switch warnings

If you start a timer for a different client while one is already running, MyTime will warn you. This helps catch accidental context switches that eat into productive time.

## Time entries

Every timer session creates a time entry with:
- Client and project
- Start time and duration
- Optional notes
- Copy-to-clipboard for pasting into your invoice tool

## Manual entries

You can also add time entries manually if you forgot to start the timer. Go to **Timer** and click **Add Entry**.

## Reports

All time entries feed into the **Reports** page where you can see hours by client, by project, and by date range. Export to CSV for invoicing.`,
    },
    {
      id: "kb-crm-pipeline",
      title: "Using the CRM pipeline",
      slug: "using-the-crm-pipeline",
      category: "features",
      tags: "crm,leads,pipeline,deals,contacts",
      relatedTicketTypes: "support,feature",
      sortOrder: 13,
      content: `The CRM helps you track leads from first touch to signed client.

## Pipeline stages

- **Lead** — Someone you've identified as a potential client
- **Contacted** — You've reached out or they've responded
- **Meeting** — A meeting has been scheduled or completed
- **Proposal** — You've sent a proposal or contract
- **Won** — They've signed and are now a client
- **Lost** — The deal didn't work out

## Managing contacts

For each contact you can store:
- Name, email, phone, company, website
- Estimated deal value
- Source (referral, website, LinkedIn, cold outreach, event)
- Notes

## Logging activities

Click on a contact to open their detail panel. Use **Log Activity** to record:
- Emails, calls, meetings, notes, follow-ups, and proposals
- Each activity updates the "last contacted" date

## Generating contracts

Click **Generate** in the Contracts section of a contact's detail panel. Choose from three starter templates:
- **Freelance Retainer Agreement** — For ongoing monthly work
- **Fixed-Price Project Contract** — For one-time projects
- **Statement of Work (SOW)** — For detailed scoped engagements

Contact info and linked client rates are merged automatically. You can edit the contract, track its status (Draft → Sent → Signed), and copy it to clipboard.

## Converting to a client

When a deal is won, you can link the contact to a new client record. All their CRM history stays attached.`,
    },
    {
      id: "kb-contract-generation",
      title: "Generating contracts from the CRM",
      slug: "generating-contracts-from-crm",
      category: "features",
      tags: "contracts,templates,retainer,sow,proposal",
      relatedTicketTypes: "support,feature",
      sortOrder: 14,
      content: `MyTime includes contract generation built into the CRM. Generate retainer agreements, project contracts, and SOWs with auto-filled client details.

## How to generate a contract

1. Open a contact's detail panel in the CRM
2. Scroll to the **Contracts** section
3. Click **Generate**
4. Select a template
5. Fill in optional details (scope of work, dates, rate overrides)
6. Click **Generate Contract**

## Auto-merged fields

These fields are filled in automatically from the contact and linked client:
- Your name (from your account)
- Client name, email, company
- Hourly rate, monthly retainer, and monthly cap (from the linked client)
- Today's date

## Editing a contract

After generation, click on any contract to view it. Use the **Edit** button to modify the Markdown content directly. Unresolved merge fields (like \`{{scope_of_work}}\`) are highlighted in amber so you can fill them in.

## Status tracking

Track each contract's lifecycle:
- **Draft** — Just generated, still being edited
- **Sent** — Sent to the client for review
- **Signed** — Client has signed

## Custom templates

The three starter templates (Retainer, Project, SOW) are fully editable. You can also create custom templates via the API with your own merge fields.

## Important note

Generated contracts are a starting point and do not constitute legal advice. We recommend having an attorney review your contracts for your specific situation.`,
    },
    // Integrations
    {
      id: "kb-integrations-overview",
      title: "Integrations overview",
      slug: "integrations-overview",
      category: "integrations",
      tags: "slack,gmail,notion,calendar,clickup,trello,asana,monday",
      relatedTicketTypes: "integration,support",
      sortOrder: 20,
      content: `MyTime integrates with the tools you already use, surfacing them inside one screen so you stop tab-switching.

## Available integrations (Pro plan)

- **Slack** — All your workspaces in one inbox. Read and respond without leaving MyTime.
- **Gmail & Outlook** — Triage email with kanban-style boards.
- **Notion** — Browse and search your Notion pages.
- **Calendar** — Pull in Google Calendar, Apple Calendar, or Outlook via iCal feeds. Events appear alongside your schedule blocks.
- **ClickUp & Trello** — Tasks land in your triage inbox.
- **Asana & Monday.com** — Pull tasks for scheduling.

## Important: external accounts required

MyTime doesn't replace these tools — it surfaces them in one place. Each service requires its own account. Some services (like Slack, Notion, or ClickUp) may require a paid plan on their end.

## No extra fees from MyTime

All integrations are included on the Pro plan and above. There are no per-integration fees.

## Setting up integrations

Go to **Settings → Integrations** and follow the connection flow for each service. Most integrations use OAuth and take about 30 seconds to connect.`,
    },
    {
      id: "kb-calendar-feeds",
      title: "Setting up calendar feeds",
      slug: "setting-up-calendar-feeds",
      category: "integrations",
      tags: "calendar,ical,google calendar,apple calendar,outlook",
      relatedTicketTypes: "integration,support",
      sortOrder: 21,
      content: `Calendar feeds let you see your existing calendar events alongside your MyTime schedule blocks.

## Supported calendars

- Google Calendar
- Apple Calendar (iCloud)
- Outlook / Microsoft 365
- Any calendar that supports iCal feeds

## How to add a feed

1. Go to **Settings → Integrations → Calendar Feeds**
2. Click **Add Feed**
3. Paste your calendar's iCal URL
4. Give it a name and pick a color
5. Save

## Finding your iCal URL

- **Google Calendar** — Calendar Settings → Integrate Calendar → "Secret address in iCal format"
- **Apple Calendar** — Share the calendar publicly via iCloud, then copy the URL
- **Outlook** — Calendar Settings → Shared calendars → "Publish a calendar" → copy the ICS link

## How it works

Calendar events appear as read-only blocks on your schedule. The schedule generator sees them and avoids double-booking. Events sync automatically on each page load.`,
    },
    // Billing
    {
      id: "kb-plans-and-pricing",
      title: "Plans and pricing",
      slug: "plans-and-pricing",
      category: "billing",
      tags: "pricing,plans,starter,pro,business,free",
      relatedTicketTypes: "support",
      sortOrder: 30,
      content: `MyTime offers three plans to fit different stages of your freelance business.

## Starter — Free forever

- Up to 2 clients
- Schedule generation
- Time tracking & timer
- CRM pipeline
- Notes & tasks
- Knowledge base & support

## Pro — $19/mo (or $15/mo billed annually)

Everything in Starter, plus:
- Unlimited clients
- All integrations (Slack, Gmail, Notion, Calendar, ClickUp, Trello, Asana, Monday)
- Monthly cap tracking with alerts
- Triage inbox
- Reports & CSV export
- Contract generation

## Business — $39/mo (or $29/mo billed annually)

Everything in Pro, plus:
- Priority support
- Advanced reports & analytics
- API access
- Custom integrations

## Free trial

All paid plans include a 14-day free trial. No credit card required. You can start using MyTime immediately after signing up.

## Cancellation

Cancel anytime from **Settings → Billing**. Your data stays accessible on the free Starter plan after cancellation.`,
    },
    // Troubleshooting
    {
      id: "kb-timer-not-saving",
      title: "Timer not saving entries",
      slug: "timer-not-saving-entries",
      category: "troubleshooting",
      tags: "timer,bug,entries,not saving",
      relatedTicketTypes: "bug,support",
      sortOrder: 40,
      content: `If your timer entries aren't being saved, try these steps.

## Check your connection

Time entries are saved to the server when you stop the timer. If you're offline or have a flaky connection, the entry may not save.

- Make sure you're connected to the internet
- Try refreshing the page and stopping the timer again

## Check the client and project

A time entry requires both a client and a project. If either is missing, the entry won't save.

- Make sure a client is selected in the timer
- Make sure a project is selected (each client needs at least one project)

## Check the timer page

Go to **Timer** in the sidebar and look at the recent entries list. Your entry may have been saved but not visible in the current view.

## Still not working?

Submit a support request with:
- Your browser name and version
- What you were doing when the timer stopped working
- Any error messages you see in the browser console (press F12 → Console)`,
    },
    {
      id: "kb-schedule-not-generating",
      title: "Schedule not generating correctly",
      slug: "schedule-not-generating-correctly",
      category: "troubleshooting",
      tags: "schedule,generator,blocks,not working",
      relatedTicketTypes: "bug,support",
      sortOrder: 41,
      content: `If your schedule isn't generating as expected, check these common issues.

## No blocks appearing

- Make sure you have at least one **active (non-archived) client** with a weekly target greater than 0
- Check that your **availability settings** have at least some working hours configured
- Verify your **working days** include the days you're trying to generate for

## Wrong distribution of hours

The schedule generator uses **priority weights** to distribute time. If one client is getting too many hours:
- Check their priority weight relative to other clients
- Lower their weight or raise other clients' weights
- Weights are relative — what matters is the ratio between them

## Blocks overlapping with calendar events

If you have calendar feeds connected, the generator should avoid those times. If it's not working:
- Go to **Settings → Integrations → Calendar Feeds**
- Make sure the feed URL is still valid
- Try removing and re-adding the feed

## Protected blocks being overwritten

Locked/protected blocks should never move during regeneration. If they are:
- Click the block and make sure the lock icon is active
- Try regenerating — locked blocks should stay in place

## Still having issues?

Submit a support request with a screenshot of your schedule and your client settings.`,
    },
  ];

  for (const article of kbArticles) {
    await prisma.knowledgeBaseArticle.upsert({
      where: { id: article.id },
      update: {
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
        relatedTicketTypes: article.relatedTicketTypes,
        sortOrder: article.sortOrder,
        status: "published",
      },
      create: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        category: article.category,
        tags: article.tags,
        relatedTicketTypes: article.relatedTicketTypes,
        sortOrder: article.sortOrder,
        status: "published",
      },
    });
  }

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
