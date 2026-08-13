-- Join QR codes tagged with a source (second point of sale, special offer),
-- distinct from free-link "custom" QR codes. Both kinds live in
-- merchant_qr_codes; a "join_source" row's target_url is precomputed as
-- /join/<slug>?source=<label> so the existing QR render/download pipeline
-- (urlQrDataUrl(row.target_url)) needs no changes.
--
-- Written to be safely re-runnable, same convention as prior migrations.

alter table merchant_qr_codes
  add column if not exists kind text not null default 'custom'
  check (kind in ('custom', 'join_source'));

-- Acquisition source captured once, at loyalty_cards creation — never
-- overwritten on later joins so it reflects the original signup channel.
alter table loyalty_cards add column if not exists source text;
