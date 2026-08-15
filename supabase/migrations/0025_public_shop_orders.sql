-- Anonymous purchases of the NFC plaque from the public /avis-google page
-- (no signup required) — separate from shop_orders, which requires a
-- merchant_id (NOT NULL, RLS scoped by is_merchant_staff). Only the
-- service-role client touches this table (checkout route + webhook), same
-- convention as stripe_webhook_events: RLS enabled, no policies.
create table if not exists public_shop_orders (
  id uuid primary key default gen_random_uuid(),
  item_key text not null check (item_key = 'nfc_card'),
  quantity int not null,
  unit_amount_cents int not null,
  amount_cents int not null,
  shipping_address jsonb,
  buyer_email text,
  buyer_name text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered')),
  stripe_checkout_session_id text,
  created_at timestamptz not null default now()
);

alter table public_shop_orders enable row level security;
