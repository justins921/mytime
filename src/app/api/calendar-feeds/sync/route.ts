import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchAndParseICS } from "@/lib/ics";

export interface CalendarEvent {
  uid: string;
  summary: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  allDay: boolean;
  feedId: string;
  feedName: string;
  feedColor: string;
}

export async function GET(req: NextRequest) {
  const startDate = req.nextUrl.searchParams.get("startDate"); // YYYY-MM-DD
  const endDate = req.nextUrl.searchParams.get("endDate");     // YYYY-MM-DD

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate and endDate required" }, { status: 400 });
  }

  const rangeStart = new Date(startDate + "T00:00:00");
  const rangeEnd = new Date(endDate + "T23:59:59");

  const feeds = await prisma.calendarFeed.findMany({
    where: { enabled: true },
  });

  const allEvents: CalendarEvent[] = [];

  await Promise.all(
    feeds.map(async (feed) => {
      try {
        const events = await fetchAndParseICS(feed.url);

        for (const event of events) {
          // Check if event overlaps with our date range
          if (event.end < rangeStart || event.start > rangeEnd) continue;

          allEvents.push({
            uid: event.uid,
            summary: event.summary,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            allDay: event.allDay,
            feedId: feed.id,
            feedName: feed.name,
            feedColor: feed.color,
          });
        }

        // Update last sync time
        await prisma.calendarFeed.update({
          where: { id: feed.id },
          data: { lastSync: new Date(), lastSyncError: "" },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        await prisma.calendarFeed.update({
          where: { id: feed.id },
          data: { lastSyncError: message },
        });
      }
    })
  );

  // Sort by start time
  allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return NextResponse.json(allEvents);
}
