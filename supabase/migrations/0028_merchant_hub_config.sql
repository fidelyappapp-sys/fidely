-- Only the genuinely new hub content: which tabs are enabled/in what order,
-- and social links. Menu, opening hours, phone, and the Google review link
-- are all reused as-is from merchants/merchant_menu_items (0005_merchant_page.sql).
create table if not exists merchant_hub_config (
  merchant_id uuid primary key references merchants(id) on delete cascade,
  enabled_tabs jsonb not null default '["menu","avis","contact"]',
  updated_at timestamptz not null default now()
);

create table if not exists merchant_social_links (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'facebook', 'tiktok', 'website', 'other')),
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchant_social_links_merchant on merchant_social_links(merchant_id);

alter table merchant_hub_config enable row level security;
alter table merchant_social_links enable row level security;

-- Same is_merchant_staff CRUD pattern as merchant_menu_items.
drop policy if exists "merchant_hub_config_select" on merchant_hub_config;
create policy "merchant_hub_config_select" on merchant_hub_config
  for select using (is_merchant_staff(merchant_id));
drop policy if exists "merchant_hub_config_upsert" on merchant_hub_config;
create policy "merchant_hub_config_upsert" on merchant_hub_config
  for all using (is_merchant_staff(merchant_id)) with check (is_merchant_staff(merchant_id));

drop policy if exists "merchant_social_links_select" on merchant_social_links;
create policy "merchant_social_links_select" on merchant_social_links
  for select using (is_merchant_staff(merchant_id));
drop policy if exists "merchant_social_links_insert" on merchant_social_links;
create policy "merchant_social_links_insert" on merchant_social_links
  for insert with check (is_merchant_staff(merchant_id));
drop policy if exists "merchant_social_links_delete" on merchant_social_links;
create policy "merchant_social_links_delete" on merchant_social_links
  for delete using (is_merchant_staff(merchant_id));
