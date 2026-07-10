"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BookingDetailDialog } from "@/components/admin/booking-detail-dialog";
import { BookingFormDialog } from "@/components/admin/booking-form-dialog";
import { updateBookingStatus, setDepositPaid, deleteBooking } from "@/app/admin/bookings/actions";
import type { BookingStatus, BookingWithItems, Equipment } from "@/types/models";

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "ongoing",
  "completed",
  "cancelled",
];

const STATUS_META: Record<BookingStatus, { label: string; dot: string; text: string }> = {
  pending: {
    label: "Pending",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  confirmed: {
    label: "Confirmed",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
  },
  ongoing: {
    label: "Ongoing",
    dot: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-400",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-destructive",
    text: "text-destructive",
  },
};

function StatusDot({ className }: { className?: string }) {
  return <span className={cn("size-1.5 shrink-0 rounded-full", className)} />;
}

function StatusSelect({ booking }: { booking: BookingWithItems }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(status: BookingStatus) {
    startTransition(async () => {
      try {
        await updateBookingStatus(booking.id, status);
        toast.success("Booking status updated.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed.");
      }
    });
  }

  const meta = STATUS_META[booking.status];

  return (
    <div className="flex items-center gap-2">
      <Select
        value={booking.status}
        onValueChange={(v) => handleChange(v as BookingStatus)}
        disabled={isPending}
      >
        <SelectTrigger size="sm" className={cn("w-36 font-medium", meta.text)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              <StatusDot className={STATUS_META[s].dot} />
              {STATUS_META[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />}
    </div>
  );
}

function DepositSwitch({ booking }: { booking: BookingWithItems }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    startTransition(async () => {
      try {
        await setDepositPaid(booking.id, next);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed.");
      }
    });
  }

  return (
    <Switch checked={booking.deposit_paid} disabled={isPending} onCheckedChange={handleToggle} />
  );
}

function DeleteBookingButton({ booking }: { booking: BookingWithItems }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteBooking(booking.id);
        toast.success("Booking deleted.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed.");
      }
    });
  }

  const renterName = booking.full_name ?? booking.profiles?.full_name ?? "this booking";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete booking"
          disabled={isPending}
          className="text-destructive hover:text-destructive"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete booking for {renterName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the booking and its equipment records. This can&apos;t be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function BookingsTable({
  bookings,
  equipment,
}: {
  bookings: BookingWithItems[];
  equipment: Equipment[];
}) {
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
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <div className="font-medium">
                  {booking.full_name ?? booking.profiles?.full_name ?? "Unknown customer"}
                </div>
                {(booking.contact_number_1 ?? booking.profiles?.phone) && (
                  <div className="text-xs text-muted-foreground">
                    {booking.contact_number_1 ?? booking.profiles?.phone}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(booking.start_date), "MMM d, yyyy")} –{" "}
                {format(new Date(booking.end_date), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{formatCurrency(Number(booking.total_amount))}</TableCell>
              <TableCell>
                <DepositSwitch booking={booking} />
              </TableCell>
              <TableCell>
                <StatusSelect booking={booking} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <BookingFormDialog booking={booking} equipment={equipment} />
                  <BookingDetailDialog booking={booking} />
                  <DeleteBookingButton booking={booking} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
