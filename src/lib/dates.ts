import type { DateRange } from "react-day-picker";

/** The business operates in the Philippines only, which has a single fixed UTC+8 offset (no DST). */
const PH_TIME_ZONE = "Asia/Manila";
const PH_UTC_OFFSET = "+08:00";

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

/**
 * Today's calendar date in the Philippines (UTC+8, no DST), regardless of the
 * visitor's device timezone, returned as a local midnight Date so it compares
 * correctly against other date-only values in this file (e.g. parseDateOnly).
 */
export function startOfTodayPH(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return new Date(year, month - 1, day);
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

/**
 * Convert a "YYYY-MM-DDTHH:mm" wall-clock string (from a datetime-local
 * input, or built via combineDateAndTime / `${date}T${time}`) into the UTC
 * instant it represents, always treating the wall time as Philippine local
 * time (UTC+8). Using `new Date(dateTimeLocal)` directly is wrong here: a
 * date-time string with no timezone offset is parsed in whatever timezone
 * the JS runtime happens to be in (the browser's when a customer submits
 * the form, the server's when the value is saved), so the same "8:00 AM"
 * can be stored as a different instant depending on where the code runs.
 * Anchoring explicitly to +08:00 makes the result identical everywhere.
 */
export function phDateTimeToUTC(dateTimeLocal: string): Date {
  return new Date(`${dateTimeLocal}:00${PH_UTC_OFFSET}`);
}

/**
 * Extract the "HH:mm" Philippine wall-clock time from a stored UTC instant
 * (e.g. a `timestamptz` column), for populating a `<input type="time">`.
 * Using `date.toTimeString()` / `toLocaleTimeString()` without a timezone
 * would instead show the time in whatever machine is running the code.
 */
export function toPHTimeInputValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIME_ZONE,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

/** Format a stored UTC instant as "MMM d, h:mm a" in Philippine local time, regardless of the viewer's own timezone. */
export function formatDateTimePH(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/** Format a stored UTC instant as "MMM d, yyyy at h:mm a" in Philippine local time, regardless of the viewer's own timezone. */
export function formatDateTimePHWithYear(iso: string): string {
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${datePart} at ${timePart}`;
}

/**
 * Format a Date (any UTC instant, e.g. `pickupAt`/`returnAt` derived via
 * phDateTimeToUTC) as its Philippine calendar date, "YYYY-MM-DD". Always use
 * this — never toDateOnlyString — when the input represents an instant
 * rather than an already-local calendar date: toDateOnlyString reads the
 * runtime's own local components, which drifts by a day whenever the server
 * process isn't running in Asia/Manila (e.g. Vercel's default UTC).
 */
export function toDateOnlyStringPH(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

/** Format a Date (any instant) as a long-form Philippine calendar date, e.g. "July 20, 2026". */
export function formatDatePH(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: PH_TIME_ZONE,
  });
}

/** Format a Date (any instant) as a Philippine wall-clock time, e.g. "6:00 AM". */
export function formatTimePH(date: Date): string {
  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: PH_TIME_ZONE,
  });
}
