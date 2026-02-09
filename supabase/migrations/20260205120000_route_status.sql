alter table public.visits
  add column if not exists route_status text,
  add column if not exists route_status_until timestamptz;

create index if not exists visits_route_status_until_idx
  on public.visits (route_status_until);
