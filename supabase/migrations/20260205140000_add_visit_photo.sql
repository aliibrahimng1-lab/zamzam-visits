alter table public.visits
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('visit-photos', 'visit-photos', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'visit_photos_select'
  ) then
    execute 'create policy visit_photos_select on storage.objects for select using (bucket_id = ''visit-photos'')';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'visit_photos_insert'
  ) then
    execute 'create policy visit_photos_insert on storage.objects for insert to authenticated with check (bucket_id = ''visit-photos'')';
  end if;
end $$;
