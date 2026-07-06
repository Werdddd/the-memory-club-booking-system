import { Mail, MapPin, Phone } from "lucide-react";
import { AdminLoginDialog } from "@/components/admin-login-dialog";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-border/50 bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-heading text-lg tracking-wide">
                THE MEMORY CLUB
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Premium camera and lens rentals for creators who demand
              nothing less than the best gear.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium tracking-wide text-gold">
              Quick Links
            </h3>
            <nav className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="#catalog" className="transition-colors hover:text-foreground">
                Equipment
              </a>
              <a
                href="#how-it-works"
                className="transition-colors hover:text-foreground"
              >
                How It Works
              </a>
              <a href="#contact" className="transition-colors hover:text-foreground">
                Contact
              </a>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-medium tracking-wide text-gold">
              Get in Touch
            </h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-gold/80" />
                Navotas, Mandaluyong City, Metro Manila
              </span>
              <a
                href="tel:+639457380873"
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Phone className="size-4 shrink-0 text-gold/80" />
                +63 945 738 0873
              </a>
              {/* <a
                href="mailto:hello@thememoryclub.com"
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Mail className="size-4 shrink-0 text-gold/80" />
                hello@thememoryclub.com
              </a> */}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse items-center gap-4 border-t border-border/40 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} The Memory Club. All rights reserved.
          </p>
          <AdminLoginDialog />
        </div>
      </div>
    </footer>
  );
}
