create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  event_name text not null check (event_name in ('app_open', 'onboarding_completed')),
  event_date date not null,
  platform text not null default 'unknown',
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create index if not exists analytics_events_event_date_idx
  on public.analytics_events (event_date, event_name);

create index if not exists analytics_events_device_idx
  on public.analytics_events (device_id, event_name, event_date);

alter table public.analytics_events enable row level security;

create policy "anon can insert analytics events"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

create or replace view public.analytics_daily_summary as
select
  event_date,
  count(distinct case when event_name = 'app_open' then device_id end) as dau,
  count(distinct case when event_name = 'onboarding_completed' then device_id end) as onboarding_completions
from public.analytics_events
group by event_date
order by event_date desc;

create or replace view public.analytics_day1_retention as
with onboarding_cohorts as (
  select
    device_id,
    min(event_date) as cohort_date
  from public.analytics_events
  where event_name = 'onboarding_completed'
  group by device_id
),
cohort_rollup as (
  select
    c.cohort_date,
    count(*) as onboarding_completions,
    count(*) filter (
      where exists (
        select 1
        from public.analytics_events e
        where e.device_id = c.device_id
          and e.event_name = 'app_open'
          and e.event_date = c.cohort_date + 1
      )
    ) as next_day_returners
  from onboarding_cohorts c
  group by c.cohort_date
)
select
  cohort_date,
  onboarding_completions,
  next_day_returners,
  case
    when onboarding_completions = 0 then 0
    else round((next_day_returners::numeric / onboarding_completions::numeric) * 100, 2)
  end as next_day_return_rate
from cohort_rollup
order by cohort_date desc;
