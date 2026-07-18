-- Merchant public mini-page: opening hours, contact info, menu/catalog,
-- photo gallery. Feeds the premium public page at /c/[publicId] linked
-- from the wallet card.
--
-- Written to be safely re-runnable, same convention as 0003_notifications.

alter table merchants add column if not exists phone text;
alter table merchants add column if not exists address text;
alter table merchants add column if not exists google_review_link text;
-- Array of 7 entries, one per day (mon..sun), e.g.
-- [{"day":"mon","closed":false,"open":"09:00","close":"19:00"}, ...]
-- Stored as a single jsonb blob rather than 7 columns since it's always
-- read/written as a whole unit (one form, one render pass) and the shape
-- may grow (multiple slots per day) without needing another migration.
alter table merchants add column if not exists opening_hours jsonb not null default '[]';

create table if not exists merchant_menu_items (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  name text not null,
  description text,
  price_cents int,
  photo_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists merchant_gallery_photos (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchant_menu_items_merchant on merchant_menu_items(merchant_id);
create index if not exists idx_merchant_gallery_photos_merchant on merchant_gallery_photos(merchant_id);

alter table merchant_menu_items enable row level security;
alter table merchant_gallery_photos enable row level security;

-- Staff can fully manage their own merchant's menu items and gallery
-- photos. The public page reads them via the service-role client (same
-- pattern as loyalty_cards/merchants there), so no anon select policy.
drop policy if exists "merchant_menu_items_select" on merchant_menu_items;
create policy "merchant_menu_items_select" on merchant_menu_items
  for select using (is_merchant_staff(merchant_id));

drop policy if exists "merchant_menu_items_insert" on merchant_menu_items;
create policy "merchant_menu_items_insert" on merchant_menu_items
  for insert with check (is_merchant_staff(merchant_id));

drop policy if exists "merchant_menu_items_update" on merchant_menu_items;
create policy "merchant_menu_items_update" on merchant_menu_items
  for update using (is_merchant_staff(merchant_id));

drop policy if exists "merchant_menu_items_delete" on merchant_menu_items;
create policy "merchant_menu_items_delete" on merchant_menu_items
  for delete using (is_merchant_staff(merchant_id));

drop policy if exists "merchant_gallery_photos_select" on merchant_gallery_photos;
create policy "merchant_gallery_photos_select" on merchant_gallery_photos
  for select using (is_merchant_staff(merchant_id));

drop policy if exists "merchant_gallery_photos_insert" on merchant_gallery_photos;
create policy "merchant_gallery_photos_insert" on merchant_gallery_photos
  for insert with check (is_merchant_staff(merchant_id));

drop policy if exists "merchant_gallery_photos_delete" on merchant_gallery_photos;
create policy "merchant_gallery_photos_delete" on merchant_gallery_photos
  for delete using (is_merchant_staff(merchant_id));
