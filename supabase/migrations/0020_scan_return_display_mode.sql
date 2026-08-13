-- award_scan_points already looks up display_mode internally (v_display_mode,
-- used to pick the points-per-scan vs points-per-euro formula) but never
-- returned it, so /api/scan had no way to know whether to label the Google
-- Wallet points patch "Points" or "Tampons". Same drop+recreate pattern
-- 0015_display_mode.sql used, since Postgres won't let create-or-replace
-- change a function's return type in place.
drop function if exists award_scan_points(uuid, uuid, int);

create or replace function award_scan_points(
  p_loyalty_card_id uuid,
  p_staff_user_id uuid,
  p_amount_cents int default null
)
returns table (
  scan_event_id uuid,
  points_awarded int,
  points_balance_after int,
  merchant_id uuid,
  stripe_customer_id text,
  pass_serial_number text,
  google_object_id text,
  business_name text,
  display_mode text,
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
  v_display_mode text;
  v_points_per_euro numeric;
  v_points_awarded int;
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
  select lp.points_per_scan, lp.display_mode, lp.points_per_euro, lc.merchant_id, m.stripe_customer_id,
         lc.pass_serial_number, lc.google_object_id, m.business_name,
         lp.reward_threshold, lp.reward_description
    into v_points_per_scan, v_display_mode, v_points_per_euro, v_merchant_id, v_stripe_customer_id,
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

  if v_display_mode = 'points' and p_amount_cents is not null and v_points_per_euro is not null then
    v_points_awarded := greatest(0, floor((p_amount_cents / 100.0) * v_points_per_euro))::int;
  else
    v_points_awarded := v_points_per_scan;
  end if;

  update loyalty_cards
    set points = points + v_points_awarded,
        apple_pass_updated_at = now()
    where id = p_loyalty_card_id
    returning points into v_new_balance;

  insert into scan_events (
    loyalty_card_id, merchant_id, staff_user_id, points_awarded, points_balance_after
  ) values (
    p_loyalty_card_id, v_merchant_id, p_staff_user_id, v_points_awarded, v_new_balance
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
    v_scan_id, v_points_awarded, v_new_balance, v_merchant_id,
    v_stripe_customer_id, v_pass_serial_number, v_google_object_id,
    v_business_name, v_display_mode, v_reward_threshold, v_reward_description, v_reward_claimed;
end;
$$;

revoke execute on function award_scan_points(uuid, uuid, int) from public, anon, authenticated;
