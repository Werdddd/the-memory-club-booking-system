import { createClient } from "@/lib/supabase/server";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_settings")
    .select("qr_code_url")
    .eq("id", 1)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure how the rental form works.
      </p>

      <div className="mt-8">
        <PaymentSettingsForm qrCodeUrl={data?.qr_code_url ?? null} />
      </div>
    </div>
  );
}
