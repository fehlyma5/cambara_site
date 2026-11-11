-- Permite armazenar fotos institucionais e depoimentos em vídeo na galeria.
alter table public.gallery_photos add column if not exists media_type text not null default 'image';
alter table public.gallery_photos drop constraint if exists gallery_photos_media_type_check;
alter table public.gallery_photos add constraint gallery_photos_media_type_check check (media_type in ('image','video'));
