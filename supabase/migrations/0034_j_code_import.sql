-- Batch of 100 already-manufactured /j/{code} cards (QR printed, NFC to
-- write) sold and activated one at a time by an admin filling in a form,
-- with no merchant account/auth required — see app/admin/(protected)/plaques
-- and app/(public-hub)/p/[code]. Existing paid-flow plaques (self-service
-- checkout, real merchant_id) are untouched.
--
-- tier becomes nullable: a freshly-imported code has no tier yet ("not
-- activated"), which the ownership check below allows only when every
-- other identifying column is also empty.
alter table plaques alter column tier drop not null;

alter table plaques add column if not exists merchant_name text;
alter table plaques add column if not exists merchant_address text;
alter table plaques add column if not exists google_place_id text;
-- Tab config for a standalone (no merchant_id) presence/pro card, e.g.
-- {"enabledTabs": ["accueil","avis","menu"], "menuItems": [...]}.
-- Cards linked to a real merchant account keep using
-- merchant_hub_config/merchant_menu_items instead (see 0028/0005) — this
-- column is only read when merchant_id is null.
alter table plaques add column if not exists menu_config jsonb;

alter table plaques drop constraint if exists plaques_ownership_check;
alter table plaques add constraint plaques_ownership_check check (
  (tier is null and merchant_id is null and avis_link_id is null)
  or (tier = 'avis' and merchant_id is not null and avis_link_id is null)
  or (tier = 'avis' and merchant_id is null and avis_link_id is not null)
  or (tier in ('presence', 'pro') and merchant_id is not null and avis_link_id is null)
  -- Standalone card: any tier, filled in directly via merchant_name/
  -- merchant_address/google_place_id/menu_config instead of a merchants row.
  or (tier in ('avis', 'presence', 'pro') and merchant_id is null and avis_link_id is null)
);

-- Guarded so this is safe to re-run.
insert into plaques (short_code, tier)
values
  ('2ERTJ5', null),
  ('2SWJCK', null),
  ('2T2SAL', null),
  ('3A3YLE', null),
  ('3GDPPQ', null),
  ('3J3D55', null),
  ('3MPMSL', null),
  ('3ZT9NT', null),
  ('48DAKX', null),
  ('4C6HQV', null),
  ('4KX8ED', null),
  ('4V5UYB', null),
  ('4YV9WA', null),
  ('54D8W4', null),
  ('5HGQPJ', null),
  ('68CRC2', null),
  ('6CPAGS', null),
  ('6LWN7Q', null),
  ('6T4UEE', null),
  ('6VKTAK', null),
  ('6VZS4T', null),
  ('6ZRJHW', null),
  ('75KWVE', null),
  ('8LCD5V', null),
  ('8NYCYW', null),
  ('94975F', null),
  ('9F8JDP', null),
  ('9S95AZ', null),
  ('9WQSDH', null),
  ('9WTX42', null),
  ('A764KB', null),
  ('AEEXUG', null),
  ('AGL58J', null),
  ('AGWTHU', null),
  ('AWEQBN', null),
  ('AZL735', null),
  ('CQ99CG', null),
  ('D25VD9', null),
  ('DTJVYG', null),
  ('DW3PCN', null),
  ('E75936', null),
  ('F8CFVX', null),
  ('F8SBH5', null),
  ('GAHR5C', null),
  ('GE7UR3', null),
  ('GL2N24', null),
  ('H4QK3H', null),
  ('H65CHX', null),
  ('H7Q5TB', null),
  ('HBLJG8', null),
  ('HD26PV', null),
  ('HD6HVV', null),
  ('HKCHDJ', null),
  ('HNXKL2', null),
  ('J3QP89', null),
  ('J766MF', null),
  ('JCAT9M', null),
  ('JHTJU6', null),
  ('JLTEHY', null),
  ('JYA7TZ', null),
  ('K6356G', null),
  ('L5ZKKP', null),
  ('L6YJA8', null),
  ('LUHHCW', null),
  ('NA5FG3', null),
  ('NAM258', null),
  ('NH9SCB', null),
  ('NKEP8X', null),
  ('P6UY52', null),
  ('PALXNF', null),
  ('PGTZGK', null),
  ('PJA2WJ', null),
  ('PUS7GY', null),
  ('PUWQQG', null),
  ('PWGYRH', null),
  ('PZTVHH', null),
  ('Q3X9V8', null),
  ('Q86JSF', null),
  ('QEVANU', null),
  ('R63FCS', null),
  ('RGNBN9', null),
  ('TRPZJ5', null),
  ('TYEK8U', null),
  ('TZBUS5', null),
  ('W2W28G', null),
  ('WA22DP', null),
  ('WAJHZX', null),
  ('WJR65C', null),
  ('WL42XH', null),
  ('WMMGJ7', null),
  ('WN9T8D', null),
  ('WVFZFN', null),
  ('XTJWDP', null),
  ('Y2FVZD', null),
  ('YCPTPG', null),
  ('YPZ8J3', null),
  ('ZLVSNU', null),
  ('ZTPAC6', null),
  ('ZX9DNL', null),
  ('ZXMCXL', null)
on conflict (short_code) do nothing;
