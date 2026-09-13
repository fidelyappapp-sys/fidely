-- Raw Google Place ID behind merchants.google_review_link, kept alongside
-- it so the review link can be regenerated (place IDs are stable, review
-- link format may need to change) without asking the merchant to re-enter it.
alter table merchants add column if not exists google_place_id text;

-- Custom single destination the merchant picks for an Avis plaque, instead
-- of always redirecting to merchants.google_review_link (e.g. a link page,
-- a menu, a promo) — only meaningful for the Avis tier.
alter table plaques add column if not exists redirect_url text;
alter table plaques add constraint plaques_redirect_url_avis_only
  check (redirect_url is null or tier = 'avis');

-- Whether loyalty-card features are unlocked on this plaque. Only ever true
-- for Pro; a plain flag, not tied to merchant_plaque_subscriptions.status.
alter table plaques add column if not exists loyalty_enabled boolean not null default false;
alter table plaques add constraint plaques_loyalty_enabled_pro_only
  check (loyalty_enabled = false or tier = 'pro');
