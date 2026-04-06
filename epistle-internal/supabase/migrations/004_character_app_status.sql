-- Add mobile app witness availability status
alter table public.characters
  add column if not exists app_status text not null default 'coming_soon';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'characters_app_status_check'
  ) then
    alter table public.characters
      add constraint characters_app_status_check
      check (app_status in ('available', 'coming_soon'));
  end if;
end $$;

update public.characters
set app_status = case
  when key in ('paul', 'david', 'john') then 'available'
  else 'coming_soon'
end
where app_status is distinct from case
  when key in ('paul', 'david', 'john') then 'available'
  else 'coming_soon'
end;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'characters'
      and policyname = 'Characters are readable by all'
  ) then
    create policy "Characters are readable by all"
      on public.characters
      for select
      using (true);
  end if;
end $$;
