"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toDateOnlyString } from "@/lib/dates";

export type EquipmentBookingRange = {
  equipment_id: string;
  equipment_name: string;
  start_date: string;
  end_date: string;
};

type BookingAvailabilityCalendarProps = {
  ranges: EquipmentBookingRange[];
  className?: string;
  emptyMessage?: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingAvailabilityCalendar({
  ranges,
  className,
  emptyMessage = "No confirmed bookings yet.",
}: BookingAvailabilityCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  function equipmentBookedOn(date: Date): EquipmentBookingRange[] {
    const key = toDateOnlyString(date);
    return ranges.filter((r) => r.start_date <= key && key <= r.end_date);
  }

  const selectedBookings = selectedDate ? equipmentBookedOn(selectedDate) : [];

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-medium">{format(month, "MMMM yyyy")}</h3>
          {ranges.length === 0 && (
            <p className="text-xs text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-2 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <span className="inline-block size-2.5 rounded-full bg-destructive/60" />
            Booked
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="bg-card px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}

        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const booked = inMonth ? equipmentBookedOn(day) : [];
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={!inMonth}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "flex min-h-20 flex-col items-start gap-1.5 bg-card p-2 text-left transition-colors sm:min-h-28 sm:p-3",
                inMonth
                  ? "cursor-pointer hover:bg-muted"
                  : "cursor-default bg-muted/30 text-muted-foreground/40",
                today && inMonth && "ring-1 ring-inset ring-gold/50"
              )}
            >
              <span
                className={cn(
                  "text-sm",
                  today && inMonth && "font-semibold text-gold"
                )}
              >
                {format(day, "d")}
              </span>
              {booked.length > 0 && (
                <Badge variant="destructive" className="mt-auto">
                  {booked.length} booked
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDate && format(selectedDate, "MMMM d, yyyy")}</DialogTitle>
            <DialogDescription>
              {selectedBookings.length > 0
                ? "Equipment booked on this date."
                : "No confirmed bookings for this date yet."}
            </DialogDescription>
          </DialogHeader>

          {selectedBookings.length > 0 ? (
            <ul className="space-y-2">
              {selectedBookings.map((b, i) => (
                <li
                  key={`${b.equipment_id}-${i}`}
                  className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="truncate">{b.equipment_name}</span>
                  <Badge variant="destructive" className="shrink-0">
                    Booked
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <Button asChild className="w-full">
              <Link href={selectedDate ? `/rent?date=${toDateOnlyString(selectedDate)}` : "/rent"}>
                Book Now
              </Link>
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
