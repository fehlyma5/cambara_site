-- Opção para usar a arte completa da agência sem sobrepor títulos do site.
alter table public.banners
  add column if not exists display_text boolean not null default true;
