"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#compare", label: "Compare" },
  { href: "#pricing", label: "Pricing" },
  { href: "#integrations", label: "Integrations" },
  { href: "#calculator", label: "Calculator" },
  { href: "#faq", label: "FAQ" },
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create account" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b shadow-lg z-50">
          <nav className="flex flex-col px-6 py-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-gray-600 hover:text-gray-900 border-b last:border-0 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
