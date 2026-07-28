-- Lets a merchant use a background photo on the customer-facing card
-- instead of a solid brand color. Disabled by default (existing solid-color
-- cards keep their exact current look until a merchant opts in).
alter table merchants add column if not exists background_photo_url text;
alter table merchants add column if not exists background_photo_enabled boolean not null default false;

-- Sector icon (components/SectorIcon.tsx) shown as the default logo
-- placeholder until a merchant uploads their own — an explicit picker in
-- the card customizer, independent from the free-text business_type field
-- used elsewhere (kit ordering) since that one isn't a closed enum.
alter table merchants add column if not exists sector text
  check (sector in (
    'restaurant', 'food_truck', 'bar', 'hairdresser', 'cafe', 'bakery',
    'beauty_spa', 'gym', 'dry_cleaning', 'garage', 'florist', 'bookstore',
    'pet_shop', 'pharmacy', 'cinema'
  ));
