-- Tags which of the 3 plaque tiers a nfc_card order line was for. Nullable
-- on shop_orders since most rows there are unrelated items (new_shop_kit,
-- replacement parts) that never had a tier; public_shop_orders is
-- Avis-only (Présence/Pro require an account, see app/api/public/nfc-checkout).
alter table shop_orders add column if not exists tier text check (tier in ('avis', 'presence', 'pro'));
alter table public_shop_orders add column if not exists tier text not null default 'avis' check (tier in ('avis'));
