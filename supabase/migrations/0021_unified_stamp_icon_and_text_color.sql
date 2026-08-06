-- The card customizer now lets a merchant pick the stamp icon from either
-- the sector set (components/SectorIcon.tsx) or the original generic shapes
-- (components/StampIcon.tsx) — a single merged picker instead of two
-- separate ones. stamp_style must therefore accept both value sets.
-- The constraint name isn't hardcoded since it depends on how Postgres
-- auto-named it when 0009_card_customization.sql added the column inline.
do $$
declare
  con text;
begin
  select conname into con
  from pg_constraint
  where conrelid = 'public.merchants'::regclass
    and pg_get_constraintdef(oid) ilike '%stamp_style%';
  if con is not null then
    execute format('alter table merchants drop constraint %I', con);
  end if;
end $$;

alter table merchants add constraint merchants_stamp_style_check
  check (stamp_style in (
    'star', 'square', 'triangle', 'heart', 'butterfly', 'circle', 'diamond',
    'restaurant', 'food_truck', 'bar', 'hairdresser', 'cafe', 'bakery',
    'beauty_spa', 'gym', 'dry_cleaning', 'garage', 'florist', 'bookstore',
    'pet_shop', 'pharmacy', 'cinema'
  ));

-- Custom text color for the card (business name, labels, points/stamps
-- count). Nullable: null means "not chosen yet", in which case the app
-- suggests white or black from brand_color's luminance (lib/color.ts) but
-- never persists that suggestion until the merchant actually picks a color.
alter table merchants add column if not exists text_color text;
