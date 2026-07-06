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
import { startOfTodayPH, toDateOnlyString } from "@/lib/dates";

export type EquipmentBookingRange = {
  equipment_id: string;
  equipment_name: string;
  start_date: string;
  end_date: string;
  status: "confirmed" | "completed";
};

const STATUS_META = {
  confirmed: {
    label: "Booked",
    dot: "bg-blue-500",
    badgeClassName:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    badgeClassName:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
} as const;

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
  const today = useMemo(() => startOfTodayPH(), []);
  const currentMonth = useMemo(() => startOfMonth(today), [today]);
  const [month, setMonth] = useState(() => currentMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const canGoToPreviousMonth = month > currentMonth;
  const todayKey = toDateOnlyString(today);

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
          <span className="mr-2 hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
            <span className="flex items-center gap-1.5">
              <span className={cn("inline-block size-2.5 rounded-full", STATUS_META.confirmed.dot)} />
              Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className={cn("inline-block size-2.5 rounded-full", STATUS_META.completed.dot)} />
              Completed
            </span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous month"
            disabled={!canGoToPreviousMonth}
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
          const isPast = toDateOnlyString(day) < todayKey;
          const booked = inMonth ? equipmentBookedOn(day) : [];
          const confirmedCount = booked.filter((b) => b.status === "confirmed").length;
          const completedCount = booked.filter((b) => b.status === "completed").length;
          // Past days can't be used to start a new booking, but a past day
          // with booking history is still worth opening to see what was
          // booked, so it stays clickable.
          const clickable = inMonth && (!isPast || booked.length > 0);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={!clickable}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "flex min-h-20 flex-col items-start gap-1.5 bg-card p-2 text-left transition-colors sm:min-h-28 sm:p-3",
                clickable
                  ? "cursor-pointer hover:bg-muted"
                  : "cursor-not-allowed bg-muted/30 text-muted-foreground/40",
                isPast && inMonth && "text-muted-foreground/40",
                isCurrentDay && inMonth && "ring-1 ring-inset ring-gold/50"
              )}
            >
              <span
                className={cn(
                  "text-sm",
                  isCurrentDay && inMonth && "font-semibold text-gold"
                )}
              >
                {format(day, "d")}
              </span>
              {booked.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1">
                  {confirmedCount > 0 && (
                    <Badge variant="outline" className={STATUS_META.confirmed.badgeClassName}>
                      {confirmedCount} booked
                    </Badge>
                  )}
                  {completedCount > 0 && (
                    <Badge variant="outline" className={STATUS_META.completed.badgeClassName}>
                      {completedCount} completed
                    </Badge>
                  )}
                </div>
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
                : "No bookings for this date yet."}
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
                  <Badge variant="outline" className={cn("shrink-0", STATUS_META[b.status].badgeClassName)}>
                    {STATUS_META[b.status].label}
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
