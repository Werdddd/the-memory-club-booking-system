import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { GalleryView, Sprockets, type GalleryCamera } from "@/components/gallery/gallery-view";
import type { GalleryItem } from "@/types/models";

export const metadata: Metadata = {
  title: "Gallery | The Memory Club",
  description: "Real photos and videos shot by Memory Club renters on our cameras.",
};

export default async function GalleryPage() {
  const supabase = await createClient();
  const [itemsRes, camerasRes] = await Promise.all([
    supabase
      .from("gallery_items")
      .select(
        "id, media_type, storage_path, url, caption, renter_credit, equipment_id, is_featured, is_hidden, created_at",
      )
      .eq("is_hidden", false)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<GalleryItem[]>(),
    supabase
      .from("equipment")
      .select("id, name, is_available")
      .eq("category", "camera")
      .order("name")
      .returns<GalleryCamera[]>(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/50">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(55% 60% at 50% 0%, oklch(0.78 0.13 85 / 0.14), transparent 70%)",
            }}
          />
          <Sprockets className="text-gold/40" />
          <div className="relative mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
            <p className="font-mono text-xs tracking-[0.3em] text-gold uppercase">
              Roll 01 · Shot by our renters
            </p>
            <h1 className="mt-5 text-4xl leading-tight font-medium tracking-tight sm:text-6xl">
              Moments, <span className="text-gold">developed.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Unedited proof of what our cameras can do — real photos and
              videos from people who rented with The Memory Club.
            </p>
          </div>
          <Sprockets className="text-gold/40" />
        </section>

        <GalleryView items={itemsRes.data ?? []} cameras={camerasRes.data ?? []} />

        {(itemsRes.data?.length ?? 0) > 0 && (
          <section className="border-t border-border/50">
            <div className="mx-auto max-w-3xl px-6 py-16 text-center">
              <h2 className="text-2xl font-medium tracking-tight">Your shot could be next.</h2>
              <p className="mt-2 text-muted-foreground">
                Rent a camera, capture your trip, and send us your favorites.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/rent">Book a Camera</Link>
              </Button>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
