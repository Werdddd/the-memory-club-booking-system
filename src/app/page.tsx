import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingTiers } from "@/components/pricing-tiers";
import {
  BookingAvailabilityCalendar,
  type EquipmentBookingRange,
} from "@/components/booking-availability-calendar";
import { Camera, CalendarCheck, PackageCheck, Sparkles } from "lucide-react";

type Equipment = {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  daily_rate: number;
  extended_daily_rate: number;
  image_url: string | null;
  is_available: boolean;
};

async function getEquipment(): Promise<{ data: Equipment[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipment")
      .select(
        "id, name, category, brand, model, daily_rate, extended_daily_rate, image_url, is_available"
      )
      .order("category")
      .returns<Equipment[]>();

    if (error) {
      console.error("Supabase query error:", error.message);
      return {
        data: [],
        error:
          "Couldn't reach Supabase. Confirm NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local point to a real project with the migrations applied.",
      };
    }
    return { data: data ?? [], error: null };
  } catch (err) {
    console.error("Supabase client error:", err);
    return {
      data: [],
      error:
        "Supabase isn't configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    };
  }
}

async function getConfirmedBookingRanges(
  equipment: Equipment[]
): Promise<EquipmentBookingRange[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_confirmed_equipment_bookings");
    if (error || !data) return [];

    const nameById = new Map(equipment.map((e) => [e.id, e.name]));
    return data
      .filter((row) => nameById.has(row.equipment_id))
      .map((row) => ({
        equipment_id: row.equipment_id,
        equipment_name: nameById.get(row.equipment_id)!,
        start_date: row.start_date,
        end_date: row.end_date,
      }));
  } catch {
    return [];
  }
}

const STEPS = [
  {
    icon: Camera,
    title: "Browse the Catalog",
    description: "Explore our curated lineup of cameras, lenses, and lighting gear.",
  },
  {
    icon: CalendarCheck,
    title: "Reserve Your Dates",
    description: "Pick your rental window and lock in your gear ahead of your shoot.",
  },
  {
    icon: PackageCheck,
    title: "Pickup & Shoot",
    description: "Collect your equipment, ready to go, and create something unforgettable.",
  },
];

export default async function Home() {
  const { data: equipment, error } = await getEquipment();
  const bookingRanges = await getConfirmedBookingRanges(equipment);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, oklch(0.78 0.13 85 / 0.16), transparent 70%)",
            }}
          />
          <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center sm:py-36">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs tracking-wide text-gold">
              <Sparkles className="size-3.5" />
              Premium gear, no compromises
            </span>
            <h1 className="text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
              Rent the Gear.
              <br />
              <span className="text-gold">Own the Moment.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              The Memory Club is Metro Manila&apos;s premium camera rental house —
              professional bodies, glass, and lighting for creators who won&apos;t
              settle for less.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <a href="#catalog">Browse Equipment</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#how-it-works">How It Works</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Catalog */}
        <section id="catalog" className="border-t border-border/50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
                The Collection
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every piece is inspected and maintained to professional standard
                before it reaches your hands.
              </p>
            </div>

            <div className="mt-14">
              {error ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-sm text-muted-foreground">
                    {error}
                  </CardContent>
                </Card>
              ) : equipment.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-sm text-muted-foreground">
                    No equipment yet. Run the migrations and seed data to populate
                    the catalog.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {equipment.map((item) => (
                    <Card
                      key={item.id}
                      className="overflow-hidden border-border/60 transition-colors hover:border-gold/40"
                    >
                      <div className="relative -mx-(--card-spacing) -mt-(--card-spacing) aspect-[4/3] bg-muted">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Camera
                              className="size-8 text-muted-foreground/50"
                              strokeWidth={1.5}
                            />
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-medium">
                            {item.name}
                          </CardTitle>
                          <Badge
                            variant={item.is_available ? "default" : "secondary"}
                          >
                            {item.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p className="capitalize">{item.category}</p>
                        {item.brand && (
                          <p>{[item.brand, item.model].filter(Boolean).join(" ")}</p>
                        )}
                        <PricingTiers
                          dailyRate={item.daily_rate}
                          extendedDailyRate={item.extended_daily_rate}
                          className="text-base font-medium text-gold"
                        />
                        {item.is_available && item.category === "camera" && (
                          <Button asChild size="sm" className="w-full">
                            <Link href={`/rent?camera=${item.id}`}>Rent Now</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {equipment.length > 0 && (
                <p className="mt-10 text-center text-sm text-muted-foreground">
                  Ready to reserve?{" "}
                  <Link href="/rent" className="text-gold underline underline-offset-4">
                    Fill out the rental form
                  </Link>{" "}
                  and our team will confirm your booking.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Availability */}
        <section id="availability" className="border-t border-border/50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
                Check Availability
              </h2>
              <p className="mt-4 text-muted-foreground">
                Dates already reserved show up here so you can plan your
                shoot around them.
              </p>
            </div>

            <div className="mt-14">
              <BookingAvailabilityCalendar ranges={bookingRanges} />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-border/50 bg-card/30">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-muted-foreground">
                Three steps between you and your next production.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
                    <step.icon className="size-6 text-gold" strokeWidth={1.5} />
                  </div>
                  <p className="mt-4 text-xs tracking-widest text-muted-foreground">
                    STEP {i + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="border-t border-border/50">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
              Ready to shoot your next project?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Reach out and our team will help you pick the right gear for your
              vision and budget.
            </p>
            <Button asChild size="lg" className="mt-8">
              <a href="#contact">Contact Us</a>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
