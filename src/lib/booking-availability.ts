import { eachDayOfInterval } from "date-fns";
import { parseDateOnly, toDateOnlyString } from "@/lib/dates";

export type EquipmentBlockedRow = {
  equipment_id: string;
  block_date: string;
};

export function groupBlockedRowsByEquipment(
  rows: EquipmentBlockedRow[]
): Record<string, Set<string>> {
  const byEquipment: Record<string, Set<string>> = {};
  for (const row of rows) {
    (byEquipment[row.equipment_id] ??= new Set()).add(row.block_date);
  }
  return byEquipment;
}

/** Flatten the blocked dates for a set of equipment ids into one set. */
export function blockedDatesForEquipment(
  byEquipment: Record<string, Set<string>>,
  equipmentIds: Iterable<string>
): Set<string> {
  const dates = new Set<string>();
  for (const id of equipmentIds) {
    for (const date of byEquipment[id] ?? []) dates.add(date);
  }
  return dates;
}

export function dateRangeOverlapsBlocked(
  from: Date | undefined,
  to: Date | undefined,
  blockedDates: Set<string>
): boolean {
  if (!from) return false;
  const end = to ?? from;
  if (blockedDates.size === 0) return false;
  return eachDayOfInterval({ start: from, end }).some((day) =>
    blockedDates.has(toDateOnlyString(day))
  );
}

/** Expand a [start, end] date-only range (inclusive) into individual "YYYY-MM-DD" strings. */
export function expandDateRange(startDate: string, endDate: string): string[] {
  return eachDayOfInterval({
    start: parseDateOnly(startDate),
    end: parseDateOnly(endDate),
  }).map(toDateOnlyString);
}
