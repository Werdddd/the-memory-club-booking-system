import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RentalForm, type RentalEquipmentOption } from "@/components/rental-form";

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<{ camera?: string }>;
}) {
  const { camera } = await searchParams;
  const supabase = await createClient();

  const [equipmentRes, addonsRes, paymentRes] = await Promise.all([
    supabase
      .from("equipment")
      .select(
        "id, name, category, brand, model, daily_rate, extended_daily_rate, image_url, is_available"
      )
      .eq("is_available", true)
      .order("name"),
    supabase.from("equipment_addons").select("equipment_id, addon_id"),
    supabase.from("payment_settings").select("qr_code_url").eq("id", 1).single(),
  ]);

  const equipment = equipmentRes.data ?? [];
  const cameras: RentalEquipmentOption[] = equipment
    .filter((e) => e.category === "camera")
    .map((e) => ({
      id: e.id,
      name: e.name,
      brand: e.brand,
      model: e.model,
      daily_rate: Number(e.daily_rate),
      extended_daily_rate: Number(e.extended_daily_rate),
      image_url: e.image_url,
    }));
  const accessories: RentalEquipmentOption[] = equipment
    .filter((e) => e.category !== "camera")
    .map((e) => ({
      id: e.id,
      name: e.name,
      brand: e.brand,
      model: e.model,
      daily_rate: Number(e.daily_rate),
      extended_daily_rate: Number(e.extended_daily_rate),
      image_url: e.image_url,
    }));

  const addonMap: Record<string, string[]> = {};
  for (const row of addonsRes.data ?? []) {
    (addonMap[row.equipment_id] ??= []).push(row.addon_id);
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
              Rental Application
            </h1>
            <p className="mt-3 text-muted-foreground">
              Fill out the form below to request your gear. Our team will
              verify your details and confirm your booking.
            </p>
          </div>

          <RentalForm
            cameras={cameras}
            accessories={accessories}
            addonMap={addonMap}
            qrCodeUrl={paymentRes.data?.qr_code_url ?? null}
            preselectedCameraId={camera}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
