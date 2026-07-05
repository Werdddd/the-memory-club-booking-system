import { createClient } from "@/lib/supabase/server";
import { EquipmentFormDialog } from "@/components/admin/equipment-form-dialog";
import { EquipmentTable } from "@/components/admin/equipment-table";
import type { Equipment } from "@/types/models";

export default async function AdminEquipmentPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipment")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Equipment[]>();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Equipment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your rental catalog.
          </p>
        </div>
        <EquipmentFormDialog />
      </div>

      <div className="mt-8">
        <EquipmentTable equipment={data ?? []} />
      </div>
    </div>
  );
}
