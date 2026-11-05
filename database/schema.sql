-- Cambará CMS: execute no SQL Editor do projeto Supabase.
-- 1) Cria tabela de banners.
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  eyebrow text,
  button_text text,
  button_url text,
  image_url text not null,
  position integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Perfis e permissões: admin e editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);

alter table public.banners enable row level security;
alter table public.profiles enable row level security;

-- Usuário autenticado pode consultar o próprio perfil.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

-- Função de verificação de equipe para políticas de conteúdo.
create or replace function public.is_cms_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','editor')
  );
$$;

-- Visitantes veem apenas banners ativos.
drop policy if exists "Public can read active banners" on public.banners;
create policy "Public can read active banners"
on public.banners for select
using (active = true);

-- Equipe autenticada gerencia banners.
drop policy if exists "CMS users manage banners" on public.banners;
create policy "CMS users manage banners"
on public.banners for all to authenticated
using (public.is_cms_user())
with check (public.is_cms_user());

-- Bucket público para as imagens exibidas no site.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view site images" on storage.objects;
create policy "Public can view site images"
on storage.objects for select
using (bucket_id = 'site-images');

drop policy if exists "CMS users upload site images" on storage.objects;
create policy "CMS users upload site images"
on storage.objects for insert to authenticated
with check (bucket_id = 'site-images' and public.is_cms_user());

drop policy if exists "CMS users update site images" on storage.objects;
create policy "CMS users update site images"
on storage.objects for update to authenticated
using (bucket_id = 'site-images' and public.is_cms_user())
with check (bucket_id = 'site-images' and public.is_cms_user());

drop policy if exists "CMS users delete site images" on storage.objects;
create policy "CMS users delete site images"
on storage.objects for delete to authenticated
using (bucket_id = 'site-images' and public.is_cms_user());

-- Após criar o primeiro usuário em Authentication > Users, execute:
-- insert into public.profiles (id, role)
-- values ('UUID_DO_USUARIO_AUTH', 'admin');
-- Cadastre os demais usuários em Authentication e insira role='editor'.