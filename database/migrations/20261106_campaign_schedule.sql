-- Cambará CMS: campos para campanhas sazonais nos banners.
-- Execute uma única vez no SQL Editor do Supabase.
alter table public.banners
  add column if not exists campaign_label text,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

-- Garante que a data final não seja anterior à inicial.
alter table public.banners
  drop constraint if exists banners_valid_campaign_period;
alter table public.banners
  add constraint banners_valid_campaign_period
  check (starts_at is null or ends_at is null or ends_at > starts_at);

create index if not exists banners_active_schedule_idx
  on public.banners (active, starts_at, ends_at);
