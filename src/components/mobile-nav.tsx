"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#catalog", label: "Equipment" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#contact", label: "Contact" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-border/50 bg-background/95 backdrop-blur">
          <nav className="flex flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-foreground/90 transition-colors hover:bg-accent hover:text-gold"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/rent"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-primary px-2 py-2 text-center text-sm font-medium text-primary-foreground"
            >
              Book Now
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
