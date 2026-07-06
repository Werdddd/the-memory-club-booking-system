-- Signed rental agreement PDF, generated at submission time from the
-- Camera Rental Agreement text and the renter's captured signature.

alter table public.bookings
  add column agreement_pdf_path text;
