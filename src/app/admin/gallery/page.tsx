import { createClient } from "@/lib/supabase/server";
import { GalleryManager } from "@/components/admin/gallery-manager";
import type { GalleryItem } from "@/types/models";

export default async function AdminGalleryPage() {
  const supabase = await createClient();

  const [itemsRes, camerasRes] = await Promise.all([
    supabase
      .from("gallery_items")
      .select(
        "id, media_type, storage_path, url, caption, renter_credit, equipment_id, is_featured, is_hidden, created_at",
      )
      .order("created_at", { ascending: false })
      .returns<GalleryItem[]>(),
    supabase.from("equipment").select("id, name").eq("category", "camera").order("name"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Gallery</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Share photos and videos shot by previous renters so customers can see
        what each camera can do.
      </p>

      <div className="mt-8">
        <GalleryManager items={itemsRes.data ?? []} cameras={camerasRes.data ?? []} />
      </div>
    </div>
  );
}
