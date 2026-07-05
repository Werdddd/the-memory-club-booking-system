"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EquipmentCategory, EquipmentCondition } from "@/types/models";

export type EquipmentInput = {
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  daily_rate: number;
  extended_daily_rate: number;
  condition: EquipmentCondition;
  description: string;
  is_available: boolean;
};

function parseForm(formData: FormData): EquipmentInput {
  return {
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? "camera") as EquipmentCategory,
    brand: String(formData.get("brand") ?? ""),
    model: String(formData.get("model") ?? ""),
    daily_rate: Number(formData.get("daily_rate") ?? 0),
    extended_daily_rate: Number(formData.get("extended_daily_rate") ?? 0),
    condition: String(formData.get("condition") ?? "good") as EquipmentCondition,
    description: String(formData.get("description") ?? ""),
    is_available: formData.get("is_available") === "on",
  };
}

async function uploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData
): Promise<string | null> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

  const { error } = await supabase.storage
    .from("equipment-images")
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  return supabase.storage.from("equipment-images").getPublicUrl(path).data
    .publicUrl;
}

export async function createEquipment(formData: FormData) {
  const input = parseForm(formData);
  const supabase = await createClient();
  const imageUrl = await uploadImage(supabase, formData);

  const { error } = await supabase.from("equipment").insert({
    name: input.name,
    category: input.category,
    brand: input.brand || null,
    model: input.model || null,
    daily_rate: input.daily_rate,
    extended_daily_rate: input.extended_daily_rate,
    condition: input.condition,
    description: input.description || null,
    is_available: input.is_available,
    image_url: imageUrl,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/equipment");
  revalidatePath("/");
}

export async function updateEquipment(id: string, formData: FormData) {
  const input = parseForm(formData);
  const supabase = await createClient();
  const imageUrl = await uploadImage(supabase, formData);

  const { error } = await supabase
    .from("equipment")
    .update({
      name: input.name,
      category: input.category,
      brand: input.brand || null,
      model: input.model || null,
      daily_rate: input.daily_rate,
      extended_daily_rate: input.extended_daily_rate,
      condition: input.condition,
      description: input.description || null,
      is_available: input.is_available,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/equipment");
  revalidatePath("/");
}

export async function deleteEquipment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("equipment").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/equipment");
  revalidatePath("/");
}

export async function toggleAvailability(id: string, isAvailable: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("equipment")
    .update({ is_available: isAvailable })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/equipment");
  revalidatePath("/");
}
