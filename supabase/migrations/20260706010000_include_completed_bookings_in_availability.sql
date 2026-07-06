-- Completed bookings are real, already-happened reservations (not just
-- currently-confirmed ones) and should still show up as booking history on
-- the public availability calendar, alongside upcoming confirmed bookings.

create or replace function public.get_confirmed_equipment_bookings()
returns table (equipment_id uuid, start_date date, end_date date)
language sql
security definer set search_path = public
stable
as $$
  select bi.equipment_id, b.start_date, b.end_date
  from public.bookings b
  join public.booking_items bi on bi.booking_id = b.id
  where b.status in ('confirmed', 'completed');
$$;
