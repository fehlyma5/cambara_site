-- Execute UMA vez no Supabase SQL Editor.
-- Jeitin Cambará tem tabela independente. Não altera nem apaga a galeria antiga.
CREATE TABLE IF NOT EXISTS public.jeitin_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 120),
  caption text,
  video_url text NOT NULL,
  position integer NOT NULL DEFAULT 1 CHECK (position >= 1),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jeitin_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active jeitin videos" ON public.jeitin_videos;
CREATE POLICY "Public can read active jeitin videos"
  ON public.jeitin_videos FOR SELECT TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "CMS users manage jeitin videos" ON public.jeitin_videos;
CREATE POLICY "CMS users manage jeitin videos"
  ON public.jeitin_videos FOR ALL TO authenticated
  USING ((SELECT public.is_cms_user()))
  WITH CHECK ((SELECT public.is_cms_user()));

GRANT SELECT ON public.jeitin_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jeitin_videos TO authenticated;
-- Bucket público site-images já existente: vídeos MP4 com máximo de 25 MB.
