import type { DateRange } from "react-day-picker";

/** Parse a `date` column string ("YYYY-MM-DD") as a local calendar date (midnight local), never as a UTC instant. */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Format a Date as "YYYY-MM-DD" using its local components (not toISOString, which can shift across timezones). */
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Inclusive-inclusive overlap check between two [start,end] date-only ranges. */
export function dateRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Build react-day-picker DateRange matchers straight from date-only rows (inclusive both ends, matches DayPicker's own DateRange contract). */
export function toDayPickerRanges(
  ranges: { start_date: string; end_date: string }[]
): DateRange[] {
  return ranges.map((r) => ({
    from: parseDateOnly(r.start_date),
    to: parseDateOnly(r.end_date),
  }));
}

/** Combine a calendar date with a "HH:mm" time string into a "YYYY-MM-DDTHH:mm" string, the same shape a native datetime-local input produces. */
export function combineDateAndTime(date: Date | undefined, time: string): string {
  if (!date) return "";
  return `${toDateOnlyString(date)}T${time}`;
}
