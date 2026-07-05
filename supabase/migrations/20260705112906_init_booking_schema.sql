-- The Memory Club - Camera Rental booking system
-- Initial schema: equipment, customers, bookings, booking_items

create extension if not exists "pgcrypto";

-- Roles: 'admin' manages the shop, 'customer' books equipment.
create type user_role as enum ('admin', 'customer');

create type booking_status as enum ('pending', 'confirmed', 'ongoing', 'completed', 'cancelled');

create type equipment_category as enum ('camera', 'lens', 'lighting', 'audio', 'accessory', 'other');

create type equipment_condition as enum ('new', 'excellent', 'good', 'fair', 'needs_repair');

-- Profile row is created per authenticated user (extends auth.users).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category equipment_category not null default 'camera',
  brand text,
  model text,
  serial_number text,
  description text,
  daily_rate numeric(10, 2) not null check (daily_rate >= 0),
  deposit_amount numeric(10, 2) not null default 0 check (deposit_amount >= 0),
  condition equipment_condition not null default 'good',
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  status booking_status not null default 'pending',
  start_date date not null,
  end_date date not null,
  pickup_time timestamptz,
  return_time timestamptz,
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  deposit_paid boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_date_range_check check (end_date >= start_date)
);

-- Line items: which equipment is rented on a given booking.
create table public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  rate_at_booking numeric(10, 2) not null check (rate_at_booking >= 0),
  created_at timestamptz not null default now(),
  unique (booking_id, equipment_id)
);

create index bookings_customer_id_idx on public.bookings (customer_id);
create index bookings_date_range_idx on public.bookings (start_date, end_date);
create index booking_items_booking_id_idx on public.booking_items (booking_id);
create index booking_items_equipment_id_idx on public.booking_items (equipment_id);

-- Keep updated_at fresh on row changes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_equipment_updated_at
  before update on public.equipment
  for each row execute function public.set_updated_at();

create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security -------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.equipment enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: users see/update their own profile; admins see/update all.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- equipment: catalog is publicly readable; only admins can modify.
create policy "equipment_select_all"
  on public.equipment for select
  using (true);

create policy "equipment_admin_write"
  on public.equipment for all
  using (public.is_admin())
  with check (public.is_admin());

-- bookings: customers manage their own bookings; admins manage all.
create policy "bookings_select_own_or_admin"
  on public.bookings for select
  using (customer_id = auth.uid() or public.is_admin());

create policy "bookings_insert_own_or_admin"
  on public.bookings for insert
  with check (customer_id = auth.uid() or public.is_admin());

create policy "bookings_update_own_or_admin"
  on public.bookings for update
  using (customer_id = auth.uid() or public.is_admin());

create policy "bookings_delete_admin_only"
  on public.bookings for delete
  using (public.is_admin());

-- booking_items: follow access of the parent booking.
create policy "booking_items_select_via_booking"
  on public.booking_items for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or public.is_admin())
    )
  );

create policy "booking_items_write_via_booking"
  on public.booking_items for all
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or public.is_admin())
    )
  );
