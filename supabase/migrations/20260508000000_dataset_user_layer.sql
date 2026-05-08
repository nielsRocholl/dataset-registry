create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dataset_stars (
  user_id uuid not null references auth.users(id) on delete cascade,
  dataset_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, dataset_id)
);

create index if not exists dataset_stars_dataset_id_idx
  on public.dataset_stars (dataset_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.dataset_stars enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.dataset_stars from anon, authenticated;

grant select, insert on public.profiles to authenticated;
grant select, insert, delete on public.dataset_stars to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own_member" on public.profiles;
create policy "profiles_insert_own_member"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and role = 'member'
);

drop policy if exists "dataset_stars_select_own" on public.dataset_stars;
create policy "dataset_stars_select_own"
on public.dataset_stars
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "dataset_stars_insert_own" on public.dataset_stars;
create policy "dataset_stars_insert_own"
on public.dataset_stars
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "dataset_stars_delete_own" on public.dataset_stars;
create policy "dataset_stars_delete_own"
on public.dataset_stars
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
