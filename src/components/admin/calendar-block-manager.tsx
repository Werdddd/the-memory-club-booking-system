"use client";

import { useMemo, useState, useTransition } from "react";
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
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { startOfTodayPH, toDateOnlyString } from "@/lib/dates";
import { addCalendarBlocks, removeCalendarBlock } from "@/app/admin/calendar/actions";
import type { EquipmentCategory } from "@/types/models";

type EquipmentOption = {
  id: string;
  name: string;
  category: EquipmentCategory;
};

type CalendarBlock = {
  id: string;
  block_date: string;
  equipment_id: string;
  equipment_name: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function EquipmentChecklist({
  options,
  selected,
  onToggle,
}: {
  options: EquipmentOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">No equipment available.</p>;
  }
  return (
    <div className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
      {options.map((item) => (
        <label
          key={item.id}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 px-2.5 py-2 text-sm hover:border-gold/40"
        >
          <Checkbox
            checked={selected.has(item.id)}
            onCheckedChange={() => onToggle(item.id)}
          />
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          <span className="shrink-0 text-xs capitalize text-muted-foreground">
            {item.category}
          </span>
        </label>
      ))}
    </div>
  );
}

export function CalendarBlockManager({
  equipment,
  blocks,
}: {
  equipment: EquipmentOption[];
  blocks: CalendarBlock[];
}) {
  const today = useMemo(() => startOfTodayPH(), []);
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addRange, setAddRange] = useState<DateRange | undefined>(undefined);
  const [addEquipmentIds, setAddEquipmentIds] = useState<Set<string>>(new Set());
  const [dayEquipmentIds, setDayEquipmentIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const blocksByDate = useMemo(() => {
    const map = new Map<string, CalendarBlock[]>();
    for (const block of blocks) {
      const list = map.get(block.block_date) ?? [];
      list.push(block);
      map.set(block.block_date, list);
    }
    return map;
  }, [blocks]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedKey = selectedDate ? toDateOnlyString(selectedDate) : null;
  const blockedForDay = selectedKey ? (blocksByDate.get(selectedKey) ?? []) : [];
  const blockedEquipmentIdsForDay = new Set(blockedForDay.map((b) => b.equipment_id));
  const availableToAdd = equipment.filter((e) => !blockedEquipmentIdsForDay.has(e.id));

  function openDay(day: Date) {
    setSelectedDate(day);
    setDayEquipmentIds(new Set());
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      try {
        await removeCalendarBlock(id);
        toast.success("Removed from calendar.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Remove failed.");
      }
    });
  }

  function handleAddForDay() {
    if (!selectedKey || dayEquipmentIds.size === 0) return;
    const ids = [...dayEquipmentIds];
    startTransition(async () => {
      try {
        await addCalendarBlocks(selectedKey, selectedKey, ids);
        setDayEquipmentIds(new Set());
        toast.success("Marked as booked.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  function handleAddRange() {
    if (!addRange?.from || addEquipmentIds.size === 0) return;
    const start = toDateOnlyString(addRange.from);
    const end = toDateOnlyString(addRange.to ?? addRange.from);
    const ids = [...addEquipmentIds];
    startTransition(async () => {
      try {
        await addCalendarBlocks(start, end, ids);
        toast.success("Booking block added.");
        setAddOpen(false);
        setAddRange(undefined);
        setAddEquipmentIds(new Set());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  const todayKey = toDateOnlyString(today);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-medium">{format(month, "MMMM yyyy")}</h3>
          <p className="text-xs text-muted-foreground">
            Click a date to mark or unmark booked equipment.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Add Booking Block
          </Button>
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
          const dayKey = toDateOnlyString(day);
          const isPast = dayKey < todayKey;
          const booked = inMonth ? (blocksByDate.get(dayKey) ?? []) : [];
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={!inMonth}
              onClick={() => openDay(day)}
              className={cn(
                "flex min-h-20 flex-col items-start gap-1.5 bg-card p-2 text-left transition-colors sm:min-h-28 sm:p-3",
                inMonth
                  ? "cursor-pointer hover:bg-muted"
                  : "cursor-not-allowed bg-muted/30 text-muted-foreground/40",
                isPast && inMonth && "text-muted-foreground/40",
                booked.length > 0 && "bg-gold/25 hover:bg-gold/35",
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
                  <Badge
                    variant="outline"
                    className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  >
                    {booked.length} booked
                  </Badge>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Single-date manage dialog */}
      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDate && format(selectedDate, "MMMM d, yyyy")}</DialogTitle>
            <DialogDescription>Mark or unmark equipment booked on this date.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Booked equipment</p>
              {blockedForDay.length > 0 ? (
                <ul className="space-y-2">
                  {blockedForDay.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                    >
                      <span className="truncate">{b.equipment_name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${b.equipment_name}`}
                        disabled={isPending}
                        onClick={() => handleRemove(b.id)}
                      >
                        <X className="size-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing marked yet.</p>
              )}
            </div>

            {availableToAdd.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Add equipment for this date</p>
                <EquipmentChecklist
                  options={availableToAdd}
                  selected={dayEquipmentIds}
                  onToggle={(id) => setDayEquipmentIds((prev) => toggleInSet(prev, id))}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending || dayEquipmentIds.size === 0}
                  onClick={handleAddForDay}
                >
                  Mark as Booked
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add booking block (date range) dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Booking Block</DialogTitle>
            <DialogDescription>
              Mark a date range as booked for one or more equipment items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Calendar
              mode="range"
              numberOfMonths={1}
              selected={addRange}
              onSelect={setAddRange}
              className="w-full"
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Equipment</p>
              <EquipmentChecklist
                options={equipment}
                selected={addEquipmentIds}
                onToggle={(id) => setAddEquipmentIds((prev) => toggleInSet(prev, id))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              disabled={isPending || !addRange?.from || addEquipmentIds.size === 0}
              onClick={handleAddRange}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
