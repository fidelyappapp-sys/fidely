-- Append-only ledger of "Publier" clicks on the hub editor (Présence tier:
-- capped at 3/calendar month, Europe/Paris; Pro: never checked). Chosen over
-- lib/rateLimit.ts (a sliding-window anti-abuse throttle in seconds/minutes,
-- not a fit for a calendar-month business quota) and over a mutable counter
-- column (an event ledger matches this codebase's existing preference for
-- insert-only tables like rate_limit_events, gives a free audit trail, and
-- needs no cron to reset — the month boundary is a derived query).
create table if not exists merchant_hub_modifications (
  id bigint generated always as identity primary key,
  merchant_id uuid not null references merchants(id) on delete cascade,
  year_month text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchant_hub_modifications_merchant_month
  on merchant_hub_modifications(merchant_id, year_month);

alter table merchant_hub_modifications enable row level security;

drop policy if exists "merchant_hub_modifications_select" on merchant_hub_modifications;
create policy "merchant_hub_modifications_select" on merchant_hub_modifications
  for select using (is_merchant_staff(merchant_id));
-- No insert policy: rows are only ever written via try_record_hub_modification
-- below (SECURITY DEFINER, called from the server action with the
-- service-role client) so the quota can't be bypassed by writing directly.

-- Atomically checks-and-records one "Publier" click for the current
-- calendar month (Europe/Paris). Returns false without recording anything
-- if the merchant has already hit monthly_limit this month.
create or replace function try_record_hub_modification(target_merchant_id uuid, monthly_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ym text := to_char(now() at time zone 'Europe/Paris', 'YYYY-MM');
  current_count int;
begin
  select count(*) into current_count from merchant_hub_modifications
    where merchant_id = target_merchant_id and year_month = current_ym;

  if current_count >= monthly_limit then
    return false;
  end if;

  insert into merchant_hub_modifications (merchant_id, year_month)
    values (target_merchant_id, current_ym);
  return true;
end;
$$;
