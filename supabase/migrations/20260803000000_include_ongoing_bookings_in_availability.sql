-- Ongoing bookings (equipment already picked up, mid-rental) were missing
-- from get_confirmed_equipment_bookings, which only checked for 'confirmed'
-- and 'completed'. That let an ongoing rental's dates fall through: the
-- public/rental calendars wouldn't show it as booked, and the rental form's
-- date picker wouldn't block those dates from being booked again.

create or replace function public.get_confirmed_equipment_bookings()
returns table (equipment_id uuid, start_date date, end_date date, status booking_status)
language sql
security definer set search_path = public
stable
as $$
  select bi.equipment_id, b.start_date, b.end_date, b.status
  from public.bookings b
  join public.booking_items bi on bi.booking_id = b.id
  where b.status in ('confirmed', 'ongoing', 'completed');
$$;
