-- 0013 only added a select policy on shop_orders; the checkout route
-- inserts a pending order with the RLS-respecting client (same convention
-- as everywhere else scoped to the logged-in merchant), which needs its
-- own insert policy.
drop policy if exists "shop_orders_insert_staff" on shop_orders;
create policy "shop_orders_insert_staff" on shop_orders
  for insert with check (is_merchant_staff(merchant_id));
