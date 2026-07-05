import { createClient } from "@/lib/supabase/server";
import { AddonManager } from "@/components/admin/addon-manager";
import type { Equipment } from "@/types/models";

export default async function AdminAddonsPage() {
  const supabase = await createClient();

  const [equipmentRes, mappingsRes] = await Promise.all([
    supabase.from("equipment").select("*").order("name").returns<Equipment[]>(),
    supabase.from("equipment_addons").select("equipment_id, addon_id"),
  ]);

  const equipment = equipmentRes.data ?? [];
  const cameras = equipment.filter((e) => e.category === "camera");
  const accessories = equipment.filter((e) => e.category !== "camera");

  const initialMap: Record<string, string[]> = {};
  for (const row of mappingsRes.data ?? []) {
    (initialMap[row.equipment_id] ??= []).push(row.addon_id);
  }

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Add-Ons</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose which accessories are offered alongside each camera on the
        rental form.
      </p>

      <div className="mt-8">
        <AddonManager cameras={cameras} accessories={accessories} initialMap={initialMap} />
      </div>
    </div>
  );
}
