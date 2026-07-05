import { dateRangesOverlap, parseDateOnly, toDateOnlyString } from "@/lib/dates";

export type EquipmentBookedRow = {
  equipment_id: string;
  start_date: string;
  end_date: string;
};

/**
 * A booking's `end_date` is the return day, not another full day of use — the
 * equipment comes back that morning and is free for a same-day handoff to the
 * next renter. So the day actually blocked on the calendar is the one before
 * the return date, not the return date itself. A same-day booking (pickup and
 * return on the same calendar date) still blocks that one day.
 */
export function blockedEndDate(startDate: string, endDate: string): string {
  if (endDate <= startDate) return startDate;
  const returnDate = parseDateOnly(endDate);
  returnDate.setDate(returnDate.getDate() - 1);
  return toDateOnlyString(returnDate);
}

export function groupBookedRowsByEquipment(
  rows: EquipmentBookedRow[]
): Record<string, { start_date: string; end_date: string }[]> {
  const byEquipment: Record<string, { start_date: string; end_date: string }[]> = {};
  for (const row of rows) {
    (byEquipment[row.equipment_id] ??= []).push({
      start_date: row.start_date,
      end_date: blockedEndDate(row.start_date, row.end_date),
    });
  }
  return byEquipment;
}

/** Flatten the booked ranges for a set of equipment ids into one list. */
export function bookedRangesForEquipment(
  byEquipment: Record<string, { start_date: string; end_date: string }[]>,
  equipmentIds: Iterable<string>
): { start_date: string; end_date: string }[] {
  const ranges: { start_date: string; end_date: string }[] = [];
  for (const id of equipmentIds) {
    ranges.push(...(byEquipment[id] ?? []));
  }
  return ranges;
}

export function dateRangeOverlapsAny(
  from: Date | undefined,
  to: Date | undefined,
  bookedRanges: { start_date: string; end_date: string }[]
): boolean {
  if (!from) return false;
  const start = toDateOnlyString(from);
  const end = toDateOnlyString(to ?? from);
  return bookedRanges.some((r) => dateRangesOverlap(start, end, r.start_date, r.end_date));
}
