"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Zap } from "lucide-react";

// Demo phases: configure → generate → track
type Phase = "idle" | "configure" | "generate" | "track";

const CLIENTS = [
  { name: "Acme Corp", color: "#3b82f6", hours: "20 hrs/wk" },
  { name: "Natalie Design", color: "#10b981", hours: "12 hrs/wk" },
  { name: "BrightPath", color: "#8b5cf6", hours: "10 hrs/wk" },
];

const BLOCKS = [
  { title: "Acme Corp", time: "8:00 - 10:00", bg: "#dbeafe", border: "#3b82f6", type: "Deep Work" },
  { title: "Natalie Design", time: "10:00 - 10:45", bg: "#d1fae5", border: "#10b981", type: "Support" },
  { title: "Natalie Design", time: "10:45 - 12:45", bg: "#dbeafe", border: "#3b82f6", type: "Deep Work" },
  { title: "Lunch", time: "12:45 - 1:30", bg: "#fce7f3", border: "#ec4899", type: "" },
  { title: "Admin", time: "1:30 - 2:00", bg: "#fef3c7", border: "#f59e0b", type: "" },
  { title: "BrightPath", time: "2:00 - 4:00", bg: "#dbeafe", border: "#3b82f6", type: "Deep Work" },
  { title: "Acme Corp", time: "4:00 - 4:45", bg: "#d1fae5", border: "#10b981", type: "Support" },
  { title: "Break", time: "4:45 - 5:00", bg: "#f3f4f6", border: "#9ca3af", type: "" },
];

export function ScheduleDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleClients, setVisibleClients] = useState(0);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const [indicatorProgress, setIndicatorProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer to trigger on scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed) {
          setIsVisible(true);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasPlayed]);

  // Run the animation sequence when visible
  useEffect(() => {
    if (!isVisible || hasPlayed) return;
    setHasPlayed(true);

    // Phase 1: Configure — clients slide in one by one
    const t1 = setTimeout(() => setPhase("configure"), 400);
    const t2 = setTimeout(() => setVisibleClients(1), 800);
    const t3 = setTimeout(() => setVisibleClients(2), 1200);
    const t4 = setTimeout(() => setVisibleClients(3), 1600);

    // Phase 2: Generate — blocks cascade in
    const t5 = setTimeout(() => setPhase("generate"), 2600);
    const blockTimers: NodeJS.Timeout[] = [];
    for (let i = 0; i < BLOCKS.length; i++) {
      blockTimers.push(setTimeout(() => setVisibleBlocks(i + 1), 3000 + i * 180));
    }

    // Phase 3: Track — time indicator appears and moves
    const t6 = setTimeout(() => {
      setPhase("track");
      setShowIndicator(true);
      setIndicatorProgress(15);
    }, 4800);
    const t7 = setTimeout(() => setIndicatorProgress(45), 5400);
    const t8 = setTimeout(() => setIndicatorProgress(70), 6200);

    return () => {
      [t1, t2, t3, t4, t5, t6, t7, t8, ...blockTimers].forEach(clearTimeout);
    };
  }, [isVisible, hasPlayed]);

  // Replay
  const replay = () => {
    setPhase("idle");
    setVisibleClients(0);
    setVisibleBlocks(0);
    setShowIndicator(false);
    setIndicatorProgress(0);
    setHasPlayed(false);
    setIsVisible(false);
    // Re-trigger after reset
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
  };

  const activeStep =
    phase === "configure" ? 1 : phase === "generate" ? 2 : phase === "track" ? 3 : 0;

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-8 mb-8">
        {[
          { n: 1, label: "Add clients" },
          { n: 2, label: "Generate" },
          { n: 3, label: "Track" },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                activeStep >= n
                  ? "bg-gray-900 text-white scale-110"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {n}
            </div>
            <span
              className={`text-sm font-medium transition-colors duration-500 ${
                activeStep >= n ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Demo window */}
      <div className="rounded-xl border bg-white shadow-lg overflow-hidden">
        {/* Title bar */}
        <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-gray-400 ml-2">MyTime — Schedule</span>
        </div>

        <div className="flex min-h-[380px]">
          {/* Left panel — clients */}
          <div className="w-44 border-r bg-gray-50/50 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Clients
            </p>
            <div className="space-y-2">
              {CLIENTS.map((client, i) => (
                <div
                  key={client.name}
                  className="transition-all duration-500"
                  style={{
                    opacity: visibleClients > i ? 1 : 0,
                    transform: visibleClients > i ? "translateX(0)" : "translateX(-12px)",
                  }}
                >
                  <div className="flex items-center gap-2 p-2 rounded-md bg-white border text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: client.color }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{client.name}</p>
                      <p className="text-[10px] text-gray-400">{client.hours}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Generate button */}
            <div className="mt-4">
              <div
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-500 ${
                  phase === "generate" || phase === "track"
                    ? "bg-gray-900 text-white"
                    : visibleClients === 3
                      ? "bg-gray-900 text-white animate-pulse"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                <Zap className="h-3 w-3" />
                Generate
              </div>
            </div>
          </div>

          {/* Right panel — schedule */}
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold">Thursday, Feb 12</span>
              </div>
              {phase === "track" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium animate-fade-in">
                  Today
                </span>
              )}
            </div>

            {visibleBlocks === 0 && (
              <div className="flex items-center justify-center h-64 text-xs text-gray-300">
                {visibleClients === 3 ? "Ready to generate..." : "Add clients to get started"}
              </div>
            )}

            <div className="space-y-1">
              {BLOCKS.slice(0, visibleBlocks).map((block, idx) => {
                const isActiveBlock = phase === "track" && idx === 2; // "Natalie Design Deep Work"
                return (
                  <div
                    key={idx}
                    className="transition-all duration-300 relative"
                    style={{
                      opacity: 1,
                      animation: `slideIn 0.3s ease-out`,
                    }}
                  >
                    <div
                      className="p-2 rounded text-xs relative overflow-visible"
                      style={{
                        backgroundColor: block.bg,
                        borderLeft: `3px solid ${block.border}`,
                        opacity: phase === "track" && idx < 2 ? 0.5 : 1,
                        boxShadow: isActiveBlock
                          ? "0 0 0 2px rgba(239, 68, 68, 0.3), 0 0 8px rgba(239, 68, 68, 0.15)"
                          : "none",
                        transition: "opacity 0.5s, box-shadow 0.5s",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{block.title}</span>
                        {block.type && (
                          <span className="text-[10px] opacity-60">{block.type}</span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-75 mt-0.5">{block.time}</div>

                      {/* Time indicator inside active block */}
                      {isActiveBlock && showIndicator && (
                        <div
                          className="absolute left-0 right-0 h-[2px] bg-red-500 z-10"
                          style={{
                            top: `${indicatorProgress}%`,
                            transition: "top 0.8s ease-in-out",
                          }}
                        >
                          <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-red-500">
                            11:40am
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Replay */}
      {phase === "track" && (
        <div className="text-center mt-4">
          <button
            onClick={replay}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Replay demo
          </button>
        </div>
      )}
    </div>
  );
}
