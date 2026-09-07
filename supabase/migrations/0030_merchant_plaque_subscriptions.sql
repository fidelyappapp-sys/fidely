-- Pro-tier plaque subscription state. Deliberately a separate table, NOT
-- new columns on merchants: merchants.stripe_subscription_id/
-- subscription_status already belong to the unrelated core metered loyalty
-- subscription (scripts/stripe-setup.ts). A merchant can hold both
-- subscriptions on the same Stripe customer at once, so they must never
-- share storage or a webhook code path (see app/api/stripe/webhook, which
-- branches on subscription metadata to keep the two apart).
create table if not exists merchant_plaque_subscriptions (
  merchant_id uuid primary key references merchants(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_subscription_item_id text,
  billing_interval text not null check (billing_interval in ('month', 'year')),
  status text not null default 'incomplete',
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table merchant_plaque_subscriptions enable row level security;

drop policy if exists "merchant_plaque_subscriptions_select" on merchant_plaque_subscriptions;
create policy "merchant_plaque_subscriptions_select" on merchant_plaque_subscriptions
  for select using (is_merchant_staff(merchant_id));
-- No insert/update policy: only the Stripe webhook (service-role client) writes this.
