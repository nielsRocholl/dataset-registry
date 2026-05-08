grant update on public.dataset_stars to authenticated;

drop policy if exists "dataset_stars_update_own" on public.dataset_stars;
create policy "dataset_stars_update_own"
on public.dataset_stars
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
