-- Galeria institucional gerenciada pelo CMS.
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  image_url text not null,
  position integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gallery_photos enable row level security;

drop policy if exists "Public can read active gallery photos" on public.gallery_photos;
create policy "Public can read active gallery photos"
on public.gallery_photos for select using (active = true);

drop policy if exists "CMS users manage gallery photos" on public.gallery_photos;
create policy "CMS users manage gallery photos"
on public.gallery_photos for all to authenticated
using (public.is_cms_user())
with check (public.is_cms_user());

create index if not exists gallery_photos_active_position_idx
on public.gallery_photos(active, position);
