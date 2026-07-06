"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rentalDays, tieredDailyRate } from "@/lib/pricing";
import { toDateOnlyString } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { renderRentalAgreementPdf } from "@/lib/rental-agreement-pdf";
import { sendBookingConfirmationEmail } from "@/lib/booking-confirmation-email";
import { getSecurityDeposit, type TripType, type SignatureMethod } from "@/types/models";

function formatAgreementDate(date: Date): string {
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function formatAgreementTime(date: Date): string {
  return date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });
}

function requireString(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`Missing required field: ${field.replace(/_/g, " ")}`);
  return value;
}

function optionalString(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

export async function submitRentalApplication(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  try {
    return await submitRentalApplicationInner(formData);
  } catch (err) {
    // Next.js redacts thrown errors from Server Actions in production
    // (replacing them with a generic "Server Components render" + digest
    // message), so validation/upload/db failures must be returned as data
    // instead of thrown to reach the customer with a useful message.
    console.error("submitRentalApplication failed:", err);
    return {
      error: err instanceof Error ? err.message : "Something went wrong. Please try again.",
    };
  }
}

async function submitRentalApplicationInner(
  formData: FormData
): Promise<{ success: true }> {
  const supabase = await createClient();

  const fullName = requireString(formData, "full_name");
  const address = requireString(formData, "address");
  const contactNumber1 = requireString(formData, "contact_number_1");
  const contactNumber2 = optionalString(formData, "contact_number_2");
  const email = requireString(formData, "email");
  const facebookLink = requireString(formData, "facebook_link");
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

  // Files are uploaded directly from the browser to Supabase Storage (see
  // rental-form.tsx) so large multi-photo submissions never have to pass
  // through this Server Action's request body; only the resulting paths
  // (and the shared folder they were minted under) arrive here.
  const folder = requireString(formData, "folder");
  const idDocument1Path = requireString(formData, "id_document_1_path");
  const idDocument2Path = requireString(formData, "id_document_2_path");
  const proofOfBillingPath = requireString(formData, "proof_of_billing_path");
  const selfieWithIdPath = requireString(formData, "selfie_with_id_path");
  const proofOfPaymentPath = requireString(formData, "proof_of_payment_path");
  const signaturePath =
    signatureMethod === "drawn" ? requireString(formData, "signature_path") : null;

  let signatureForPdf: { method: "typed"; text: string } | { method: "drawn"; dataUri: string };
  if (signatureMethod === "typed") {
    signatureForPdf = { method: "typed", text: signatureText! };
  } else {
    const { data: signatureBlob, error: signatureDownloadError } = await supabase.storage
      .from("booking-documents")
      .download(signaturePath!);
    if (signatureDownloadError || !signatureBlob) {
      throw new Error("Failed to read uploaded signature. Please try again.");
    }
    const bytes = Buffer.from(await signatureBlob.arrayBuffer());
    signatureForPdf = {
      method: "drawn",
      dataUri: `data:${signatureBlob.type || "image/png"};base64,${bytes.toString("base64")}`,
    };
  }

  const equipmentNames = items.filter((i) => equipmentIds.includes(i.id)).map((i) => i.name);
  const addonNames = items.filter((i) => addonIds.includes(i.id)).map((i) => i.name);

  const agreementPdf = await renderRentalAgreementPdf({
    fullName,
    equipmentNames,
    addonNames,
    pickupDate: formatAgreementDate(pickupAt),
    pickupTime: formatAgreementTime(pickupAt),
    returnDate: formatAgreementDate(returnAt),
    returnTime: formatAgreementTime(returnAt),
    rentalFeeLabel: formatCurrency(totalAmount),
    securityDepositLabel: formatCurrency(getSecurityDeposit(tripType)),
    agreementDate: formatAgreementDate(new Date()),
    signature: signatureForPdf,
  });

  const agreementPdfPath = `${folder}/agreement.pdf`;
  const { error: agreementUploadError } = await supabase.storage
    .from("booking-documents")
    .upload(agreementPdfPath, agreementPdf, { contentType: "application/pdf" });
  if (agreementUploadError) {
    throw new Error(`Failed to save rental agreement: ${agreementUploadError.message}`);
  }

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
      facebook_link: facebookLink,
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
      agreement_pdf_path: agreementPdfPath,
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

  try {
    await sendBookingConfirmationEmail({
      toEmail: email,
      fullName,
      equipmentNames,
      addonNames,
      pickupDate: formatAgreementDate(pickupAt),
      pickupTime: formatAgreementTime(pickupAt),
      returnDate: formatAgreementDate(returnAt),
      returnTime: formatAgreementTime(returnAt),
      totalAmountLabel: formatCurrency(totalAmount),
    });
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");

  return { success: true };
}
