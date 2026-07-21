-- Replacement-kit shop (/boutique): one-time paid orders, separate from
-- the metered subscription. Also lays the groundwork for multi-shop
-- accounts (business_type is shown when adding an additional commerce).
create table if not exists shop_orders (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  items jsonb not null,
  amount_cents int not null,
  delivery_method text check (delivery_method in ('hand_delivery', 'postal_shipping')),
  shipping_address jsonb,
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered')),
  stripe_checkout_session_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_shop_orders_merchant on shop_orders(merchant_id);

alter table shop_orders enable row level security;

drop policy if exists "shop_orders_select_staff" on shop_orders;
create policy "shop_orders_select_staff" on shop_orders
  for select using (is_merchant_staff(merchant_id));

alter table merchants add column if not exists business_type text;
