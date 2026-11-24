-- Let admins hide gallery items from the public page without deleting them.

alter table public.gallery_items
  add column is_hidden boolean not null default false;

-- Visitors only see visible items; admins see everything.
drop policy "gallery_items_select_all" on public.gallery_items;

create policy "gallery_items_select_visible"
  on public.gallery_items for select
  using (not is_hidden or public.is_admin());
