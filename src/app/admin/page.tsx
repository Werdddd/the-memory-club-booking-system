import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CalendarClock, CheckCircle2, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  BookingAvailabilityCalendar,
  type EquipmentBookingRow,
} from "@/components/booking-availability-calendar";

type CalendarBlockRow = {
  block_date: string;
  equipment_id: string;
  equipment: { name: string } | null;
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [equipmentCount, pendingBookings, activeBookings, revenue, calendarBlocks] =
    await Promise.all([
      supabase.from("equipment").select("id", { count: "exact", head: true }),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("status", ["confirmed", "ongoing"]),
      supabase
        .from("bookings")
        .select("total_amount")
        .eq("status", "completed"),
      supabase
        .from("calendar_blocks")
        .select("block_date, equipment_id, equipment(name)")
        .order("block_date")
        .returns<CalendarBlockRow[]>(),
    ]);

  const totalRevenue = (revenue.data ?? []).reduce(
    (sum, b) => sum + Number(b.total_amount ?? 0),
    0
  );

  const bookingRows: EquipmentBookingRow[] = (calendarBlocks.data ?? []).map((block) => ({
    equipment_id: block.equipment_id,
    equipment_name: block.equipment?.name ?? "Unknown equipment",
    date: block.block_date,
  }));

  const stats = [
    {
      label: "Equipment Listed",
      value: equipmentCount.count ?? 0,
      icon: Camera,
    },
    {
      label: "Pending Bookings",
      value: pendingBookings.count ?? 0,
      icon: CalendarClock,
    },
    {
      label: "Active Rentals",
      value: activeBookings.count ?? 0,
      icon: CheckCircle2,
    },
    {
      label: "Completed Revenue",
      value: formatCurrency(totalRevenue),
      icon: Banknote,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Overview of your rental business.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-gold" strokeWidth={1.75} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Booking Calendar</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/calendar">Manage Calendar</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <BookingAvailabilityCalendar
            rows={bookingRows}
            emptyMessage="No dates marked as booked yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
