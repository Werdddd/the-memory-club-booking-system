"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rentalDays, tieredDailyRate } from "@/lib/pricing";
import { toDateOnlyString } from "@/lib/dates";
import type { TripType, SignatureMethod } from "@/types/models";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function requireString(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`Missing required field: ${field.replace(/_/g, " ")}`);
  return value;
}

function optionalString(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

async function uploadDocument(
  supabase: SupabaseServerClient,
  folder: string,
  formData: FormData,
  field: string,
  required: boolean
): Promise<string | null> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) {
    if (required) throw new Error(`Missing required file: ${field.replace(/_/g, " ")}`);
    return null;
  }

  const ext = file.name.split(".").pop();
  const path = `${folder}/${field}${ext ? `.${ext}` : ""}`;

  const { error } = await supabase.storage
    .from("booking-documents")
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(`Upload failed (${field}): ${error.message}`);

  return path;
}

export async function submitRentalApplication(formData: FormData) {
  const supabase = await createClient();

  const fullName = requireString(formData, "full_name");
  const address = requireString(formData, "address");
  const contactNumber1 = requireString(formData, "contact_number_1");
  const contactNumber2 = optionalString(formData, "contact_number_2");
  const email = requireString(formData, "email");
  const tripType = requireString(formData, "trip_type") as TripType;

  const pickupRaw = requireString(formData, "pickup_at");
  const returnRaw = requireString(formData, "return_at");
  const pickupAt = new Date(pickupRaw);
  const returnAt = new Date(returnRaw);
  if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(returnAt.getTime())) {
    throw new Error("Please provide valid rental and return dates/times.");
  }
  if (returnAt <= pickupAt) {
    throw new Error("Return date/time must be after the rental date/time.");
  }

  const equipmentIds = formData.getAll("equipment_ids").map(String).filter(Boolean);
  if (equipmentIds.length === 0) {
    throw new Error("Please select at least one camera.");
  }
  const addonIds = formData.getAll("addon_ids").map(String).filter(Boolean);

  const termsAccepted = formData.get("terms_accepted") === "on";
  if (!termsAccepted) {
    throw new Error("You must agree to the Terms and Conditions.");
  }

  const signatureMethod = requireString(formData, "signature_method") as SignatureMethod;
  const signatureText =
    signatureMethod === "typed" ? requireString(formData, "signature_text") : null;

  const days = rentalDays(pickupAt, returnAt);

  const allIds = [...equipmentIds, ...addonIds];
  const { data: items, error: itemsError } = await supabase
    .from("equipment")
    .select("id, name, daily_rate, extended_daily_rate, is_available")
    .in("id", allIds);

  if (itemsError) throw new Error(itemsError.message);
  if (!items || items.length !== allIds.length) {
    throw new Error("One or more selected items are no longer available.");
  }
  const unavailable = items.filter((i) => !i.is_available);
  if (unavailable.length > 0) {
    throw new Error(`${unavailable.map((i) => i.name).join(", ")} is no longer available.`);
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + tieredDailyRate(item, days),
    0
  );

  const folder = crypto.randomUUID();
  const [
    idDocument1Path,
    idDocument2Path,
    proofOfBillingPath,
    selfieWithIdPath,
    proofOfPaymentPath,
  ] = await Promise.all([
    uploadDocument(supabase, folder, formData, "id_document_1", true),
    uploadDocument(supabase, folder, formData, "id_document_2", true),
    uploadDocument(supabase, folder, formData, "proof_of_billing", true),
    uploadDocument(supabase, folder, formData, "selfie_with_id", true),
    uploadDocument(supabase, folder, formData, "proof_of_payment", true),
  ]);

  const signaturePath =
    signatureMethod === "drawn"
      ? await uploadDocument(supabase, folder, formData, "signature_file", true)
      : null;

  // Guest submissions have no SELECT grant under RLS (only admins can read
  // them back), so the id is minted here rather than via .select() after
  // insert, and reused directly for the booking_items rows below.
  const bookingId = crypto.randomUUID();

  const { error: bookingError } = await supabase
    .from("bookings")
    .insert({
      id: bookingId,
      customer_id: null,
      status: "pending",
      start_date: toDateOnlyString(pickupAt),
      end_date: toDateOnlyString(returnAt),
      pickup_time: pickupAt.toISOString(),
      return_time: returnAt.toISOString(),
      total_amount: totalAmount,
      deposit_paid: false,
      full_name: fullName,
      address,
      contact_number_1: contactNumber1,
      contact_number_2: contactNumber2,
      email,
      trip_type: tripType,
      id_document_1_path: idDocument1Path,
      id_document_2_path: idDocument2Path,
      proof_of_billing_path: proofOfBillingPath,
      selfie_with_id_path: selfieWithIdPath,
      proof_of_payment_path: proofOfPaymentPath,
      terms_accepted: termsAccepted,
      signature_method: signatureMethod,
      signature_text: signatureText,
      signature_path: signaturePath,
    });

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  const bookingItems = items.map((item) => ({
    booking_id: bookingId,
    equipment_id: item.id,
    quantity: 1,
    rate_at_booking: tieredDailyRate(item, days),
  }));

  const { error: bookingItemsError } = await supabase
    .from("booking_items")
    .insert(bookingItems);

  if (bookingItemsError) throw new Error(bookingItemsError.message);

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}
