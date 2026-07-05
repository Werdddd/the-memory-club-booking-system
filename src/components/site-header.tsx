import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";

const NAV_LINKS = [
  { href: "#catalog", label: "Equipment" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-heading text-lg tracking-wide">
            THE MEMORY CLUB
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ModeToggle />
          <Button asChild size="sm">
            <Link href="/rent">Book Now</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ModeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
