-- QR codes: a personal scan-session token per staff member (so a shared
-- counter device can be handed off between employees without re-typing
-- login credentials each time), and merchant-defined custom QR codes
-- (special offers, other locations, ...).
--
-- Written to be safely re-runnable, same convention as prior migrations.

-- gen_random_bytes() lives in pgcrypto, which Supabase may install into a
-- schema (typically `extensions`) that isn't on this session's default
-- search_path — widen it rather than guess/hardcode the exact schema name.
create extension if not exists pgcrypto;
set search_path = public, extensions;

-- Same technique as loyalty_cards.pass_serial_number in 0001_init.sql: a
-- volatile default so every existing row is backfilled with its own random
-- token, not just new ones.
alter table merchant_staff add column if not exists scan_token text unique default encode(gen_random_bytes(16), 'hex');

create table if not exists merchant_qr_codes (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  label text not null,
  target_url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchant_qr_codes_merchant on merchant_qr_codes(merchant_id);

alter table merchant_qr_codes enable row level security;

drop policy if exists "merchant_qr_codes_select" on merchant_qr_codes;
create policy "merchant_qr_codes_select" on merchant_qr_codes
  for select using (is_merchant_staff(merchant_id));

drop policy if exists "merchant_qr_codes_insert" on merchant_qr_codes;
create policy "merchant_qr_codes_insert" on merchant_qr_codes
  for insert with check (is_merchant_staff(merchant_id));

drop policy if exists "merchant_qr_codes_delete" on merchant_qr_codes;
create policy "merchant_qr_codes_delete" on merchant_qr_codes
  for delete using (is_merchant_staff(merchant_id));
