-- Módulo de equipe: provisionamento seguro e gestão de perfis.
create or replace function public.is_cms_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles add column if not exists email text;

-- Cria automaticamente um perfil editor para novos usuários do Auth.
create or replace function public.handle_new_cms_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email)
  values (new.id, 'editor', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_cms_profile on auth.users;
create trigger on_auth_user_created_cms_profile
after insert on auth.users
for each row execute procedure public.handle_new_cms_user();

-- Garante perfil para usuários que já existiam antes desta migração.
insert into public.profiles (id, role, email)
select id, 'editor', email from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "CMS admins can read all profiles" on public.profiles;
create policy "CMS admins can read all profiles"
on public.profiles for select to authenticated
using (public.is_cms_admin() or id = auth.uid());

drop policy if exists "CMS admins can update profiles" on public.profiles;
create policy "CMS admins can update profiles"
on public.profiles for update to authenticated
using (public.is_cms_admin())
with check (public.is_cms_admin() and role in ('admin','editor'));

drop policy if exists "CMS admins can insert profiles" on public.profiles;
create policy "CMS admins can insert profiles"
on public.profiles for insert to authenticated
with check (public.is_cms_admin() and role in ('admin','editor'));

update public.profiles p set email = u.email from auth.users u where p.id = u.id and p.email is distinct from u.email;
