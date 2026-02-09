-- Zamzam Visits - Supabase migration: initial schema and RLS
-- Date: February 4, 2026

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('admin', 'salesperson')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_number text not null check (phone_number ~ '^\+968[0-9]{8}$'),
  cr_number text,
  area text not null,
  visit_date date not null,
  next_visit_date date,
  have_zamzam boolean not null,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  salesperson_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (next_visit_date is null or next_visit_date >= visit_date)
);

create index if not exists visits_salesperson_id_idx on public.visits (salesperson_id);
create index if not exists visits_visit_date_idx on public.visits (visit_date);
create index if not exists visits_area_idx on public.visits (area);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_visits_updated_at on public.visits;
create trigger set_visits_updated_at
before update on public.visits
for each row execute function public.set_updated_at();

-- Role helper
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.visits enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_self_or_admin"
on public.profiles
for insert
with check (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "visits_select_admin_or_owner"
on public.visits
for select
using (public.is_admin() or salesperson_id = auth.uid());

create policy "visits_insert_admin_or_owner"
on public.visits
for insert
with check (public.is_admin() or salesperson_id = auth.uid());

create policy "visits_update_admin_only"
on public.visits
for update
using (public.is_admin())
with check (public.is_admin());

create policy "visits_delete_admin_only"
on public.visits
for delete
using (public.is_admin());

-- Optional: auto-create profile on signup, defaulting role to salesperson
-- create or replace function public.handle_new_user()
-- returns trigger language plpgsql as $$
-- begin
--   insert into public.profiles (id, name, role)
--   values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), 'salesperson');
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
-- after insert on auth.users
-- for each row execute function public.handle_new_user();

-- Optional: enable realtime on visits
-- alter publication supabase_realtime add table public.visits;
