-- Public rental application form: guest checkout, ID verification,
-- trip type, payment proof, and e-signature captured at booking time.

create type public.trip_type as enum ('local', 'international');
create type public.signature_method as enum ('typed', 'drawn');

-- Guest submissions have no authenticated profile.
alter table public.bookings
  alter column customer_id drop not null;

comment on column public.bookings.customer_id is
  'Null for guest submissions from the public rental form.';

alter table public.bookings
  add column full_name text,
  add column address text,
  add column contact_number_1 text,
  add column contact_number_2 text,
  add column email text,
  add column trip_type trip_type not null default 'local',
  add column id_document_1_path text,
  add column id_document_2_path text,
  add column proof_of_billing_path text,
  add column selfie_with_id_path text,
  add column proof_of_payment_path text,
  add column terms_accepted boolean not null default false,
  add column signature_method signature_method,
  add column signature_text text,
  add column signature_path text;

-- Which accessories (add-ons) are offered alongside a given camera.
create table public.equipment_addons (
  equipment_id uuid not null references public.equipment (id) on delete cascade,
  addon_id uuid not null references public.equipment (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (equipment_id, addon_id),
  constraint equipment_addons_no_self_reference check (equipment_id <> addon_id)
);

create index equipment_addons_addon_id_idx on public.equipment_addons (addon_id);

-- Singleton row holding the payment QR code shown on the rental form.
create table public.payment_settings (
  id smallint primary key default 1 check (id = 1),
  qr_code_url text,
  updated_at timestamptz not null default now()
);

insert into public.payment_settings (id) values (1) on conflict do nothing;

create trigger set_payment_settings_updated_at
  before update on public.payment_settings
  for each row execute function public.set_updated_at();

-- Row Level Security -------------------------------------------------------

alter table public.equipment_addons enable row level security;
alter table public.payment_settings enable row level security;

create policy "equipment_addons_select_all"
  on public.equipment_addons for select
  using (true);

create policy "equipment_addons_admin_write"
  on public.equipment_addons for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "payment_settings_select_all"
  on public.payment_settings for select
  using (true);

create policy "payment_settings_admin_write"
  on public.payment_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- Guest (unauthenticated) submissions from the public rental form.
-- These are additional permissive policies alongside the existing
-- "own or admin" ones, scoped strictly to rows with no customer_id.
create policy "bookings_insert_guest"
  on public.bookings for insert
  with check (customer_id is null);

-- No SELECT policy is granted for guest rows (customer_id is null) — only
-- admins can read them back — so this check runs security definer to look
-- past that RLS gap without exposing bookings to a broad anon select policy.
create or replace function public.booking_is_guest(target_booking_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.bookings b
    where b.id = target_booking_id and b.customer_id is null
  );
$$;

create policy "booking_items_insert_guest"
  on public.booking_items for insert
  with check (public.booking_is_guest(booking_id));

-- Storage buckets ------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'booking-documents',
  'booking-documents',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-qr',
  'payment-qr',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- booking-documents: guest checkout has no session, so uploads must be
-- allowed without auth; only admins can read the files back.
create policy "booking_documents_insert_public"
  on storage.objects for insert
  with check (bucket_id = 'booking-documents');

create policy "booking_documents_admin_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'booking-documents' and public.is_admin());

-- payment-qr: publicly viewable on the rental form, admin-managed.
create policy "payment_qr_public_select"
  on storage.objects for select
  using (bucket_id = 'payment-qr');

create policy "payment_qr_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'payment-qr' and public.is_admin());

create policy "payment_qr_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'payment-qr' and public.is_admin());

create policy "payment_qr_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'payment-qr' and public.is_admin());
