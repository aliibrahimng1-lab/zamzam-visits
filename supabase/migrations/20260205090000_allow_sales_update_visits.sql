-- Allow salespeople to update their own visits (complete/move actions)
drop policy if exists visits_update_admin_only on public.visits;

create policy "visits_update_admin_or_owner"
on public.visits
for update
using (public.is_admin() or salesperson_id = auth.uid())
with check (public.is_admin() or salesperson_id = auth.uid());
