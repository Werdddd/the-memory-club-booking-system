"use client";

import { useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { startOfTodayPH, toDayPickerRanges } from "@/lib/dates";
import { bookedRangesForEquipment } from "@/lib/booking-availability";

type EquipmentAvailabilityRangePickerProps = {
  bookedRangesByEquipment: Record<string, { start_date: string; end_date: string }[]>;
  selectedEquipmentIds: string[];
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
};

export function EquipmentAvailabilityRangePicker({
  bookedRangesByEquipment,
  selectedEquipmentIds,
  value,
  onChange,
  className,
}: EquipmentAvailabilityRangePickerProps) {
  const bookedMatchers = useMemo(() => {
    const ranges = bookedRangesForEquipment(bookedRangesByEquipment, selectedEquipmentIds);
    return toDayPickerRanges(ranges);
  }, [bookedRangesByEquipment, selectedEquipmentIds]);

  const disabledMatchers = useMemo(
    () => [{ before: startOfTodayPH() }, ...bookedMatchers],
    [bookedMatchers]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {selectedEquipmentIds.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Select a camera below to see live availability for your dates.
        </p>
      )}

      <Calendar
        mode="range"
        numberOfMonths={1}
        selected={value}
        onSelect={onChange}
        disabled={disabledMatchers}
        excludeDisabled
        modifiers={{ booked: bookedMatchers }}
        modifiersClassNames={{
          booked: "bg-destructive/10 text-destructive line-through opacity-100",
        }}
        className="w-full"
      />

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-destructive/60" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-primary" />
          Selected
        </span>
      </div>
    </div>
  );
}
