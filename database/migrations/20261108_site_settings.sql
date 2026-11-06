-- Configurações editáveis do site Cambará.
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_phone text,
  whatsapp_message text,
  youtube_url text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  about_title text,
  about_text text,
  about_extra text,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select using (true);

drop policy if exists "CMS users manage site settings" on public.site_settings;
create policy "CMS users manage site settings"
on public.site_settings for all to authenticated
using (public.is_cms_user())
with check (public.is_cms_user());

insert into public.site_settings (id, whatsapp_phone, whatsapp_message, youtube_url, instagram_url, facebook_url, tiktok_url, about_title, about_text, about_extra)
values (1, '5595999999999', 'Olá! Vim pelo site da Cambará e quero fazer um orçamento.', 'https://www.youtube.com/', 'https://www.instagram.com/', 'https://www.facebook.com/', 'https://www.tiktok.com/', 'Experiência que ajuda a construir seus projetos.', 'A Cambará Madeireira e Materiais de Construção atua há mais de 40 anos em Boa Vista, com madeiras de excelente qualidade para atender qualquer necessidade da obra.', 'Nosso compromisso é oferecer produtos confiáveis, agilidade na entrega e um atendimento próximo para ajudar você a encontrar o que realmente precisa.')
on conflict (id) do nothing;
