"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rentalDays, tieredDailyRate } from "@/lib/pricing";
import type { BookingStatus } from "@/types/models";

type AdminBookingFields = {
  fullName: string;
  contactNumber1: string | null;
  email: string | null;
  notes: string | null;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  status: BookingStatus;
  depositPaid: boolean;
  totalAmount: number;
  equipmentIds: string[];
};

function parseAdminBookingForm(formData: FormData): AdminBookingFields {
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) throw new Error("Full name is required.");

  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  if (!startDate || !endDate) {
    throw new Error("Start and end dates are required.");
  }
  if (endDate < startDate) {
    throw new Error("End date must be on or after the start date.");
  }

  return {
    fullName,
    contactNumber1: String(formData.get("contact_number_1") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    startDate,
    endDate,
    pickupTime: String(formData.get("pickup_time") ?? "").trim(),
    returnTime: String(formData.get("return_time") ?? "").trim(),
    status: String(formData.get("status") ?? "pending") as BookingStatus,
    depositPaid: formData.get("deposit_paid") === "on",
    totalAmount: Number(formData.get("total_amount") ?? 0),
    equipmentIds: formData.getAll("equipment_ids").map(String).filter(Boolean),
  };
}

async function resolveBookingItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  equipmentIds: string[],
  days: number
) {
  if (equipmentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("equipment")
    .select("id, daily_rate, extended_daily_rate")
    .in("id", equipmentIds);
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    equipment_id: item.id,
    quantity: 1,
    rate_at_booking: tieredDailyRate(item, days),
  }));
}

export async function createAdminBooking(formData: FormData) {
  const input = parseAdminBookingForm(formData);
  const supabase = await createClient();

  const pickupAt = input.pickupTime ? `${input.startDate}T${input.pickupTime}` : null;
  const returnAt = input.returnTime ? `${input.endDate}T${input.returnTime}` : null;
  const days = rentalDays(
    new Date(pickupAt ?? input.startDate),
    new Date(returnAt ?? input.endDate)
  );

  const bookingItems = await resolveBookingItems(supabase, input.equipmentIds, days);

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      customer_id: null,
      status: input.status,
      start_date: input.startDate,
      end_date: input.endDate,
      pickup_time: pickupAt ? new Date(pickupAt).toISOString() : null,
      return_time: returnAt ? new Date(returnAt).toISOString() : null,
      total_amount: input.totalAmount,
      deposit_paid: input.depositPaid,
      full_name: input.fullName,
      contact_number_1: input.contactNumber1,
      email: input.email,
      notes: input.notes,
      trip_type: "local",
    })
    .select("id")
    .single();

  if (bookingError) throw new Error(bookingError.message);

  if (bookingItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(bookingItems.map((item) => ({ ...item, booking_id: booking.id })));
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateAdminBooking(id: string, formData: FormData) {
  const input = parseAdminBookingForm(formData);
  const supabase = await createClient();

  const pickupAt = input.pickupTime ? `${input.startDate}T${input.pickupTime}` : null;
  const returnAt = input.returnTime ? `${input.endDate}T${input.returnTime}` : null;
  const days = rentalDays(
    new Date(pickupAt ?? input.startDate),
    new Date(returnAt ?? input.endDate)
  );

  const bookingItems = await resolveBookingItems(supabase, input.equipmentIds, days);

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({
      status: input.status,
      start_date: input.startDate,
      end_date: input.endDate,
      pickup_time: pickupAt ? new Date(pickupAt).toISOString() : null,
      return_time: returnAt ? new Date(returnAt).toISOString() : null,
      total_amount: input.totalAmount,
      deposit_paid: input.depositPaid,
      full_name: input.fullName,
      contact_number_1: input.contactNumber1,
      email: input.email,
      notes: input.notes,
    })
    .eq("id", id);

  if (bookingError) throw new Error(bookingError.message);

  const { error: deleteError } = await supabase
    .from("booking_items")
    .delete()
    .eq("booking_id", id);
  if (deleteError) throw new Error(deleteError.message);

  if (bookingItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(bookingItems.map((item) => ({ ...item, booking_id: id })));
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteBooking(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function setDepositPaid(id: string, depositPaid: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ deposit_paid: depositPaid })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings");
}

export async function getBookingDocumentUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("booking-documents")
    .createSignedUrl(path, 60 * 10);

  if (error) return null;
  return data.signedUrl;
}
