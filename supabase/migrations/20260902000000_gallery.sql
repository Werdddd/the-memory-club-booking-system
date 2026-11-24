-- Public gallery of photos and videos shot by previous renters, curated by
-- admins to show off what each camera can do.

create type public.gallery_media_type as enum ('photo', 'video');

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  media_type gallery_media_type not null,
  storage_path text not null,
  url text not null,
  caption text,
  renter_credit text,
  equipment_id uuid references public.equipment (id) on delete set null,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index gallery_items_created_at_idx on public.gallery_items (created_at desc);
create index gallery_items_equipment_id_idx on public.gallery_items (equipment_id);

alter table public.gallery_items enable row level security;

create policy "gallery_items_select_all"
  on public.gallery_items for select
  using (true);

create policy "gallery_items_admin_write"
  on public.gallery_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- Public bucket. Admins upload straight from the browser so large videos
-- never pass through a Server Action body.
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "gallery_public_select"
  on storage.objects for select
  using (bucket_id = 'gallery');

create policy "gallery_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'gallery' and public.is_admin());

create policy "gallery_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'gallery' and public.is_admin());

create policy "gallery_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'gallery' and public.is_admin());
