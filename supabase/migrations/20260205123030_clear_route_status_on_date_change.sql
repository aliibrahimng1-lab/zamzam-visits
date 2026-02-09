create or replace function public.clear_route_status_on_date_change()
returns trigger as $$
begin
  if (new.visit_date is distinct from old.visit_date)
     or (new.next_visit_date is distinct from old.next_visit_date) then
    new.route_status := null;
    new.route_status_until := null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists visits_clear_route_status_on_date_change on public.visits;

create trigger visits_clear_route_status_on_date_change
before update on public.visits
for each row
execute function public.clear_route_status_on_date_change();
