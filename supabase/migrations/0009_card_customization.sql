-- Lets merchants personalize their loyalty card: brand_color already exists
-- (set at onboarding), this adds the stamp icon style shown on the
-- customer-facing card.
alter table merchants add column if not exists stamp_style text not null default 'circle'
  check (stamp_style in ('star', 'square', 'triangle', 'heart', 'butterfly', 'circle', 'diamond'));
