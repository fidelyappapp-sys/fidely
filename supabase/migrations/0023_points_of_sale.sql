-- Multi-point-of-sale support: merchant_qr_codes becomes the table of
-- "points de vente" too. A join_source QR now owns its own loyalty_programs
-- row (city + reward rules independent from other points of sale), and a
-- new kind='main' row represents the historical/default point of sale (the
-- one from onboarding, previously only a virtual /join/<slug> URL, never
-- stored as a row).
--
-- Written to be safely re-runnable, same convention as prior migrations.

alter table merchant_qr_codes
  drop constraint if exists merchant_qr_codes_kind_check,
  add constraint merchant_qr_codes_kind_check check (kind in ('custom', 'join_source', 'main'));

alter table merchant_qr_codes add column if not exists city text;
alter table merchant_qr_codes add column if not exists loyalty_program_id uuid references loyalty_programs(id);

-- Structural link from a card to the point of sale it joined through — the
-- free-text loyalty_cards.source label (0022) stays as a human-readable
-- snapshot, this is what filtering/program-selection actually key off now.
-- ON DELETE SET NULL: deleting a QR must never delete customer history.
alter table loyalty_cards add column if not exists merchant_qr_code_id uuid references merchant_qr_codes(id) on delete set null;

-- No update policy existed on merchant_qr_codes until now (only
-- select/insert/delete) — needed for inline city edits.
drop policy if exists "merchant_qr_codes_update" on merchant_qr_codes;
create policy "merchant_qr_codes_update" on merchant_qr_codes
  for update using (is_merchant_staff(merchant_id));

-- Backfill: every existing merchant gets a 'main' point of sale linked to
-- their one existing program, city left null (editable afterwards). Guarded
-- so this is safe to re-run.
insert into merchant_qr_codes (merchant_id, label, target_url, kind, loyalty_program_id)
select m.id, 'Point de vente principal', '', 'main', lp.id
from merchants m
join loyalty_programs lp on lp.merchant_id = m.id
where not exists (
  select 1 from merchant_qr_codes q where q.merchant_id = m.id and q.kind = 'main'
);

update loyalty_cards lc
set merchant_qr_code_id = q.id
from merchant_qr_codes q
where q.merchant_id = lc.merchant_id and q.kind = 'main' and lc.merchant_qr_code_id is null;
