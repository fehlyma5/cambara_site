-- Adiciona imagem específica para banners em dispositivos móveis.
alter table public.banners
add column if not exists mobile_image_url text;
