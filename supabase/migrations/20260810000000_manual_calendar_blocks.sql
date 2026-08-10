-- Manually-managed booking calendar: admins mark which equipment is booked
-- on which dates directly, instead of the calendar being auto-derived from
-- `bookings`. Fully decoupled from `bookings`/`booking_items` — no triggers
-- or sync in either direction, so a bug in one can never corrupt the other.

create table public.calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  block_date date not null,
  equipment_id uuid not null references public.equipment (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  unique (block_date, equipment_id)
);

create index calendar_blocks_date_idx on public.calendar_blocks (block_date);
create index calendar_blocks_equipment_id_idx on public.calendar_blocks (equipment_id);

alter table public.calendar_blocks enable row level security;

-- No PII on this table (just a date + equipment id), so unlike `bookings` a
-- plain public read policy is fine — this is what powers the public
-- availability calendar and the rental form's date picker.
create policy "calendar_blocks_select_all"
  on public.calendar_blocks for select
  using (true);

create policy "calendar_blocks_admin_write"
  on public.calendar_blocks for all
  using (public.is_admin())
  with check (public.is_admin());
