drop policy if exists "catalogue_members_no_client_access" on public.catalogue_members;
create policy "catalogue_members_no_client_access"
on public.catalogue_members
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
