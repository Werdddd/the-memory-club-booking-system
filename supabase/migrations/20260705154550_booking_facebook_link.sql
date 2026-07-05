-- Facebook profile/link, collected on the rental form as an extra
-- verification signal alongside the government IDs and proof of billing.

alter table public.bookings
  add column facebook_link text;
