-- Physical kit delivery: after signup + card registration, the merchant
-- picks how they receive their Fidély counter display + printed QR.
--
-- Written to be safely re-runnable, same convention as prior migrations.

alter table merchants add column if not exists kit_delivery_method text
  check (kit_delivery_method in ('hand_delivery', 'express_shipping', 'standard_shipping'));

-- {name, line1, line2, postalCode, city, country} — only meaningful for the
-- two shipping methods; null for hand_delivery.
alter table merchants add column if not exists kit_shipping_address jsonb;

alter table merchants add column if not exists kit_delivery_status text not null default 'pending'
  check (kit_delivery_status in ('pending', 'processing', 'shipped', 'delivered', 'installed'));

-- Set only for express_shipping, once the one-time 3,99€ charge succeeds.
alter table merchants add column if not exists kit_payment_intent_id text;
