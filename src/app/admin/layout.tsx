import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/50 bg-card/30 md:flex">
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
            Signed in as {profile?.full_name ?? user.email}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <SignOutButton />
            <ModeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-border/50 md:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <MobileSidebar
                fullName={profile?.full_name ?? null}
                email={user.email}
              />
              <Logo size={22} />
              <span className="font-heading text-sm tracking-wide">Admin</span>
            </div>
            <div className="flex items-center gap-1">
              <ModeToggle />
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 md:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
