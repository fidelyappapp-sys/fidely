-- Identity of every physical plaque ever sold, across all 3 tiers and both
-- checkout paths. short_code is what gets encoded into the plaque's QR/NFC
-- at manufacturing time (see app/(public-hub)/p/[code]) — resolving it
-- server-side on every scan is what lets the destination change instantly
-- without reprinting.
create extension if not exists pgcrypto with schema extensions;

create table if not exists plaques (
  id uuid primary key default gen_random_uuid(),
  short_code text not null unique default encode(extensions.gen_random_bytes(5), 'hex'),
  tier text not null check (tier in ('avis', 'presence', 'pro')),
  merchant_id uuid references merchants(id) on delete cascade,
  avis_link_id uuid references avis_links(id) on delete set null,
  label text,
  shop_order_id uuid references shop_orders(id) on delete set null,
  public_shop_order_id uuid references public_shop_orders(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint plaques_ownership_check check (
    (tier = 'avis' and merchant_id is not null and avis_link_id is null)
    or (tier = 'avis' and merchant_id is null and avis_link_id is not null)
    or (tier in ('presence', 'pro') and merchant_id is not null and avis_link_id is null)
  )
);

create index if not exists idx_plaques_merchant on plaques(merchant_id);

alter table plaques enable row level security;

drop policy if exists "plaques_select_staff" on plaques;
create policy "plaques_select_staff" on plaques
  for select using (merchant_id is not null and is_merchant_staff(merchant_id));
-- No insert/update/delete policy: rows are only ever created by the Stripe
-- webhook once an order is paid, via the service-role client.
