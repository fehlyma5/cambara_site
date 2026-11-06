-- Cambará CMS: categorias dinâmicas, editáveis e expansíveis.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  icon text default 'fa-solid fa-layer-group',
  position integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories for select
using (active = true);

drop policy if exists "CMS users manage categories" on public.categories;
create policy "CMS users manage categories"
on public.categories for all to authenticated
using (public.is_cms_user())
with check (public.is_cms_user());

-- Insere as cinco categorias atuais apenas se ainda não existirem.
insert into public.categories (name, slug, description, icon, position, active)
values
 ('Hidráulica','hidraulica','Tubos, conexões, registros e acessórios.','fa-solid fa-faucet-drip',1,true),
 ('Elétrica','eletrica','Materiais e acessórios para instalações.','fa-solid fa-bolt',2,true),
 ('Ferragens','ferragens','Ferramentas, fixadores e itens para construção.','fa-solid fa-screwdriver-wrench',3,true),
 ('Telhados','telhados','Materiais para cobertura e proteção da obra.','fa-solid fa-house',4,true),
 ('Pisos','pisos','Opções para deixar seus ambientes completos.','fa-solid fa-border-all',5,true)
on conflict (slug) do nothing;
