"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import {
  ArrowLeft,
  CalendarCheck2,
  Camera,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SignaturePad } from "@/components/signature-pad";
import { EquipmentAvailabilityRangePicker } from "@/components/equipment-availability-range-picker";
import { submitRentalApplication } from "@/app/rent/actions";
import { createClient } from "@/lib/supabase/client";
import { rentalDays, tieredDailyRate } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { combineDateAndTime, parseDateOnly, phDateTimeToUTC, formatDatePH } from "@/lib/dates";
import {
  bookedRangesForEquipment,
  dateRangeOverlapsAny,
} from "@/lib/booking-availability";
import { getSecurityDeposit, type TripType } from "@/types/models";

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
  preselectedDate?: string;
  bookedRangesByEquipment: Record<
    string,
    { start_date: string; end_date: string }[]
  >;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

// Uploaded directly from the browser to Supabase Storage (rather than
// proxied through the Server Action) so multi-photo submissions never hit
// Next.js's or the hosting platform's request body size limits.
async function uploadBookingFile(
  folder: string,
  formData: FormData,
  field: string,
): Promise<string> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) {
    throw new Error(`Missing required file: ${field.replace(/_/g, " ")}`);
  }
  const ext = file.name.split(".").pop();
  const path = `${folder}/${field}${ext ? `.${ext}` : ""}`;
  const { error } = await createClient()
    .storage.from("booking-documents")
    .upload(path, file, { contentType: file.type });
  if (error) {
    throw new Error(`Upload failed (${field.replace(/_/g, " ")}): ${error.message}`);
  }
  return path;
}

