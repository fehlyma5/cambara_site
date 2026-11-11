-- Estrutura de métricas de campanhas Cambará.
-- Esta migração foi executada anteriormente no Supabase; mantida no repositório para histórico.
create table if not exists public.campaign_events (
  id bigint generated always as identity primary key,
  banner_id uuid references public.banners(id) on delete set null,
  campaign_label text,
  event_type text not null check (event_type in ('impression','banner_click','whatsapp_click')),
  page_path text,
  created_at timestamptz not null default now()
);
create index if not exists campaign_events_created_at_idx on public.campaign_events(created_at desc);
create index if not exists campaign_events_banner_type_idx on public.campaign_events(banner_id,event_type,created_at desc);
alter table public.campaign_events enable row level security;
drop policy if exists "Public can record campaign events" on public.campaign_events;
create policy "Public can record campaign events" on public.campaign_events
for insert to anon, authenticated
with check (event_type in ('impression','banner_click','whatsapp_click')
and (page_path is null or length(page_path)<=300)
and (campaign_label is null or length(campaign_label)<=120));
drop policy if exists "CMS admins can read campaign events" on public.campaign_events;
create policy "CMS admins can read campaign events" on public.campaign_events
for select to authenticated using (public.is_cms_admin());
