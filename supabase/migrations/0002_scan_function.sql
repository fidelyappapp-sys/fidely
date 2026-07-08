-- Atomically awards points for a scan: locks the card row, increments
-- points, records the scan event, and returns everything the app needs to
-- fan out Stripe usage reporting + wallet push updates. Runs as a single
-- transaction so concurrent scans on the same card can't race.

create or replace function award_scan_points(p_loyalty_card_id uuid, p_staff_user_id uuid)
returns table (
  scan_event_id uuid,
  points_awarded int,
  points_balance_after int,
  merchant_id uuid,
  stripe_customer_id text,
  pass_serial_number text,
  google_object_id text
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
  v_new_balance int;
  v_scan_id uuid;
begin
  select lp.points_per_scan, lc.merchant_id, m.stripe_customer_id,
         lc.pass_serial_number, lc.google_object_id
    into v_points_per_scan, v_merchant_id, v_stripe_customer_id,
         v_pass_serial_number, v_google_object_id
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
    v_stripe_customer_id, v_pass_serial_number, v_google_object_id;
end;
$$;

-- This function is only ever called from trusted server code using the
-- service-role key. It must NOT be reachable as a public RPC endpoint,
-- since it takes no merchant/ownership checks itself (those happen in the
-- Route Handler before calling it).
revoke execute on function award_scan_points(uuid, uuid) from public, anon, authenticated;
