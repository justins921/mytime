"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/* ─── Sticky Mobile CTA ───
   page-cro: CTAs should be visible at all times on mobile.
   Shows after scrolling past the hero section.
─── */

export function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (~600px)
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t bg-white/95 backdrop-blur-sm px-4 py-3"
      style={{ animation: "slideUp 0.3s ease-out" }}
    >
      <a
        href="/signup"
        className="flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-6 py-3 rounded-md text-sm w-full"
      >
        Start Free Trial
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
