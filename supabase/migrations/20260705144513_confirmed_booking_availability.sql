-- Public, non-PII visibility into confirmed booking date-ranges per
-- equipment, so anon/authenticated users can see availability without
-- being granted a broad SELECT policy on public.bookings (which holds
-- PII: full_name, address, contact numbers, email, ID document paths).

create or replace function public.get_confirmed_equipment_bookings()
returns table (equipment_id uuid, start_date date, end_date date)
language sql
security definer set search_path = public
stable
as $$
  select bi.equipment_id, b.start_date, b.end_date
  from public.bookings b
  join public.booking_items bi on bi.booking_id = b.id
  where b.status = 'confirmed';
$$;

grant execute on function public.get_confirmed_equipment_bookings() to anon, authenticated;

create index if not exists bookings_status_idx on public.bookings (status);
