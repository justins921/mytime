/**
 * Lightweight ICS (iCalendar) parser.
 * Extracts VEVENT entries with SUMMARY, DTSTART, DTEND, and UID.
 */

export interface ICSEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

/**
 * Parse ICS text into an array of events.
 */
export function parseICS(text: string): ICSEvent[] {
  const events: ICSEvent[] = [];
  const blocks = text.split("BEGIN:VEVENT");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split("END:VEVENT")[0];
    if (!block) continue;

    // Unfold continuation lines (lines starting with space/tab are continuations)
    const unfolded = block.replace(/\r?\n[ \t]/g, "");
    const lines = unfolded.split(/\r?\n/);

    let uid = "";
    let summary = "";
    let dtstart = "";
    let dtend = "";
    let allDay = false;
    let startTzid = "";
    let endTzid = "";

    for (const line of lines) {
      if (line.startsWith("UID:")) {
        uid = line.slice(4).trim();
      } else if (line.startsWith("SUMMARY:")) {
        summary = line.slice(8).trim();
      } else if (line.startsWith("DTSTART")) {
        const parsed = parseDTValue(line);
        dtstart = parsed.value;
        startTzid = parsed.tzid;
        if (parsed.isDate) allDay = true;
      } else if (line.startsWith("DTEND")) {
        const parsed = parseDTValue(line);
        dtend = parsed.value;
        endTzid = parsed.tzid;
      }
    }

    if (!dtstart) continue;

    const start = parseICSDate(dtstart, allDay, startTzid);
    const end = dtend
      ? parseICSDate(dtend, allDay, endTzid)
      : new Date(start.getTime() + 60 * 60 * 1000);

    events.push({
      uid: uid || `event-${i}`,
      summary: summary || "Busy",
      start,
      end,
      allDay,
    });
  }

  return events;
}

function parseDTValue(line: string): { value: string; isDate: boolean; tzid: string } {
  // Handle formats like:
  // DTSTART:20260212T090000Z
  // DTSTART;VALUE=DATE:20260212
  // DTSTART;TZID=America/Chicago:20260212T090000
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return { value: "", isDate: false, tzid: "" };

  const params = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1).trim();
  const isDate = params.includes("VALUE=DATE") && !params.includes("VALUE=DATE-TIME");

  // Extract TZID if present
  let tzid = "";
  const tzidMatch = params.match(/TZID=([^;:]+)/);
  if (tzidMatch) tzid = tzidMatch[1];

  return { value, isDate, tzid };
}

function parseICSDate(value: string, allDay: boolean, tzid: string): Date {
  // Remove trailing Z if present
  const clean = value.replace(/Z$/, "");

  if (allDay && clean.length === 8) {
    // Date only: 20260212 — treat as UTC midnight to avoid timezone shifting
    const y = parseInt(clean.slice(0, 4));
    const m = parseInt(clean.slice(4, 6)) - 1;
    const d = parseInt(clean.slice(6, 8));
    return new Date(Date.UTC(y, m, d));
  }

  // DateTime: 20260212T090000
  if (clean.length >= 15 && clean[8] === "T") {
    const y = parseInt(clean.slice(0, 4));
    const m = parseInt(clean.slice(4, 6)) - 1;
    const d = parseInt(clean.slice(6, 8));
    const h = parseInt(clean.slice(9, 11));
    const min = parseInt(clean.slice(11, 13));
    const s = parseInt(clean.slice(13, 15));

    // If original had Z, it's UTC
    if (value.endsWith("Z")) {
      return new Date(Date.UTC(y, m, d, h, min, s));
    }

    // If TZID is specified, use Intl to compute the UTC offset for that timezone
    if (tzid) {
      try {
        // Use Intl.DateTimeFormat to get the UTC offset for this timezone at this time
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: tzid,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        // Create a UTC date first, then find the offset by comparing formatted output
        const utcGuess = new Date(Date.UTC(y, m, d, h, min, s));
        const parts = formatter.formatToParts(utcGuess);
        const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0");
        const tzYear = get("year");
        const tzMonth = get("month") - 1;
        const tzDay = get("day");
        const tzHour = get("hour");
        const tzMin = get("minute");
        const tzSec = get("second");
        const tzDate = new Date(Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMin, tzSec));
        const offsetMs = tzDate.getTime() - utcGuess.getTime();
        // The event time is in the target timezone, so subtract the offset to get UTC
        return new Date(Date.UTC(y, m, d, h, min, s) - offsetMs);
      } catch {
        // If timezone is unrecognized, fall back to local time
      }
    }

    // No TZID, treat as local time (floating time per RFC 5545)
    return new Date(y, m, d, h, min, s);
  }

  // Fallback: try native parsing
  return new Date(value);
}

/**
 * Fetch an ICS feed URL and parse it.
 */
export async function fetchAndParseICS(url: string): Promise<ICSEvent[]> {
  // Normalize webcal:// to https://
  const normalizedUrl = url.replace(/^webcal:\/\//, "https://");
  const res = await fetch(normalizedUrl, {
    headers: { Accept: "text/calendar" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch calendar: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  return parseICS(text);
}
