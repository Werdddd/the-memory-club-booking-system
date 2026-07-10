import { createClient } from "@/lib/supabase/server";
import { BookingsTable } from "@/components/admin/bookings-table";
import { BookingFormDialog } from "@/components/admin/booking-form-dialog";
import type { BookingWithItems, Equipment } from "@/types/models";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const [{ data: bookings }, { data: equipment }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "*, profiles(full_name, phone), booking_items(id, booking_id, equipment_id, quantity, rate_at_booking, equipment(id, name, category))"
      )
      .order("created_at", { ascending: false })
      .returns<BookingWithItems[]>(),
    supabase
      .from("equipment")
      .select("*")
      .order("name")
      .returns<Equipment[]>(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage customer reservations.
          </p>
        </div>
        <BookingFormDialog equipment={equipment ?? []} />
      </div>

      <div className="mt-8">
        <BookingsTable bookings={bookings ?? []} equipment={equipment ?? []} />
      </div>
    </div>
  );
}
