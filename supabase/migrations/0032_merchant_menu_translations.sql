-- DeepL translation cache for the Pro-tier multilingual menu tab. Populated
-- by lib/i18n/translateMenu.ts, invalidated whenever the source menu item is
-- edited (see lib/actions/hub.ts's publishHubConfig).
create table if not exists merchant_menu_translations (
  menu_item_id uuid not null references merchant_menu_items(id) on delete cascade,
  locale text not null,
  translated_name text not null,
  translated_description text,
  translated_at timestamptz not null default now(),
  primary key (menu_item_id, locale)
);

alter table merchant_menu_translations enable row level security;
-- No policies: read via the service-role client from the public hub page,
-- written only by the translation job — same anonymous-content convention
-- as avis_links/public_shop_orders.
