"use client";

import { useEffect, useState } from "react";

export function Clock({ timezone = "America/Chicago" }: { timezone?: string }) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          timeZone: timezone,
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="text-right">
      <div className="text-sm font-mono font-semibold">{time}</div>
      <div className="text-xs text-muted-foreground">{date} ({timezone.split("/")[1]})</div>
    </div>
  );
}
