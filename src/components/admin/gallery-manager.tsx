"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Film, ImagePlus, Loader2, Star, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  createGalleryItems,
  deleteGalleryItem,
  updateGalleryItem,
} from "@/app/admin/gallery/actions";
import type { GalleryItem, GalleryMediaType } from "@/types/models";

type CameraOption = { id: string; name: string };

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

type PendingFile = { file: File; previewUrl: string; mediaType: GalleryMediaType };

function mediaTypeOf(file: File): GalleryMediaType | null {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export function GalleryManager({
  items,
  cameras,
}: {
  items: GalleryItem[];
  cameras: CameraOption[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [cameraId, setCameraId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const cameraNameById = useMemo(
    () => new Map(cameras.map((c) => [c.id, c.name])),
    [cameras],
  );

  // Release preview object URLs on unmount (removal/upload revoke their own).
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => {
    return () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: PendingFile[] = [];
    let skipped = 0;
    for (const file of Array.from(list)) {
      const mediaType = mediaTypeOf(file);
      if (!mediaType) {
        skipped++;
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file), mediaType });
    }
    if (skipped) toast.error(`${skipped} file(s) skipped — only photos and videos are allowed.`);
    setPending((prev) => [...prev, ...next]);
  }

  function removePending(index: number) {
    setPending((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleUpload() {
    if (pending.length === 0) {
      toast.error("Choose at least one photo or video.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      setProgress({ done: 0, total: pending.length });
      try {
        const uploaded = await Promise.all(
          pending.map(async ({ file, mediaType }) => {
            const ext = file.name.split(".").pop();
            const path = `${mediaType}s/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
            const { error } = await supabase.storage
              .from("gallery")
              .upload(path, file, { contentType: file.type });
            if (error) throw new Error(`Upload failed (${file.name}): ${error.message}`);
            setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
            return {
              media_type: mediaType,
              storage_path: path,
              caption: caption.trim() || null,
              renter_credit: credit.trim() || null,
              equipment_id: cameraId || null,
            };
          }),
        );
        const result = await createGalleryItems(uploaded);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success(`Added ${uploaded.length} item(s) to the gallery.`);
        pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setPending([]);
        setCaption("");
        setCredit("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setProgress(null);
      }
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="size-4 text-gold" /> Add to Gallery
          </CardTitle>
          <CardDescription>
            Upload one or more photos or videos. The caption, credit and camera
            below apply to every file in this upload.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
              dragOver ? "border-gold bg-gold/5" : "border-border hover:border-gold/50",
            )}
          >
            <Upload className="size-6 text-gold" strokeWidth={1.5} />
            <span className="text-sm font-medium">Drop files here or click to browse</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, WEBP, MP4, MOV…</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {pending.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
              {pending.map((p, i) => (
                <div
                  key={p.previewUrl}
                  className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                >
                  {p.mediaType === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.previewUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <video src={p.previewUrl} muted className="size-full object-cover" />
                  )}
                  {p.mediaType === "video" && (
                    <Film className="absolute bottom-1.5 left-1.5 size-4 text-white drop-shadow" />
                  )}
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    aria-label="Remove"
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="gallery_caption">Caption</Label>
              <Input
                id="gallery_caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Golden hour in Batangas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery_credit">Renter Credit</Label>
              <Input
                id="gallery_credit"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder="@renter or name (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery_camera">Shot On</Label>
              <select
                id="gallery_camera"
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Not specified</option>
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleUpload} disabled={isPending || pending.length === 0}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {progress ? `Uploading ${progress.done}/${progress.total}` : "Saving…"}
              </>
            ) : (
              <>Upload {pending.length > 0 ? `${pending.length} file(s)` : ""}</>
            )}
          </Button>
        </CardContent>
      </Card>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-medium">
            Published ({items.filter((i) => !i.is_hidden).length})
            {items.some((i) => i.is_hidden) && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                · {items.filter((i) => i.is_hidden).length} hidden
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            Starred items appear first. Hidden items are only visible to admins.
          </p>
        </div>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            Nothing here yet — upload your first shots above.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <GalleryAdminCard
                key={item.id}
                item={item}
                cameras={cameras}
                cameraName={item.equipment_id ? cameraNameById.get(item.equipment_id) : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GalleryAdminCard({
  item,
  cameras,
  cameraName,
}: {
  item: GalleryItem;
  cameras: CameraOption[];
  cameraName?: string;
}) {
  const router = useRouter();
  const [caption, setCaption] = useState(item.caption ?? "");
  const [credit, setCredit] = useState(item.renter_credit ?? "");
  const [isPending, startTransition] = useTransition();

  function save(patch: Parameters<typeof updateGalleryItem>[1], message?: string) {
    startTransition(async () => {
      const result = await updateGalleryItem(item.id, patch);
      if ("error" in result) toast.error(result.error);
      else {
        if (message) toast.success(message);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGalleryItem(item.id);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Removed from gallery.");
        router.refresh();
      }
    });
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card",
        item.is_hidden && "border-dashed",
        isPending && "opacity-60",
      )}
    >
      <div className={cn("relative aspect-square bg-muted", item.is_hidden && "opacity-40 grayscale")}>
        {item.media_type === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.caption ?? ""} className="size-full object-cover" loading="lazy" />
        ) : (
          <video src={item.url} muted controls preload="metadata" className="size-full object-cover" />
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {item.is_hidden && <Badge variant="destructive">Hidden</Badge>}
          {item.media_type === "video" && <Badge variant="secondary">Video</Badge>}
          {cameraName && <Badge variant="secondary">{cameraName}</Badge>}
        </div>
        <button
          type="button"
          onClick={() =>
            save(
              { is_featured: !item.is_featured },
              item.is_featured ? "Unfeatured." : "Featured.",
            )
          }
          aria-label={item.is_featured ? "Unfeature" : "Feature"}
          className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white"
        >
          <Star className={cn("size-4", item.is_featured && "fill-gold text-gold")} />
        </button>
      </div>
      <div className="space-y-2 p-3">
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => caption !== (item.caption ?? "") && save({ caption: caption.trim() || null })}
          placeholder="Caption"
          className="h-8 text-xs"
        />
        <Input
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
          onBlur={() =>
            credit !== (item.renter_credit ?? "") && save({ renter_credit: credit.trim() || null })
          }
          placeholder="Renter credit"
          className="h-8 text-xs"
        />
        <div className="flex gap-2">
          <select
            value={item.equipment_id ?? ""}
            onChange={(e) => save({ equipment_id: e.target.value || null })}
            className={cn(SELECT_CLASS, "h-8 text-xs")}
            aria-label="Shot on"
          >
            <option value="">Camera: not specified</option>
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() =>
              save(
                { is_hidden: !item.is_hidden },
                item.is_hidden ? "Now visible on the gallery." : "Hidden from the gallery.",
              )
            }
            aria-label={item.is_hidden ? "Show on gallery" : "Hide from gallery"}
            title={item.is_hidden ? "Show on gallery" : "Hide from gallery"}
          >
            {item.is_hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Delete">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this {item.media_type}?</AlertDialogTitle>
                <AlertDialogDescription>
                  It will be deleted from the public gallery and storage. This
                  can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
