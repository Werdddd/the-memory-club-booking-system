"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  CalendarCheck2,
  Camera,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SignaturePad } from "@/components/signature-pad";
import { submitRentalApplication } from "@/app/rent/actions";
import { rentalDays, tieredDailyRate } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import type { TripType } from "@/types/models";

export type RentalEquipmentOption = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  daily_rate: number;
  extended_daily_rate: number;
  image_url: string | null;
};

type RentalFormProps = {
  cameras: RentalEquipmentOption[];
  accessories: RentalEquipmentOption[];
  addonMap: Record<string, string[]>;
  qrCodeUrl: string | null;
  preselectedCameraId?: string;
};

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function RentalForm({
  cameras,
  accessories,
  addonMap,
  qrCodeUrl,
  preselectedCameraId,
}: RentalFormProps) {
  const [selectedCameraIds, setSelectedCameraIds] = useState<Set<string>>(
    () => new Set(preselectedCameraId ? [preselectedCameraId] : [])
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [pickupAt, setPickupAt] = useState("");
  const [returnAt, setReturnAt] = useState("");
  const [tripType, setTripType] = useState<TripType>("local");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const availableAddonIds = useMemo(() => {
    const ids = new Set<string>();
    selectedCameraIds.forEach((camId) => {
      (addonMap[camId] ?? []).forEach((id) => ids.add(id));
    });
    return ids;
  }, [selectedCameraIds, addonMap]);

  const availableAddons = accessories.filter((a) => availableAddonIds.has(a.id));

  // An add-on can stay in `selectedAddonIds` after its camera is deselected;
  // derive the effective (still-compatible) selection instead of syncing
  // state back via an effect.
  const effectiveAddonIds = useMemo(
    () => new Set([...selectedAddonIds].filter((id) => availableAddonIds.has(id))),
    [selectedAddonIds, availableAddonIds]
  );

  const days = useMemo(() => {
    if (!pickupAt || !returnAt) return 0;
    const p = new Date(pickupAt);
    const r = new Date(returnAt);
    if (Number.isNaN(p.getTime()) || Number.isNaN(r.getTime()) || r <= p) return 0;
    return rentalDays(p, r);
  }, [pickupAt, returnAt]);

  const selectedItems = useMemo(() => {
    const camObjs = cameras.filter((c) => selectedCameraIds.has(c.id));
    const addonObjs = accessories.filter((a) => effectiveAddonIds.has(a.id));
    return [...camObjs, ...addonObjs];
  }, [cameras, accessories, selectedCameraIds, effectiveAddonIds]);

  const totalEstimate = useMemo(() => {
    if (days === 0) return 0;
    return selectedItems.reduce((sum, item) => sum + tieredDailyRate(item, days), 0);
  }, [selectedItems, days]);

  function handleSubmit(formData: FormData) {
    if (selectedCameraIds.size === 0) {
      toast.error("Please select at least one camera.");
      return;
    }
    if (!termsAccepted) {
      toast.error("You must agree to the Terms and Conditions.");
      return;
    }
    const signatureMethod = formData.get("signature_method");
    if (signatureMethod === "drawn") {
      const signatureFile = formData.get("signature_file");
      if (!(signatureFile instanceof File) || signatureFile.size === 0) {
        toast.error("Please draw your signature.");
        return;
      }
    }

    formData.set("trip_type", tripType);
    selectedCameraIds.forEach((id) => formData.append("equipment_ids", id));
    effectiveAddonIds.forEach((id) => formData.append("addon_ids", id));

    startTransition(async () => {
      try {
        await submitRentalApplication(formData);
        setSubmitted(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <CheckCircle2 className="size-10 text-gold" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-medium">Application Submitted</h2>
          <p className="text-sm text-muted-foreground">
            Thanks — we&apos;ve received your rental application. Our team will
            verify your details and reach out to confirm your booking shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Renter information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-gold" /> Renter Information
          </CardTitle>
          <CardDescription>Tell us who&apos;s renting.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="full_name">Full Legal Name</Label>
            <Input id="full_name" name="full_name" required placeholder="Juan Dela Cruz" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" required placeholder="Street, Barangay, City" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_number_1">Contact Number 1</Label>
            <Input id="contact_number_1" name="contact_number_1" type="tel" required placeholder="09XX XXX XXXX" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_number_2">Contact Number 2 (optional)</Label>
            <Input id="contact_number_2" name="contact_number_2" type="tel" placeholder="09XX XXX XXXX" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
        </CardContent>
      </Card>

      {/* Rental period + trip type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck2 className="size-4 text-gold" /> Rental Period & Trip
          </CardTitle>
          <CardDescription>When you&apos;ll pick up and return the gear.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pickup_at">Date & Time of Renting</Label>
            <Input
              id="pickup_at"
              name="pickup_at"
              type="datetime-local"
              required
              value={pickupAt}
              onChange={(e) => setPickupAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="return_at">Date & Time of Return</Label>
            <Input
              id="return_at"
              name="return_at"
              type="datetime-local"
              required
              value={returnAt}
              onChange={(e) => setReturnAt(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Trip Type</Label>
            <RadioGroup
              value={tripType}
              onValueChange={(v) => setTripType(v as TripType)}
              className="grid-flow-col justify-start gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="local" id="trip-local" />
                <Label htmlFor="trip-local" className="cursor-pointer font-normal">
                  Local Trip
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="international" id="trip-international" />
                <Label htmlFor="trip-international" className="cursor-pointer font-normal">
                  International Trip
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Equipment selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="size-4 text-gold" /> Equipment
          </CardTitle>
          <CardDescription>Pick your camera(s), then any add-ons.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Cameras</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cameras.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border/60 p-3 text-sm hover:border-gold/40"
                >
                  <Checkbox
                    checked={selectedCameraIds.has(item.id)}
                    onCheckedChange={() =>
                      setSelectedCameraIds((prev) => toggleInSet(prev, item.id))
                    }
                  />
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                      className="size-9 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Camera className="size-4 text-muted-foreground/60" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(item.daily_rate)}/day (1-3d) ·{" "}
                      {formatCurrency(item.extended_daily_rate)}/day (4+d)
                    </div>
                  </div>
                </label>
              ))}
              {cameras.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No cameras are available right now.
                </p>
              )}
            </div>
          </div>

          {availableAddons.length > 0 && (
            <div className="space-y-2">
              <Label>Add-ons</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {availableAddons.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-border/60 p-3 text-sm hover:border-gold/40"
                  >
                    <Checkbox
                      checked={selectedAddonIds.has(item.id)}
                      onCheckedChange={() =>
                        setSelectedAddonIds((prev) => toggleInSet(prev, item.id))
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(item.daily_rate)}/day (1-3d) ·{" "}
                        {formatCurrency(item.extended_daily_rate)}/day (4+d)
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {selectedItems.length > 0 && (
            <div className="rounded-md border border-dashed border-gold/40 bg-gold/5 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {days > 0 ? `${days} day${days === 1 ? "" : "s"} estimated` : "Pick your dates to estimate total"}
                </span>
                <span className="font-heading text-base font-medium text-gold">
                  {formatCurrency(totalEstimate)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-gold" /> Verification
          </CardTitle>
          <CardDescription>
            Two valid government-issued primary IDs, one proof of billing, and a
            selfie holding one of your IDs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="id_document_1">Government ID #1</Label>
            <Input id="id_document_1" name="id_document_1" type="file" accept="image/*,.pdf" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="id_document_2">Government ID #2</Label>
            <Input id="id_document_2" name="id_document_2" type="file" accept="image/*,.pdf" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proof_of_billing">Proof of Billing</Label>
            <Input id="proof_of_billing" name="proof_of_billing" type="file" accept="image/*,.pdf" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="selfie_with_id">Selfie with ID</Label>
            <Input id="selfie_with_id" name="selfie_with_id" type="file" accept="image/*" required />
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4 text-gold" /> Payment
          </CardTitle>
          <CardDescription>
            Scan the QR code to pay, then upload your proof of payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrCodeUrl ? (
            <Image
              src={qrCodeUrl}
              alt="Payment QR code"
              width={200}
              height={200}
              unoptimized
              className="mx-auto rounded-md border border-border/60"
            />
          ) : (
            <p className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              Payment QR code hasn&apos;t been set up yet — please contact us
              directly to arrange payment.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="proof_of_payment">Proof of Payment</Label>
            <Input id="proof_of_payment" name="proof_of_payment" type="file" accept="image/*,.pdf" required />
          </div>
        </CardContent>
      </Card>

      {/* Terms, agreement & signature */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-40 overflow-y-auto rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <p>
              By submitting this rental application, the renter agrees to
              return all equipment on the agreed date and time, in the same
              condition as received, save for reasonable wear and tear. The
              renter is fully liable for loss, theft, or damage while the
              equipment is in their possession. A valid deposit and the
              verification documents above are required before pickup. Late
              returns are subject to additional daily charges. The Memory
              Club reserves the right to refuse or cancel any booking that
              fails verification.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <Checkbox
              name="terms_accepted"
              checked={termsAccepted}
              onCheckedChange={(v) => setTermsAccepted(v === true)}
              className="mt-0.5"
            />
            I have read, understood, and agree to the Terms and Conditions above.
          </label>

          <div className="space-y-2">
            <Label>Signature</Label>
            <SignaturePad />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : "Submit Rental Application"}
      </Button>
    </form>
  );
}
