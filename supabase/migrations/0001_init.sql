-- Fidély initial schema

create extension if not exists "pgcrypto";

-- ============================================================
-- Core tables
-- ============================================================

create table merchants (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  slug text not null unique,
  logo_url text,
  brand_color text not null default '#111827',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_item_id text,
  subscription_status text not null default 'incomplete',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table merchant_staff (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  unique (merchant_id, auth_user_id)
);

create table loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  name text not null,
  points_per_scan int not null default 1 check (points_per_scan > 0),
  reward_threshold int not null check (reward_threshold > 0),
  reward_description text not null,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  full_name text,
  created_at timestamptz not null default now()
);

create table loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null default gen_random_uuid() unique,
  merchant_id uuid not null references merchants(id) on delete cascade,
  loyalty_program_id uuid not null references loyalty_programs(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  points int not null default 0,
  pass_serial_number text not null unique default encode(gen_random_bytes(16), 'hex'),
  pass_auth_token text not null default encode(gen_random_bytes(24), 'hex'),
  apple_pass_updated_at timestamptz not null default now(),
  google_object_id text,
  created_at timestamptz not null default now(),
  unique (merchant_id, customer_id, loyalty_program_id)
);

create table scan_events (
  id uuid primary key default gen_random_uuid(),
  loyalty_card_id uuid not null references loyalty_cards(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,
  staff_user_id uuid references auth.users(id),
  points_awarded int not null,
  points_balance_after int not null,
  stripe_usage_reported boolean not null default false,
  stripe_meter_event_id text,
  apple_push_status text not null default 'skipped' check (apple_push_status in ('skipped', 'sent', 'failed')),
  google_push_status text not null default 'skipped' check (google_push_status in ('skipped', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

-- Apple PassKit Web Service device registrations (service-role only)
create table wallet_pass_registrations (
  id uuid primary key default gen_random_uuid(),
  device_library_identifier text not null,
  pass_type_identifier text not null,
  serial_number text not null references loyalty_cards(pass_serial_number) on delete cascade,
  push_token text not null,
  created_at timestamptz not null default now(),
  unique (device_library_identifier, serial_number)
);

-- Stripe webhook idempotency (service-role only)
create table stripe_webhook_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index idx_merchant_staff_auth_user on merchant_staff(auth_user_id);
create index idx_loyalty_programs_merchant on loyalty_programs(merchant_id);
create index idx_loyalty_cards_merchant on loyalty_cards(merchant_id);
create index idx_loyalty_cards_customer on loyalty_cards(customer_id);
create index idx_scan_events_merchant on scan_events(merchant_id);
create index idx_scan_events_card on scan_events(loyalty_card_id);
create index idx_wallet_pass_registrations_serial on wallet_pass_registrations(serial_number);

-- ============================================================
-- Helper: is the current auth user staff of a given merchant?
-- ============================================================

create or replace function is_merchant_staff(target_merchant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from merchant_staff ms
    where ms.merchant_id = target_merchant_id
      and ms.auth_user_id = auth.uid()
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table merchants enable row level security;
alter table merchant_staff enable row level security;
alter table loyalty_programs enable row level security;
alter table customers enable row level security;
alter table loyalty_cards enable row level security;
alter table scan_events enable row level security;
alter table wallet_pass_registrations enable row level security;
alter table stripe_webhook_events enable row level security;

-- merchants: staff can read their own merchant; owners can update it
create policy "merchants_select_staff" on merchants
  for select using (is_merchant_staff(id));

create policy "merchants_update_owner" on merchants
  for update using (
    exists (
      select 1 from merchant_staff ms
      where ms.merchant_id = merchants.id
        and ms.auth_user_id = auth.uid()
        and ms.role = 'owner'
    )
  );

-- merchant_staff: members can see their own merchant's staff list
create policy "merchant_staff_select" on merchant_staff
  for select using (is_merchant_staff(merchant_id));

-- loyalty_programs: staff can read/write their own merchant's programs
create policy "loyalty_programs_select" on loyalty_programs
  for select using (is_merchant_staff(merchant_id));

create policy "loyalty_programs_insert" on loyalty_programs
  for insert with check (is_merchant_staff(merchant_id));

create policy "loyalty_programs_update" on loyalty_programs
  for update using (is_merchant_staff(merchant_id));

-- customers: no direct client policies; only reachable via service-role
-- (join/scan flows run server-side). RLS enabled with zero policies blocks
-- anon/authenticated entirely.

-- loyalty_cards: staff can read cards belonging to their merchant.
-- No insert/update policy for authenticated/anon — points and card
-- creation are only ever mutated by the service-role client.
create policy "loyalty_cards_select" on loyalty_cards
  for select using (is_merchant_staff(merchant_id));

-- scan_events: staff can read their own merchant's scan history.
-- No client insert policy — scans are only written server-side.
create policy "scan_events_select" on scan_events
  for select using (is_merchant_staff(merchant_id));

-- wallet_pass_registrations, stripe_webhook_events: RLS enabled,
-- zero policies for anon/authenticated -> service-role only.
