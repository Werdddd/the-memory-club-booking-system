import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Media, Sprockets } from "@/components/gallery/gallery-view";
import type { GalleryItem } from "@/types/models";

const LIGHT_GOLD = "text-[oklch(0.82_0.13_85)]";

// Landing-page preview of the gallery: one hero tile plus four smaller
// tiles in a bento grid. Every tile links through to the full gallery.
export function GalleryTeaser({
  items,
  cameraNames,
}: {
  items: GalleryItem[];
  cameraNames: Record<string, string>;
}) {
  if (items.length === 0) return null;

  return (
    <section id="gallery" className="border-t border-border/50">
      <Sprockets className="text-gold/30" />
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div className="max-w-xl">
            <p className="font-mono text-xs tracking-[0.3em] text-gold uppercase">
              From the gallery
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
              Shot on Our Cameras
            </h2>
            <p className="mt-4 text-muted-foreground">
              Real moments captured by real renters — no studio tricks.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/gallery">
              View full gallery <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {items.map((item, i) => {
            const camera = item.equipment_id ? cameraNames[item.equipment_id] : undefined;
            const isHero = i === 0;
            return (
              <Link
                key={item.id}
                href="/gallery"
                className={cn(
                  "group relative overflow-hidden rounded-lg bg-muted",
                  isHero ? "col-span-2 aspect-square md:row-span-2 md:aspect-auto" : "aspect-square",
                )}
              >
                <Media
                  item={item}
                  hoverPlay
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                />
                <span
                  className={cn(
                    "pointer-events-none absolute top-2 left-2 rounded-sm bg-black/70 px-1.5 py-0.5 font-mono text-[10px] tracking-widest backdrop-blur-sm",
                    LIGHT_GOLD,
                  )}
                >
                  TMC {String(i + 1).padStart(2, "0")}A
                </span>
                {item.media_type === "video" && (
                  <span className="pointer-events-none absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-opacity group-hover:opacity-0">
                    <Play className="size-3.5 fill-current" />
                  </span>
                )}
                {(item.caption || camera) && (
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-white transition-all duration-300",
                      isHero
                        ? "sm:p-5"
                        : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
                    )}
                  >
                    {item.caption && (
                      <p className={cn("leading-snug font-medium", isHero ? "text-base sm:text-lg" : "text-sm")}>
                        {item.caption}
                      </p>
                    )}
                    {camera && <p className={cn("mt-0.5 text-[11px]", LIGHT_GOLD)}>Shot on {camera}</p>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      <Sprockets className="text-gold/30" />
    </section>
  );
}
