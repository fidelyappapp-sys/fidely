-- Card visual design (color, logo, stamp style, background photo) becomes
-- independent per point of sale, same principle as the loyalty program and
-- city in 0023_points_of_sale.sql. All nullable: null means "not yet
-- customized for this point of sale, fall back to the merchant's own
-- values" — so no visual change for any existing point of sale until a
-- merchant explicitly edits it. merchants.* stays as that fallback source,
-- no longer edited directly once the app code moves to point-of-sale-scoped
-- editing.
--
-- Written to be safely re-runnable, same convention as prior migrations.

alter table merchant_qr_codes add column if not exists brand_color text;
alter table merchant_qr_codes add column if not exists text_color text;
alter table merchant_qr_codes add column if not exists stamp_style text;
alter table merchant_qr_codes add column if not exists sector text;
alter table merchant_qr_codes add column if not exists logo_url text;
alter table merchant_qr_codes add column if not exists background_photo_url text;
alter table merchant_qr_codes add column if not exists background_photo_enabled boolean;
alter table merchant_qr_codes add column if not exists name_display_mode text;
