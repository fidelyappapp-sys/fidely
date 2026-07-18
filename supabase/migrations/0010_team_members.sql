-- Employees no longer need a Supabase Auth account (email invite): they're
-- added by name and get a personal scan QR (scan_token, from
-- 0005_qr_codes.sql) for the shared-device staff-scan handoff. auth_user_id
-- stays for the owner's own row (real dashboard login).
alter table merchant_staff add column if not exists first_name text;
alter table merchant_staff add column if not exists last_name text;
alter table merchant_staff add column if not exists active boolean not null default true;
alter table merchant_staff alter column auth_user_id drop not null;
