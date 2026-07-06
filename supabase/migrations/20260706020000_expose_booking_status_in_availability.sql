-- Expose booking status alongside each date range so the public calendar can
-- visually distinguish upcoming confirmed bookings from completed ones
-- (social proof: "we have lots of completed rentals").

-- Return type is changing (new `status` column), so the old signature must
-- be dropped first; `create or replace` cannot alter a function's return type.
drop function if exists public.get_confirmed_equipment_bookings();

create function public.get_confirmed_equipment_bookings()
returns table (equipment_id uuid, start_date date, end_date date, status booking_status)
language sql
security definer set search_path = public
stable
as $$
  select bi.equipment_id, b.start_date, b.end_date, b.status
  from public.bookings b
  join public.booking_items bi on bi.booking_id = b.id
  where b.status in ('confirmed', 'completed');
$$;

grant execute on function public.get_confirmed_equipment_bookings() to anon, authenticated;
