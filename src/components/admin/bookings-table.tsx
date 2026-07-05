"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { updateBookingStatus, setDepositPaid } from "@/app/admin/bookings/actions";
import type { Booking, BookingStatus } from "@/types/models";

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "ongoing",
  "completed",
  "cancelled",
];

const STATUS_VARIANT: Record<BookingStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  ongoing: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(id: string, status: BookingStatus) {
    startTransition(async () => {
      try {
        await updateBookingStatus(id, status);
        toast.success("Booking status updated.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed.");
      }
    });
  }

  function handleDepositToggle(id: string, next: boolean) {
    startTransition(async () => {
      try {
        await setDepositPaid(id, next);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed.");
      }
    });
  }

  if (bookings.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        No bookings yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Deposit Paid</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <div className="font-medium">
                  {booking.profiles?.full_name ?? "Unknown customer"}
                </div>
                {booking.profiles?.phone && (
                  <div className="text-xs text-muted-foreground">
                    {booking.profiles.phone}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(booking.start_date), "MMM d, yyyy")} –{" "}
                {format(new Date(booking.end_date), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{formatCurrency(Number(booking.total_amount))}</TableCell>
              <TableCell>
                <Switch
                  checked={booking.deposit_paid}
                  disabled={isPending}
                  onCheckedChange={(next) => handleDepositToggle(booking.id, next)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[booking.status]} className="capitalize">
                    {booking.status}
                  </Badge>
                  <Select
                    value={booking.status}
                    onValueChange={(v) =>
                      handleStatusChange(booking.id, v as BookingStatus)
                    }
                  >
                    <SelectTrigger size="sm" className="w-32">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
