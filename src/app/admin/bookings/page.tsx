import { createClient } from "@/lib/supabase/server";
import { BookingsTable } from "@/components/admin/bookings-table";
import type { BookingWithItems } from "@/types/models";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "*, profiles(full_name, phone), booking_items(id, booking_id, equipment_id, quantity, rate_at_booking, equipment(id, name, category))"
    )
    .order("created_at", { ascending: false })
    .returns<BookingWithItems[]>();

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Bookings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track and manage customer reservations.
      </p>

      <div className="mt-8">
        <BookingsTable bookings={data ?? []} />
      </div>
    </div>
  );
}
