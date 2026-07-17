-- Automatic reward redemption: once a card's points reach the program's
-- reward_threshold, award_scan_points() resets it to 0 and logs a claim,
-- in the same transaction/row-lock as the scan itself so a burst of
-- concurrent scans can't award the same reward twice.
--
-- Written to be safely re-runnable, same convention as prior migrations.

create table if not exists reward_claims (
  id uuid primary key default gen_random_uuid(),
  loyalty_card_id uuid not null references loyalty_cards(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,
  points_at_claim int not null,
  reward_description text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_reward_claims_merchant on reward_claims(merchant_id);
create index if not exists idx_reward_claims_card on reward_claims(loyalty_card_id);

alter table reward_claims enable row level security;

-- Staff can read their own merchant's redemption history. Writes only
-- happen inside award_scan_points (security definer, bypasses RLS) —
-- no client insert policy.
drop policy if exists "reward_claims_select" on reward_claims;
create policy "reward_claims_select" on reward_claims
  for select using (is_merchant_staff(merchant_id));

-- ============================================================
-- award_scan_points: adds automatic reward reset. Return type is changing
-- again (reward_claimed, reward_description), so the function has to be
-- dropped first — Postgres refuses CREATE OR REPLACE across a type change.
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
  reward_threshold int,
  reward_description text,
  reward_claimed boolean
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
  v_reward_description text;
  v_new_balance int;
  v_scan_id uuid;
  v_reward_claimed boolean := false;
begin
  select lp.points_per_scan, lc.merchant_id, m.stripe_customer_id,
         lc.pass_serial_number, lc.google_object_id, m.business_name,
         lp.reward_threshold, lp.reward_description
    into v_points_per_scan, v_merchant_id, v_stripe_customer_id,
         v_pass_serial_number, v_google_object_id, v_business_name,
         v_reward_threshold, v_reward_description
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

  if v_reward_threshold > 0 and v_new_balance >= v_reward_threshold then
    v_reward_claimed := true;

    update loyalty_cards
      set points = 0,
          apple_pass_updated_at = now()
      where id = p_loyalty_card_id
      returning points into v_new_balance;

    insert into reward_claims (loyalty_card_id, merchant_id, points_at_claim, reward_description)
    values (p_loyalty_card_id, v_merchant_id, v_reward_threshold, v_reward_description);
  end if;

  return query select
    v_scan_id, v_points_per_scan, v_new_balance, v_merchant_id,
    v_stripe_customer_id, v_pass_serial_number, v_google_object_id,
    v_business_name, v_reward_threshold, v_reward_description, v_reward_claimed;
end;
$$;

revoke execute on function award_scan_points(uuid, uuid) from public, anon, authenticated;
