import { createClient } from "@/lib/supabase/server";
import { CalendarBlockManager } from "@/components/admin/calendar-block-manager";

type CalendarBlockRow = {
  id: string;
  block_date: string;
  equipment_id: string;
  equipment: { name: string } | null;
};

export default async function AdminCalendarPage() {
  const supabase = await createClient();

  const [equipmentRes, blocksRes] = await Promise.all([
    supabase
      .from("equipment")
      .select("id, name, category")
      .order("category")
      .order("name"),
    supabase
      .from("calendar_blocks")
      .select("id, block_date, equipment_id, equipment(name)")
      .order("block_date")
      .returns<CalendarBlockRow[]>(),
  ]);

  const equipment = equipmentRes.data ?? [];
  const blocks = (blocksRes.data ?? []).map((b) => ({
    id: b.id,
    block_date: b.block_date,
    equipment_id: b.equipment_id,
    equipment_name: b.equipment?.name ?? "Unknown equipment",
  }));

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Calendar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manually mark which dates each piece of equipment is booked on. This
        calendar is independent from the Bookings table — mark it yourself
        after confirming a booking.
      </p>

      <div className="mt-8">
        <CalendarBlockManager equipment={equipment} blocks={blocks} />
      </div>
    </div>
  );
}
