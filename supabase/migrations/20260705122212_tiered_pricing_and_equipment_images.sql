-- Tiered daily pricing: a 1-3 day rate (existing daily_rate) and a
-- cheaper 4+ day rate for longer rentals.
alter table public.equipment
  add column extended_daily_rate numeric(10, 2);

update public.equipment
set extended_daily_rate = daily_rate
where extended_daily_rate is null;

alter table public.equipment
  alter column extended_daily_rate set not null,
  add constraint equipment_extended_daily_rate_check check (extended_daily_rate >= 0);

comment on column public.equipment.daily_rate is 'Rate per day for a 1-3 day rental.';
comment on column public.equipment.extended_daily_rate is 'Rate per day for a 4+ day rental.';

-- Storage bucket for equipment photos.
insert into storage.buckets (id, name, public)
values ('equipment-images', 'equipment-images', true)
on conflict (id) do nothing;

create policy "equipment_images_public_select"
  on storage.objects for select
  using (bucket_id = 'equipment-images');

create policy "equipment_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'equipment-images' and public.is_admin());

create policy "equipment_images_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'equipment-images' and public.is_admin());

create policy "equipment_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'equipment-images' and public.is_admin());
