"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createAdminBooking, updateAdminBooking } from "@/app/admin/bookings/actions";
import { rentalDays, tieredDailyRate } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { phDateTimeToUTC, toPHTimeInputValue } from "@/lib/dates";
import type { BookingStatus, BookingWithItems, Equipment } from "@/types/models";

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "ongoing",
  "completed",
  "cancelled",
];

export function BookingFormDialog({
  booking,
  equipment,
}: {
  booking?: BookingWithItems;
  equipment: Equipment[];
}) {
  const isEdit = Boolean(booking);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<BookingStatus>(booking?.status ?? "pending");
  const [depositPaid, setDepositPaid] = useState(booking?.deposit_paid ?? false);
  const [startDate, setStartDate] = useState(booking?.start_date ?? "");
  const [endDate, setEndDate] = useState(booking?.end_date ?? "");
  const [pickupTime, setPickupTime] = useState(toPHTimeInputValue(booking?.pickup_time ?? null));
  const [returnTime, setReturnTime] = useState(toPHTimeInputValue(booking?.return_time ?? null));
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<string>>(
    () => new Set(booking?.booking_items.map((i) => i.equipment_id) ?? [])
  );
  const [totalAmount, setTotalAmount] = useState(
    booking ? String(booking.total_amount) : ""
  );
  const [isPending, startTransition] = useTransition();

  const suggestedTotal = useMemo(() => {
    if (!startDate || !endDate || selectedEquipmentIds.size === 0) return null;
    const start = phDateTimeToUTC(`${startDate}T${pickupTime || "00:00"}`);
    const end = phDateTimeToUTC(`${endDate}T${returnTime || "00:00"}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return null;
    }
    const days = rentalDays(start, end);
    const items = equipment.filter((e) => selectedEquipmentIds.has(e.id));
    return items.reduce((sum, item) => sum + tieredDailyRate(item, days), 0);
  }, [startDate, endDate, pickupTime, returnTime, selectedEquipmentIds, equipment]);

  function applySuggestedTotal() {
    if (suggestedTotal !== null) {
      setTotalAmount(String(suggestedTotal));
    }
  }

  function toggleEquipment(id: string) {
    setSelectedEquipmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetToDefaults() {
    setStatus(booking?.status ?? "pending");
    setDepositPaid(booking?.deposit_paid ?? false);
    setStartDate(booking?.start_date ?? "");
    setEndDate(booking?.end_date ?? "");
    setPickupTime(toPHTimeInputValue(booking?.pickup_time ?? null));
    setReturnTime(toPHTimeInputValue(booking?.return_time ?? null));
    setSelectedEquipmentIds(new Set(booking?.booking_items.map((i) => i.equipment_id) ?? []));
    setTotalAmount(booking ? String(booking.total_amount) : "");
  }

  function handleSubmit(formData: FormData) {
    formData.set("status", status);
    if (depositPaid) formData.set("deposit_paid", "on");
    formData.set("start_date", startDate);
    formData.set("end_date", endDate);
    formData.set("pickup_time", pickupTime);
    formData.set("return_time", returnTime);
    formData.set("total_amount", totalAmount || "0");
    selectedEquipmentIds.forEach((id) => formData.append("equipment_ids", id));

    startTransition(async () => {
      try {
        if (isEdit && booking) {
          await updateAdminBooking(booking.id, formData);
          toast.success("Booking updated.");
        } else {
          await createAdminBooking(formData);
          toast.success("Booking added.");
        }
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetToDefaults();
      }}
    >
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Edit booking">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            Add Booking
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {isEdit ? "Edit Booking" : "Add Booking"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update this booking's details."
                : "Create a booking directly — no documents or contract needed."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                required
                defaultValue={booking?.full_name ?? ""}
                placeholder="Juan Dela Cruz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_number_1">Contact Number</Label>
              <Input
                id="contact_number_1"
                name="contact_number_1"
                defaultValue={booking?.contact_number_1 ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={booking?.email ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup_time">Pickup Time</Label>
              <Input
                id="pickup_time"
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="return_time">Return Time</Label>
              <Input
                id="return_time"
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Equipment</Label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
                {equipment.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">No equipment in catalog.</p>
                ) : (
                  equipment.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedEquipmentIds.has(item.id)}
                        onCheckedChange={() => toggleEquipment(item.id)}
                      />
                      <span className="flex-1">{item.name}</span>
                      {!item.is_available && (
                        <span className="text-xs text-muted-foreground">Unavailable</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="total_amount">Total Amount (₱)</Label>
                {suggestedTotal !== null && (
                  <button
                    type="button"
                    onClick={applySuggestedTotal}
                    className="text-xs text-gold underline-offset-2 hover:underline"
                  >
                    Use suggested: {formatCurrency(suggestedTotal)}
                  </button>
                )}
              </div>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="0"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <Label htmlFor="deposit_paid" className="cursor-pointer">
                Deposit paid
              </Label>
              <Switch
                id="deposit_paid"
                checked={depositPaid}
                onCheckedChange={setDepositPaid}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={booking?.notes ?? ""}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Booking"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
