"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setEquipmentAddons(equipmentId: string, addonIds: string[]) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("equipment_addons")
    .delete()
    .eq("equipment_id", equipmentId);

  if (deleteError) throw new Error(deleteError.message);

  if (addonIds.length > 0) {
    const { error: insertError } = await supabase.from("equipment_addons").insert(
      addonIds.map((addonId) => ({ equipment_id: equipmentId, addon_id: addonId }))
    );

    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/admin/addons");
  revalidatePath("/rent");
}
