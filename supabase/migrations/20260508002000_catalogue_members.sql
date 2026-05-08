create table if not exists public.catalogue_members (
  email text primary key,
  display_name text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.catalogue_members (email, display_name, role, created_by, created_at, updated_at)
select lower(email), display_name, role, user_id, created_at, updated_at
from public.profiles
on conflict (email) do update
set display_name = excluded.display_name,
    role = excluded.role,
    updated_at = now();

drop trigger if exists catalogue_members_set_updated_at on public.catalogue_members;
create trigger catalogue_members_set_updated_at
before update on public.catalogue_members
for each row execute function public.set_updated_at();

alter table public.catalogue_members enable row level security;

revoke all on public.catalogue_members from anon, authenticated;
