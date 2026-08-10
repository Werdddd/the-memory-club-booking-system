"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { expandDateRange } from "@/lib/booking-availability";

function revalidateCalendarPaths() {
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/rent");
}

export async function addCalendarBlocks(
  startDate: string,
  endDate: string,
  equipmentIds: string[]
) {
  if (equipmentIds.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dates = expandDateRange(startDate, endDate);
  const rows = dates.flatMap((block_date) =>
    equipmentIds.map((equipment_id) => ({
      block_date,
      equipment_id,
      created_by: user?.id ?? null,
    }))
  );

  const { error } = await supabase
    .from("calendar_blocks")
    .upsert(rows, { onConflict: "block_date,equipment_id", ignoreDuplicates: true });

  if (error) throw new Error(error.message);

  revalidateCalendarPaths();
}

export async function removeCalendarBlock(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_blocks").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidateCalendarPaths();
}
