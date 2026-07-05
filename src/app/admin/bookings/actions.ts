"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types/models";

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
