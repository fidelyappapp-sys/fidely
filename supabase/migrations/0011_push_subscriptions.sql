-- Browser Web Push subscriptions, one per device a customer opted in on.
-- Independent of the Apple/Google Wallet push channel (lib/notifications/send.ts)
-- since neither wallet is configured with real credentials yet — this is
-- the only notification channel that reliably works without an external
-- developer-program approval.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  loyalty_card_id uuid not null references loyalty_cards(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_card on push_subscriptions(loyalty_card_id);

alter table push_subscriptions enable row level security;
-- No policies: service-role only (customers aren't authenticated Supabase users).
