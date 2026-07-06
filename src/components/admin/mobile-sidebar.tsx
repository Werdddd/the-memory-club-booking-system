"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";

export function MobileSidebar({
  fullName,
  email,
}: {
  fullName: string | null;
  email: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border/50 bg-card outline-none",
            "data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Admin navigation
          </DialogPrimitive.Title>
          <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-6">
            <Logo size={24} />
            <span className="font-heading text-sm tracking-wide">
              THE MEMORY CLUB
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarNav />
          </div>
          <div className="shrink-0 border-t border-border/50 p-4">
            <p className="truncate text-xs text-muted-foreground">
              Signed in as {fullName ?? email}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <SignOutButton />
              <ModeToggle />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
