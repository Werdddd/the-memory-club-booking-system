"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePaymentQr(formData: FormData) {
  const file = formData.get("qr_code");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please choose a QR code image.");
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop();
  const path = `qr-code${ext ? `.${ext}` : ""}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-qr")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const publicUrl = supabase.storage.from("payment-qr").getPublicUrl(path).data.publicUrl;

  const { error } = await supabase
    .from("payment_settings")
    .update({ qr_code_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/rent");
}
