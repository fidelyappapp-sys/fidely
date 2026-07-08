-- Lightweight sliding-window rate limiting for public, unauthenticated
-- endpoints (customer join, staff scan). Service-role only.

create table rate_limit_events (
  id bigint generated always as identity primary key,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index idx_rate_limit_events_bucket_time on rate_limit_events(bucket_key, created_at);

alter table rate_limit_events enable row level security;
-- No policies: service-role only.

-- Periodic cleanup helper (called opportunistically from the app; also safe
-- to run on a schedule) so this table doesn't grow unbounded.
create or replace function prune_rate_limit_events()
returns void
language sql
security definer
set search_path = public
as $$
  delete from rate_limit_events where created_at < now() - interval '1 day';
$$;

revoke execute on function prune_rate_limit_events() from public, anon, authenticated;
