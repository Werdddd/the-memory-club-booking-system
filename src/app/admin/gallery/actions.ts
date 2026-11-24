"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GalleryMediaType } from "@/types/models";

export type NewGalleryItem = {
  media_type: GalleryMediaType;
  storage_path: string;
  caption: string | null;
  renter_credit: string | null;
  equipment_id: string | null;
};

function revalidateGallery() {
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}

// Files are uploaded directly from the admin's browser to the `gallery`
// bucket (videos can be far larger than the Server Action body limit);
// this only records the already-uploaded objects.
export async function createGalleryItems(
  items: NewGalleryItem[],
): Promise<{ error: string } | { success: true }> {
  try {
    if (items.length === 0) return { error: "No files to save." };
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const rows = items.map((item) => ({
      ...item,
      url: supabase.storage.from("gallery").getPublicUrl(item.storage_path).data.publicUrl,
      created_by: user?.id ?? null,
    }));

    const { error } = await supabase.from("gallery_items").insert(rows);
    if (error) return { error: error.message };

    revalidateGallery();
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function updateGalleryItem(
  id: string,
  patch: {
    caption?: string | null;
    renter_credit?: string | null;
    equipment_id?: string | null;
    is_featured?: boolean;
    is_hidden?: boolean;
  },
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_items").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidateGallery();
  return { success: true };
}

export async function deleteGalleryItem(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { data: item, error: fetchError } = await supabase
    .from("gallery_items")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (fetchError) return { error: fetchError.message };

  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) return { error: error.message };

  // Best effort: a leftover object is harmless, a leftover row is not.
  await supabase.storage.from("gallery").remove([item.storage_path]);

  revalidateGallery();
  return { success: true };
}
