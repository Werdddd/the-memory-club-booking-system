"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Eye, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { formatDateTimePH } from "@/lib/dates";
import { getBookingDocumentUrl } from "@/app/admin/bookings/actions";
import type { BookingWithItems } from "@/types/models";

const DOCUMENT_FIELDS = [
  { key: "id_document_1_path", label: "Government ID #1" },
  { key: "id_document_2_path", label: "Government ID #2" },
  { key: "proof_of_billing_path", label: "Proof of Billing" },
  { key: "selfie_with_id_path", label: "Selfie with ID" },
  { key: "proof_of_payment_path", label: "Proof of Payment" },
] as const satisfies ReadonlyArray<{ key: keyof BookingWithItems; label: string }>;

export function BookingDetailDialog({ booking }: { booking: BookingWithItems }) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [loadedForId, setLoadedForId] = useState<string | null>(null);

  const documentPaths = DOCUMENT_FIELDS.map((f) => booking[f.key]).filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );
  if (booking.signature_path) documentPaths.push(booking.signature_path);
  if (booking.agreement_pdf_path) documentPaths.push(booking.agreement_pdf_path);

  useEffect(() => {
    if (!open || documentPaths.length === 0) return;

    Promise.all(documentPaths.map((p) => getBookingDocumentUrl(p))).then((results) => {
      const map: Record<string, string | null> = {};
      documentPaths.forEach((p, i) => (map[p] = results[i]));
      setUrls(map);
      setLoadedForId(booking.id);
    });
    // documentPaths is derived fresh from `booking` every render; keying off
    // booking.id keeps this effect from re-running for the same booking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking.id]);

  const loading = documentPaths.length > 0 && loadedForId !== booking.id;
  const renterName = booking.full_name ?? booking.profiles?.full_name ?? "Unknown renter";
  const signatureUrl = booking.signature_path ? urls[booking.signature_path] : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="View booking details">
          <Eye className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">{renterName}</DialogTitle>
          <DialogDescription>
            Submitted {format(new Date(booking.created_at), "MMM d, yyyy 'at' h:mm a")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <section className="grid grid-cols-2 gap-3">
            <Info label="Address" value={booking.address} />
            <Info label="Email" value={booking.email} />
            <Info label="Contact #1" value={booking.contact_number_1} />
            <Info label="Contact #2" value={booking.contact_number_2} />
            {booking.facebook_link ? (
              <div>
                <p className="text-xs text-muted-foreground">Facebook</p>
                <a
                  href={booking.facebook_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline-offset-2 hover:underline"
                >
                  View Profile
                </a>
              </div>
            ) : null}
            <Info label="Trip Type" value={booking.trip_type} className="capitalize" />
            <Info
              label="Rental Window"
              value={
                booking.pickup_time && booking.return_time
                  ? `${formatDateTimePH(booking.pickup_time)} – ${formatDateTimePH(
                      booking.return_time
                    )}`
                  : `${booking.start_date} – ${booking.end_date}`
              }
            />
            <Info label="Total" value={formatCurrency(Number(booking.total_amount))} />
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 font-medium">Equipment</h3>
            {booking.booking_items.length === 0 ? (
              <p className="text-muted-foreground">No items recorded.</p>
            ) : (
              <ul className="space-y-1">
                {booking.booking_items.map((item) => (
                  <li key={item.id} className="flex justify-between text-muted-foreground">
                    <span>
                      {item.equipment?.name ?? "Unknown item"}
                      {item.quantity > 1 ? ` x${item.quantity}` : ""}
                    </span>
                    <span>{formatCurrency(Number(item.rate_at_booking))}/day</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 font-medium">Verification Documents</h3>
            {loading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {DOCUMENT_FIELDS.map((f) => {
                  const path = booking[f.key];
                  if (typeof path !== "string" || !path) return null;
                  const url = urls[path];
                  return (
                    <a
                      key={f.key}
                      href={url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="aspect-square overflow-hidden rounded-md border border-border/60 bg-muted">
                        {url && (
                          <Image
                            src={url}
                            alt={f.label}
                            width={120}
                            height={120}
                            unoptimized
                            className="size-full object-cover transition-transform group-hover:scale-105"
                          />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{f.label}</p>
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 font-medium">Terms & Signature</h3>
            <p className="flex items-center gap-2 text-muted-foreground">
              Terms accepted
              <Badge variant={booking.terms_accepted ? "default" : "destructive"}>
                {booking.terms_accepted ? "Yes" : "No"}
              </Badge>
            </p>
            {booking.signature_method === "typed" && booking.signature_text && (
              <p className="mt-2 font-heading text-lg italic">{booking.signature_text}</p>
            )}
            {booking.signature_method === "drawn" && signatureUrl && (
              <Image
                src={signatureUrl}
                alt="Signature"
                width={200}
                height={80}
                unoptimized
                className="mt-2 rounded-md border border-border/60 bg-white"
              />
            )}
            {booking.agreement_pdf_path && (
              <a
                href={urls[booking.agreement_pdf_path] ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-gold underline-offset-2 hover:underline"
              >
                <FileText className="size-3.5" /> View / Download Signed Agreement (PDF)
              </a>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={className}>{value}</p>
    </div>
  );
}
