alter table public.daily_selections
  add column if not exists unlock_time text;
