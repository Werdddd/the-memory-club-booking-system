-- Stronger ID verification: ID numbers, front + back photos for each ID
-- (existing id_document_N_path columns hold the front), and a photo of a
-- handwritten note (full name + 3 signatures beside the 2 IDs + "The Memory Club").

alter table public.bookings
  add column id_number_1 text,
  add column id_number_2 text,
  add column id_document_1_back_path text,
  add column id_document_2_back_path text,
  add column handwritten_note_path text,
  add column travel_document_paths text[] not null default '{}';
