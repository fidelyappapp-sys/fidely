-- Platform admin access: membership in this table (keyed by a real
-- Supabase Auth user) replaces the old shared-password /admin cookie
-- (lib/adminAuth.ts). Service-role only, same "RLS enabled, zero policies"
-- pattern as stripe_webhook_events in 0001_init.sql.
create table if not exists platform_admins (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table platform_admins enable row level security;

-- Every admin action worth tracing: sign-ins, and viewing a merchant's
-- detail page (the audit trail for the "view as" support flow — see
-- app/admin/(protected)/merchants/[merchantId]/page.tsx).
create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_auth_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_merchant_id uuid references merchants(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_audit_log_target on admin_audit_log(target_merchant_id);
create index if not exists idx_admin_audit_log_created on admin_audit_log(created_at);
alter table admin_audit_log enable row level security;

-- Local mirror of Stripe invoices (see lib/invoicing.ts) for fast
-- admin-side search/filter — Stripe's hosted invoice remains the actual
-- legal document; this table never stores a PDF, just metadata + a link.
--
-- TODO(2027-09-01): the French B2B e-invoicing mandate requires issuing via
-- an approved "plateforme de dématérialisation" (PDP) by this date for
-- TPE/PME. `format`/`plateforme_agreee`/`statut_transmission` are reserved
-- for that migration and unused until then — see lib/invoicing.ts.
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  stripe_invoice_id text not null unique,
  amount_cents int not null,
  currency text not null default 'eur',
  status text not null,
  hosted_invoice_url text,
  period_start timestamptz,
  period_end timestamptz,
  format text not null default 'stripe_hosted' check (format in ('stripe_hosted', 'facturx', 'ubl')),
  plateforme_agreee text,
  statut_transmission text,
  created_at timestamptz not null default now()
);
create index if not exists idx_invoices_merchant on invoices(merchant_id);
create index if not exists idx_invoices_created on invoices(created_at);
alter table invoices enable row level security;
