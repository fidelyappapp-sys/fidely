-- Notifications: manual broadcasts, birthday messages, post-scan Google
-- review requests. Adds the merchant-facing config (Google Maps link,
-- birthday toggle) and the customer-facing data (birth date) they depend on.
--
-- Written to be safely re-runnable: every ADD COLUMN / CREATE TABLE /
-- CREATE INDEX uses IF NOT EXISTS, and policies are dropped before being
-- recreated, so re-applying this file after a partial run is a no-op for
-- whatever already landed.

alter table customers add column if not exists birth_date date;

alter table merchants add column if not exists google_maps_link text;
alter table merchants add column if not exists birthday_notifications_enabled boolean not null default false;

-- Holds the text of the most recent wallet notification sent for this card.
-- Apple Wallet's changeMessage mechanism shows this value verbatim as the
-- lock-screen notification once the pass is re-fetched, so it must always
-- contain the exact sentence we want the customer to see next.
alter table loyalty_cards add column if not exists last_push_message text;
alter table loyalty_cards add column if not exists last_birthday_year int;

-- History of merchant-initiated broadcasts (manual + birthday), shown in
-- the dashboard. Individual per-customer review-request sends are tracked
-- separately in review_requests since they're system-triggered, not
-- merchant-initiated.
create table if not exists push_notifications (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  type text not null check (type in ('manual', 'birthday')),
  title text,
  body text not null,
  recipient_count int not null default 0,
  created_at timestamptz not null default now()
);

-- Queue of delayed "leave us a Google review" prompts sent ~10 minutes
-- after a scan. Needs its own table (rather than a synchronous send) since
-- the delay is longer than a single request lifecycle; a cron polls for
-- rows that have come due.
create table if not exists review_requests (
  id uuid primary key default gen_random_uuid(),
  loyalty_card_id uuid not null references loyalty_cards(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'skipped', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_notifications_merchant on push_notifications(merchant_id);
create index if not exists idx_review_requests_due on review_requests(due_at) where status = 'pending';

alter table push_notifications enable row level security;
alter table review_requests enable row level security;

-- push_notifications: staff can read their own merchant's history. Writes
-- happen server-side via the service-role client (sends fan out wallet
-- pushes to every card, which requires service-role access anyway).
drop policy if exists "push_notifications_select" on push_notifications;
create policy "push_notifications_select" on push_notifications
  for select using (is_merchant_staff(merchant_id));

-- review_requests: internal queue, service-role only (no client policies).

-- ============================================================
-- award_scan_points: also return what the scan route needs to compose
-- the rich "X points chez Y, plus que Z" notification text.
--
-- Its return type is changing (two new output columns), and Postgres
-- refuses to CREATE OR REPLACE a function when its return type differs
-- from the existing one — it has to be dropped first.
-- ============================================================

drop function if exists award_scan_points(uuid, uuid);

create or replace function award_scan_points(p_loyalty_card_id uuid, p_staff_user_id uuid)
returns table (
  scan_event_id uuid,
  points_awarded int,
  points_balance_after int,
  merchant_id uuid,
  stripe_customer_id text,
  pass_serial_number text,
  google_object_id text,
  business_name text,
  reward_threshold int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points_per_scan int;
  v_merchant_id uuid;
  v_stripe_customer_id text;
  v_pass_serial_number text;
  v_google_object_id text;
  v_business_name text;
  v_reward_threshold int;
  v_new_balance int;
  v_scan_id uuid;
begin
  select lp.points_per_scan, lc.merchant_id, m.stripe_customer_id,
         lc.pass_serial_number, lc.google_object_id, m.business_name,
         lp.reward_threshold
    into v_points_per_scan, v_merchant_id, v_stripe_customer_id,
         v_pass_serial_number, v_google_object_id, v_business_name,
         v_reward_threshold
  from loyalty_cards lc
  join loyalty_programs lp on lp.id = lc.loyalty_program_id
  join merchants m on m.id = lc.merchant_id
  where lc.id = p_loyalty_card_id
  for update of lc;

  if not found then
    raise exception 'loyalty_card_not_found';
  end if;

  update loyalty_cards
    set points = points + v_points_per_scan,
        apple_pass_updated_at = now()
    where id = p_loyalty_card_id
    returning points into v_new_balance;

  insert into scan_events (
    loyalty_card_id, merchant_id, staff_user_id, points_awarded, points_balance_after
  ) values (
    p_loyalty_card_id, v_merchant_id, p_staff_user_id, v_points_per_scan, v_new_balance
  )
  returning id into v_scan_id;

  return query select
    v_scan_id, v_points_per_scan, v_new_balance, v_merchant_id,
    v_stripe_customer_id, v_pass_serial_number, v_google_object_id,
    v_business_name, v_reward_threshold;
end;
$$;

revoke execute on function award_scan_points(uuid, uuid) from public, anon, authenticated;

-- ============================================================
-- Birthday notifications: finds cards whose customer's birthday is today,
-- whose merchant has opted in, and that haven't already been notified this
-- calendar year. Expressed as a function (rather than PostgREST date
-- filters) since matching month/day while ignoring year needs to_char.
-- ============================================================

create or replace function find_birthday_cards()
returns table (
  loyalty_card_id uuid,
  merchant_id uuid,
  pass_serial_number text,
  google_object_id text,
  business_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select lc.id, lc.merchant_id, lc.pass_serial_number, lc.google_object_id, m.business_name
  from loyalty_cards lc
  join customers c on c.id = lc.customer_id
  join merchants m on m.id = lc.merchant_id
  where m.birthday_notifications_enabled = true
    and c.birth_date is not null
    and to_char(c.birth_date, 'MM-DD') = to_char(current_date, 'MM-DD')
    and (lc.last_birthday_year is null or lc.last_birthday_year < extract(year from current_date)::int);
$$;

revoke execute on function find_birthday_cards() from public, anon, authenticated;
