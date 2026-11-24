"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/models";

export type GalleryCamera = { id: string; name: string; is_available: boolean };

type TypeFilter = "all" | "photo" | "video";

function frameLabel(n: number) {
  return `${String(n).padStart(2, "0")}A`;
}

// Strip of film sprocket holes used as a decorative border.
export function Sprockets({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-3 w-full opacity-60", className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, transparent 0 10px, currentColor 10px 22px, transparent 22px 32px)",
        WebkitMask:
          "linear-gradient(#000 0 0) center / 100% 6px no-repeat",
        mask: "linear-gradient(#000 0 0) center / 100% 6px no-repeat",
      }}
    />
  );
}

export function GalleryView({
  items,
  cameras,
}: {
  items: GalleryItem[];
  cameras: GalleryCamera[];
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [cameraFilter, setCameraFilter] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const cameraById = useMemo(() => new Map(cameras.map((c) => [c.id, c])), [cameras]);

  // Only offer camera chips that actually have shots.
  const camerasWithShots = useMemo(() => {
    const ids = new Set(items.map((i) => i.equipment_id).filter(Boolean));
    return cameras.filter((c) => ids.has(c.id));
  }, [items, cameras]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (typeFilter === "all" || i.media_type === typeFilter) &&
          (!cameraFilter || i.equipment_id === cameraFilter),
      ),
    [items, typeFilter, cameraFilter],
  );

  const featured = useMemo(() => items.filter((i) => i.is_featured), [items]);
  const photoCount = items.filter((i) => i.media_type === "photo").length;
  const videoCount = items.length - photoCount;

  const openItem = useCallback(
    (item: GalleryItem) => setOpenIndex(filtered.findIndex((f) => f.id === item.id)),
    [filtered],
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Camera className="mx-auto size-10 text-gold" strokeWidth={1.25} />
        <h2 className="mt-4 text-lg font-medium">The roll is still developing</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Shots from our renters will appear here soon. Be the first — book a
          camera and make something worth sharing.
        </p>
        <Button asChild className="mt-6">
          <Link href="/rent">Book Now</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <h2 className="mb-4 text-xs font-medium tracking-[0.25em] text-gold uppercase">
            Spotlight
          </h2>
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:thin]">
            {featured.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTypeFilter("all");
                  setCameraFilter(null);
                  setOpenIndex(items.findIndex((f) => f.id === item.id));
                }}
                className="group relative aspect-[4/5] w-[78%] shrink-0 snap-start overflow-hidden rounded-xl bg-muted text-left sm:w-[42%] lg:w-[31%]"
              >
                <Media item={item} hoverPlay className="transition-transform duration-700 group-hover:scale-105" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-white">
                  {item.caption && <p className="text-lg leading-snug font-medium">{item.caption}</p>}
                  <p className="mt-1 text-xs text-white/75">
                    {[
                      item.equipment_id && cameraById.get(item.equipment_id)?.name,
                      item.renter_credit && `by ${item.renter_credit}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="sticky top-16 z-20 -mx-6 mb-8 border-b border-border/50 bg-background/85 px-6 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
              All <span className="opacity-60">{items.length}</span>
            </FilterChip>
            {photoCount > 0 && (
              <FilterChip active={typeFilter === "photo"} onClick={() => setTypeFilter("photo")}>
                Photos <span className="opacity-60">{photoCount}</span>
              </FilterChip>
            )}
            {videoCount > 0 && (
              <FilterChip active={typeFilter === "video"} onClick={() => setTypeFilter("video")}>
                Videos <span className="opacity-60">{videoCount}</span>
              </FilterChip>
            )}
            {camerasWithShots.length > 0 && (
              <>
                <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
                <span className="text-xs text-muted-foreground">Shot on</span>
                {camerasWithShots.map((c) => (
                  <FilterChip
                    key={c.id}
                    active={cameraFilter === c.id}
                    onClick={() => setCameraFilter(cameraFilter === c.id ? null : c.id)}
                  >
                    {c.name}
                  </FilterChip>
                ))}
              </>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No shots match these filters yet.
          </p>
        ) : (
          <div className="columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4">
            {filtered.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item)}
                className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg bg-muted text-left animate-in fade-in slide-in-from-bottom-2 duration-500 sm:mb-4"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms`, animationFillMode: "both" }}
              >
                <Media item={item} hoverPlay className="transition-transform duration-500 group-hover:scale-[1.04]" />
                <span className="pointer-events-none absolute top-2 left-2 rounded-sm bg-black/70 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-[oklch(0.82_0.13_85)] backdrop-blur-sm">
                  TMC {frameLabel(i + 1)}
                </span>
                {item.media_type === "video" && (
                  <span className="pointer-events-none absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/55 text-white transition-opacity group-hover:opacity-0">
                    <Play className="size-3.5 fill-current" />
                  </span>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.caption && <p className="text-sm leading-snug font-medium">{item.caption}</p>}
                  {item.equipment_id && cameraById.get(item.equipment_id) && (
                    <p className="mt-0.5 text-[11px] text-[oklch(0.82_0.13_85)]">
                      Shot on {cameraById.get(item.equipment_id)!.name}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {openIndex !== null && (
        <Lightbox
          items={filtered}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
          cameraById={cameraById}
        />
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-gold bg-gold text-gold-foreground"
          : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function Media({
  item,
  hoverPlay,
  className,
}: {
  item: GalleryItem;
  hoverPlay?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  if (item.media_type === "photo") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={item.caption ?? "Gallery photo"}
        loading="lazy"
        className={cn("block size-full object-cover", className)}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={`${item.url}#t=0.1`}
      muted
      loop
      playsInline
      preload="metadata"
      onMouseEnter={hoverPlay ? () => videoRef.current?.play().catch(() => {}) : undefined}
      onMouseLeave={
        hoverPlay
          ? () => {
              const v = videoRef.current;
              if (v) {
                v.pause();
                v.currentTime = 0.1;
              }
            }
          : undefined
      }
      className={cn("block size-full object-cover", className)}
    />
  );
}

function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
  cameraById,
}: {
  items: GalleryItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  cameraById: Map<string, GalleryCamera>;
}) {
  const item = items[index];
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => onIndexChange((index + delta + items.length) % items.length),
    [index, items.length, onIndexChange],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  if (!item) return null;
  const camera = item.equipment_id ? cameraById.get(item.equipment_id) : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gallery viewer"
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white animate-in fade-in duration-200"
      onClick={onClose}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchStartX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white/70 sm:px-6">
        <span className="font-mono text-xs tracking-widest text-[oklch(0.82_0.13_85)]">
          TMC {frameLabel(index + 1)} / {String(items.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        {items.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous"
            className="absolute left-2 z-10 hidden rounded-full bg-white/10 p-2.5 transition-colors hover:bg-white/20 sm:block"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div
          key={item.id}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-full max-w-full items-center justify-center animate-in fade-in zoom-in-95 duration-300"
        >
          {item.media_type === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.caption ?? "Gallery photo"}
              className="max-h-[calc(100dvh-11rem)] max-w-full rounded-sm object-contain shadow-2xl"
            />
          ) : (
            <video
              src={item.url}
              controls
              autoPlay
              playsInline
              className="max-h-[calc(100dvh-11rem)] max-w-full rounded-sm shadow-2xl"
            />
          )}
        </div>
        {items.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next"
            className="absolute right-2 z-10 hidden rounded-full bg-white/10 p-2.5 transition-colors hover:bg-white/20 sm:block"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-6 py-5 text-center sm:flex-row sm:justify-between sm:text-left"
      >
        <div>
          {item.caption && <p className="font-medium">{item.caption}</p>}
          <p className="text-xs text-white/60">
            {[camera && `Shot on ${camera.name}`, item.renter_credit && `by ${item.renter_credit}`]
              .filter(Boolean)
              .join(" · ") || "Shot by a Memory Club renter"}
          </p>
        </div>
        {camera?.is_available && (
          <Button asChild size="sm">
            <Link href={`/rent?camera=${camera.id}`}>Rent this camera</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