export function RentalForm({
  cameras,
  accessories,
  addonMap,
  qrCodeUrl,
  preselectedCameraId,
  preselectedDate,
  bookedRangesByEquipment,
}: RentalFormProps) {
  const [selectedCameraIds, setSelectedCameraIds] = useState<Set<string>>(
    () => new Set(preselectedCameraId ? [preselectedCameraId] : []),
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    new Set(),
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (!preselectedDate || !DATE_ONLY_PATTERN.test(preselectedDate))
      return undefined;
    const date = parseDateOnly(preselectedDate);
    return { from: date, to: date };
  });
  const [pickupTime, setPickupTime] = useState("09:00");
  const [returnTime, setReturnTime] = useState("18:00");
  const [tripType, setTripType] = useState<TripType>("local");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<"details" | "terms">("details");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber1, setContactNumber1] = useState("");
  const [contactNumber2, setContactNumber2] = useState("");
  const [email, setEmail] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const availableAddonIds = useMemo(() => {
    const ids = new Set<string>();
    selectedCameraIds.forEach((camId) => {
      (addonMap[camId] ?? []).forEach((id) => ids.add(id));
    });
    return ids;
  }, [selectedCameraIds, addonMap]);

  const availableAddons = accessories.filter((a) =>
    availableAddonIds.has(a.id),
  );

  // An add-on can stay in `selectedAddonIds` after its camera is deselected;
  // derive the effective (still-compatible) selection instead of syncing
  // state back via an effect.
  const effectiveAddonIds = useMemo(
    () =>
      new Set([...selectedAddonIds].filter((id) => availableAddonIds.has(id))),
    [selectedAddonIds, availableAddonIds],
  );

  const selectedEquipmentIds = useMemo(
    () => [...selectedCameraIds, ...effectiveAddonIds],
    [selectedCameraIds, effectiveAddonIds],
  );

  const pickupAt = useMemo(
    () => combineDateAndTime(dateRange?.from, pickupTime),
    [dateRange, pickupTime],
  );
  const returnAt = useMemo(
    () => combineDateAndTime(dateRange?.to ?? dateRange?.from, returnTime),
    [dateRange, returnTime],
  );

  // If the customer picks dates, then adds a camera/add-on that's already
  // booked on those dates, clear the now-invalid selection. `excludeDisabled`
  // on the calendar only guards live drag-selection, not selection changes
  // that happen after the fact.
  useEffect(() => {
    const booked = bookedRangesForEquipment(
      bookedRangesByEquipment,
      selectedEquipmentIds,
    );
    let didClear = false;
    setDateRange((current) => {
      if (!current?.from) return current;
      if (dateRangeOverlapsAny(current.from, current.to, booked)) {
        didClear = true;
        return undefined;
      }
      return current;
    });
    if (didClear) {
      toast.error(
        "One or more selected cameras are already booked on your chosen dates. Please pick new dates.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEquipmentIds, bookedRangesByEquipment]);

  const days = useMemo(() => {
    if (!pickupAt || !returnAt) return 0;
    // Anchor to Philippine time here, matching how the server derives the
    // same figure (submitRentalApplicationInner uses phDateTimeToUTC too) —
    // parsing the naive "YYYY-MM-DDTHH:mm" string with `new Date()` instead
    // would use the visitor's own device timezone, which can disagree with
    // the server near day boundaries and show a different day count/total
    // than what's actually charged.
    const p = phDateTimeToUTC(pickupAt);
    const r = phDateTimeToUTC(returnAt);
    if (Number.isNaN(p.getTime()) || Number.isNaN(r.getTime()) || r <= p)
      return 0;
    return rentalDays(p, r);
  }, [pickupAt, returnAt]);

  const selectedItems = useMemo(() => {
    const camObjs = cameras.filter((c) => selectedCameraIds.has(c.id));
    const addonObjs = accessories.filter((a) => effectiveAddonIds.has(a.id));
    return [...camObjs, ...addonObjs];
  }, [cameras, accessories, selectedCameraIds, effectiveAddonIds]);

  const totalEstimate = useMemo(() => {
    if (days === 0) return 0;
    return selectedItems.reduce(
      (sum, item) => sum + tieredDailyRate(item, days),
      0,
    );
  }, [selectedItems, days]);

  const downPayment = totalEstimate / 2;
  const balanceDue = totalEstimate - downPayment;
  const securityDeposit = getSecurityDeposit(tripType);

  const selectedCameraNames = cameras
    .filter((c) => selectedCameraIds.has(c.id))
    .map((c) => c.name);
  const selectedAddonNames = accessories
    .filter((a) => effectiveAddonIds.has(a.id))
    .map((a) => a.name);

  function formatDisplayDate(date: Date | undefined) {
    if (!date) return "________________";
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatDisplayTime(time: string) {
    if (!time) return "________________";
    const [hourStr, minuteStr] = time.split(":");
    const hour = Number(hourStr);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minuteStr} ${period}`;
  }

  function handleContinueToTerms() {
    if (selectedCameraIds.size === 0) {
      toast.error("Please select at least one camera.");
      return;
    }
    if (!dateRange?.from) {
      toast.error("Please select your rental dates.");
      return;
    }
    if (!formRef.current?.reportValidity()) {
      return;
    }
    setStep("terms");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit(formData: FormData) {
    if (selectedCameraIds.size === 0) {
      toast.error("Please select at least one camera.");
      return;
    }
    if (!dateRange?.from) {
      toast.error("Please select your rental dates.");
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
        const folder = crypto.randomUUID();
        const [
          idDocument1Path,
          idDocument2Path,
          proofOfBillingPath,
          selfieWithIdPath,
          proofOfPaymentPath,
        ] = await Promise.all([
          uploadBookingFile(folder, formData, "id_document_1"),
          uploadBookingFile(folder, formData, "id_document_2"),
          uploadBookingFile(folder, formData, "proof_of_billing"),
          uploadBookingFile(folder, formData, "selfie_with_id"),
          uploadBookingFile(folder, formData, "proof_of_payment"),
        ]);
        const signaturePath =
          signatureMethod === "drawn"
            ? await uploadBookingFile(folder, formData, "signature_file")
            : null;

        formData.delete("id_document_1");
        formData.delete("id_document_2");
        formData.delete("proof_of_billing");
        formData.delete("selfie_with_id");
        formData.delete("proof_of_payment");
        formData.delete("signature_file");

        formData.set("folder", folder);
        formData.set("id_document_1_path", idDocument1Path);
        formData.set("id_document_2_path", idDocument2Path);
        formData.set("proof_of_billing_path", proofOfBillingPath);
        formData.set("selfie_with_id_path", selfieWithIdPath);
        formData.set("proof_of_payment_path", proofOfPaymentPath);
        if (signaturePath) formData.set("signature_path", signaturePath);

        const result = await submitRentalApplication(formData);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setSubmitted(true);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      }
    });
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <CheckCircle2 className="size-10 text-gold" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-medium">
            Booking Submitted
          </h2>
          <p className="text-sm text-muted-foreground">
            Thanks — we&apos;ve received your rental application. Our team will
            verify your details and reach out to confirm your booking shortly.
           
          </p>
          <br />
          <p className="text-sm text-muted-foreground">
           
            To settle payment and receive
            your official booking confirmation, please message our Facebook
            page:
            https://www.facebook.com/people/The-Memory-Club-Camera-Rental/61591490163369/
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      <div className={step === "details" ? "space-y-6" : "hidden"}>
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
              <Input
                id="full_name"
                name="full_name"
                required
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                required
                placeholder="Street, Barangay, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_number_1">Contact Number 1</Label>
              <Input
                id="contact_number_1"
                name="contact_number_1"
                type="tel"
                required
                placeholder="09XX XXX XXXX"
                value={contactNumber1}
                onChange={(e) => setContactNumber1(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_number_2">
                Contact Number 2 (optional)
              </Label>
              <Input
                id="contact_number_2"
                name="contact_number_2"
                type="tel"
                placeholder="09XX XXX XXXX"
                value={contactNumber2}
                onChange={(e) => setContactNumber2(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="facebook_link">Facebook Profile Link</Label>
              <Input
                id="facebook_link"
                name="facebook_link"
                type="url"
                required
                placeholder="https://facebook.com/yourname"
                value={facebookLink}
                onChange={(e) => setFacebookLink(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Equipment selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="size-4 text-gold" /> Equipment
            </CardTitle>
            <CardDescription>
              Pick your camera(s), then any add-ons.
            </CardDescription>
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
                        setSelectedCameraIds((prev) =>
                          toggleInSet(prev, item.id),
                        )
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
                          setSelectedAddonIds((prev) =>
                            toggleInSet(prev, item.id),
                          )
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
                    {days > 0
                      ? `${days} day${days === 1 ? "" : "s"} estimated`
                      : "Pick your dates to estimate total"}
                  </span>
                  <span className="font-heading text-base font-medium text-gold">
                    {formatCurrency(totalEstimate)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rental period + trip type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck2 className="size-4 text-gold" /> Rental Period &
              Trip
            </CardTitle>
            <CardDescription>
              When you&apos;ll pick up and return the gear.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Rental Dates</Label>
              <EquipmentAvailabilityRangePicker
                bookedRangesByEquipment={bookedRangesByEquipment}
                selectedEquipmentIds={selectedEquipmentIds}
                value={dateRange}
                onChange={setDateRange}
              />
              <input type="hidden" name="pickup_at" value={pickupAt} />
              <input type="hidden" name="return_at" value={returnAt} />
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
              <Label htmlFor="return_time">Return Time</Label>
              <Input
                id="return_time"
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
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
                  <Label
                    htmlFor="trip-local"
                    className="cursor-pointer font-normal"
                  >
                    Local Trip
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="international"
                    id="trip-international"
                  />
                  <Label
                    htmlFor="trip-international"
                    className="cursor-pointer font-normal"
                  >
                    International Trip
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-gold" /> Verification
            </CardTitle>
            <CardDescription>
              Two valid government-issued primary IDs, one proof of billing, and
              a selfie holding one of your IDs.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="id_document_1">Government ID #1</Label>
              <Input
                id="id_document_1"
                name="id_document_1"
                type="file"
                accept="image/*,.pdf"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_document_2">Government ID #2</Label>
              <Input
                id="id_document_2"
                name="id_document_2"
                type="file"
                accept="image/*,.pdf"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proof_of_billing">Proof of Billing</Label>
              <Input
                id="proof_of_billing"
                name="proof_of_billing"
                type="file"
                accept="image/*,.pdf"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="selfie_with_id">Selfie with ID</Label>
              <Input
                id="selfie_with_id"
                name="selfie_with_id"
                type="file"
                accept="image/*"
                required
              />
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
              A 50% down payment is required to confirm your booking. Scan the
              QR code to pay, then upload your proof of payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 rounded-md border border-gold/40 bg-gold/5 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Rental Cost</span>
                <span className="font-medium">
                  {formatCurrency(totalEstimate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Down Payment (50%) — Due Now
                </span>
                <span className="font-heading text-base font-medium text-gold">
                  {formatCurrency(downPayment)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Balance — Due at Pickup
                </span>
                <span className="font-medium">
                  {formatCurrency(balanceDue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Security Deposit (
                  {tripType === "local" ? "Local" : "International"}) — Due at
                  Pickup
                </span>
                <span className="font-medium">
                  {formatCurrency(securityDeposit)}
                </span>
              </div>
              {days === 0 && (
                <p className="pt-1 text-xs text-muted-foreground">
                  Select your equipment and rental dates above to calculate your
                  total.
                </p>
              )}
            </div>
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
              <Input
                id="proof_of_payment"
                name="proof_of_payment"
                type="file"
                accept="image/*,.pdf"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Review */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-gold" /> Review Your Details
            </CardTitle>
            <CardDescription>
              Please double-check everything below before continuing to the
              Rental Agreement. You won&apos;t be able to edit these details
              once you proceed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Renter: </span>
                <span className="font-medium">{fullName || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Contact: </span>
                <span className="font-medium">{contactNumber1 || "—"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Address: </span>
                <span className="font-medium">{address || "—"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{email || "—"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Equipment: </span>
                <span className="font-medium">
                  {selectedCameraNames.length > 0
                    ? selectedCameraNames.join(", ")
                    : "—"}
                  {selectedAddonNames.length > 0
                    ? ` + ${selectedAddonNames.join(", ")}`
                    : ""}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Pickup: </span>
                <span className="font-medium">
                  {formatDisplayDate(dateRange?.from)} ·{" "}
                  {formatDisplayTime(pickupTime)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Return: </span>
                <span className="font-medium">
                  {formatDisplayDate(dateRange?.to ?? dateRange?.from)} ·{" "}
                  {formatDisplayTime(returnTime)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-gold/40 bg-gold/5 p-3">
              <span className="text-muted-foreground">
                Total / Down Payment
              </span>
              <span className="font-heading font-medium text-gold">
                {formatCurrency(totalEstimate)} / {formatCurrency(downPayment)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={handleContinueToTerms}
        >
          Confirm & Continue to Rental Agreement
        </Button>
      </div>

      <div className={step === "terms" ? "space-y-6" : "hidden"}>
        {/* Terms, agreement & signature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="size-4 text-gold" /> Camera Rental
              Agreement
            </CardTitle>
            <CardDescription>
              Please read the full agreement below, then sign to submit your
              application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[32rem] space-y-4 overflow-y-auto rounded-md border border-border/60 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
              <div className="space-y-1 text-center">
                <p className="font-heading text-sm font-semibold text-foreground">
                  THE MEMORY CLUB
                </p>
                <p className="font-heading text-sm font-semibold text-foreground">
                  CAMERA RENTAL AGREEMENT
                </p>
              </div>
              <p>
                This Camera Rental Agreement (&quot;Agreement&quot;) is entered
                into between The Memory Club (&quot;Lessor&quot;) and the Renter
                (&quot;Renter&quot;). By signing this Agreement, the Renter
                acknowledges that they have read, understood, and agreed to all
                the terms and conditions stated herein.
              </p>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  1. RENTAL DETAILS
                </p>
                <p>
                  Equipment Rented:{" "}
                  {selectedCameraNames.length > 0
                    ? selectedCameraNames.join(", ")
                    : "________________"}
                </p>
                <p>
                  Accessories Included:{" "}
                  {selectedAddonNames.length > 0
                    ? selectedAddonNames.join(", ")
                    : "None"}
                </p>
                <p>
                  The Renter confirms that all equipment and accessories listed
                  above were received complete, clean, and in good working
                  condition.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  2. RENTAL PERIOD
                </p>
                <p>Pickup Date: {formatDisplayDate(dateRange?.from)}</p>
                <p>Pickup Time: {formatDisplayTime(pickupTime)}</p>
                <p>
                  Return Date:{" "}
                  {formatDisplayDate(dateRange?.to ?? dateRange?.from)}
                </p>
                <p>Return Time: {formatDisplayTime(returnTime)}</p>
                <p>
                  The Renter agrees to return the equipment on or before the
                  agreed return date and time.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">3. PAYMENT</p>
                <p>Rental Fee: {formatCurrency(totalEstimate)}</p>
                <p>Security Deposit: {formatCurrency(securityDeposit)}</p>
                <p>
                  Payments shall be made through the approved payment methods of
                  The Memory Club.
                </p>
                <p>
                  The security deposit shall be refunded within 24 hours after
                  the equipment has been returned, inspected, and confirmed to
                  be complete and in satisfactory condition, less any applicable
                  deductions for damages, late fees, or other outstanding
                  charges.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  4. RENTER&apos;S RESPONSIBILITIES
                </p>
                <p>The Renter agrees to:</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    Handle the equipment with reasonable care at all times.
                  </li>
                  <li>
                    Keep the equipment safe from loss, theft, water damage, sand
                    damage, accidental drops, impact, misuse, or any other form
                    of damage.
                  </li>
                  <li>
                    Return all rented equipment and accessories complete and in
                    the same condition as received, except for normal wear and
                    tear.
                  </li>
                  <li>
                    Immediately notify The Memory Club of any damage,
                    malfunction, loss, or theft involving the equipment.
                  </li>
                  <li>
                    Not lend, transfer, sublease, or allow any person other than
                    the Renter to use the rented equipment without the prior
                    written consent of The Memory Club. The Renter remains fully
                    responsible for the equipment throughout the rental period,
                    regardless of who is using it.
                  </li>
                  <li>
                    Not modify, dismantle, or attempt to repair the equipment.
                  </li>
                </ul>
                <p>
                  For documentation purposes, The Memory Club may provide photos
                  or a video recording showing the condition of the equipment
                  prior to release.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">5. LATE RETURNS</p>
                <p>
                  The equipment must be returned on the agreed return date and
                  time.
                </p>
                <p>Late returns shall incur the following charges:</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>₱200 per hour of delay.</li>
                  <li>
                    ₱1,000 per full day for every day the equipment remains
                    unreturned beyond the agreed return date.
                  </li>
                </ul>
                <p>Late fees may be deducted from the security deposit.</p>
                <p>
                  Failure to return the equipment within twenty-four (24) hours
                  without prior communication may be considered a breach of this
                  Agreement and may result in legal action and recovery of all
                  applicable costs.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  6. DAMAGE, LOSS &amp; LIABILITY
                </p>
                <p>
                  The Renter assumes full responsibility for the rented
                  equipment from the time it is received until it is returned
                  and accepted by The Memory Club.
                </p>
                <p>In the event of damage, loss, or theft:</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    The Renter shall be responsible for the full cost of repair
                    or replacement, depending on the extent of the damage.
                  </li>
                  <li>
                    All inspections, repair decisions, and replacement
                    determinations shall be made solely by The Memory Club.
                  </li>
                  <li>
                    The Renter shall not repair or attempt to repair the
                    equipment through any third-party technician or service
                    center without the prior written approval of The Memory
                    Club. Any unauthorized repair or modification shall be
                    treated as additional damage, and the Renter shall remain
                    liable for all resulting costs.
                  </li>
                  <li>
                    If the equipment is declared beyond economical repair, lost,
                    or stolen, the Renter agrees to pay the full replacement
                    cost of a brand-new equivalent unit based on its current
                    market value.
                  </li>
                  <li>
                    The security deposit may be partially or fully forfeited
                    depending on the extent of the damage or outstanding
                    obligations.
                  </li>
                  <li>
                    If the equipment becomes unavailable for confirmed bookings
                    due to damage caused during the rental period, the Renter
                    may also be held responsible for the resulting loss of
                    rental income.
                  </li>
                </ul>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  7. BREACH OF AGREEMENT
                </p>
                <p>
                  Failure to comply with any provision of this Agreement shall
                  constitute a breach of contract.
                </p>
                <p>Upon breach, The Memory Club reserves the right to:</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Recover the rented equipment immediately;</li>
                  <li>
                    Charge all unpaid rental fees, late fees, repair costs, or
                    replacement costs;
                  </li>
                  <li>
                    Retain all or part of the security deposit where applicable;
                    and
                  </li>
                  <li>
                    Pursue any legal remedies available under the laws of the
                    Republic of the Philippines.
                  </li>
                </ul>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  8. GOVERNING LAW
                </p>
                <p>
                  This Agreement shall be governed by and interpreted in
                  accordance with the laws of the Republic of the Philippines.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  9. FORCE MAJEURE
                </p>
                <p>
                  Neither party shall be held liable for delays or failure to
                  perform their obligations under this Agreement when caused by
                  events beyond their reasonable control, including but not
                  limited to natural disasters, typhoons, floods, earthquakes,
                  government restrictions, or other unforeseen emergencies.
                </p>
                <p>
                  The Renter must notify The Memory Club as soon as reasonably
                  possible if such an event affects the return of the equipment.
                  Any extension of the rental period or waiver of applicable
                  fees shall be solely at the discretion of The Memory Club and
                  must be confirmed in writing.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  10. ACKNOWLEDGMENT
                </p>
                <p>By signing below, the Renter confirms that:</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    They have carefully read and fully understood this
                    Agreement.
                  </li>
                  <li>
                    They agree to comply with all the terms and conditions
                    stated herein.
                  </li>
                  <li>
                    They acknowledge receipt of the rented equipment and
                    accessories in good working condition.
                  </li>
                  <li>
                    They accept full responsibility for the rented equipment
                    throughout the entire rental period.
                  </li>
                  <li>
                    They understand that failure to comply with this Agreement
                    may result in additional charges and legal action where
                    necessary.
                  </li>
                </ul>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <Checkbox
                name="terms_accepted"
                checked={termsAccepted}
                onCheckedChange={(v) => setTermsAccepted(v === true)}
                className="mt-0.5"
              />
              I have read, understood, and agree to the Camera Rental Agreement
              above.
            </label>

            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <p className="text-sm font-medium">Signature</p>
              <p className="text-xs text-muted-foreground">
                Renter Name: {fullName || "________________"} · Date:{" "}
                {formatDatePH(new Date())}
              </p>
              <SignaturePad validationEnabled={step === "terms"} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => {
              setStep("details");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Submit Rental Application"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
