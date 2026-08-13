-- Owner contact info collected at step 1 of onboarding (see
-- app/(onboarding)/onboarding/page.tsx) — separate from merchants.phone,
-- which is the public storefront number shown to customers on /c/[publicId]
-- and set later in Paramètres. Nullable: existing merchants predate this
-- step and have none of it.
alter table merchants add column if not exists owner_first_name text;
alter table merchants add column if not exists owner_last_name text;
alter table merchants add column if not exists owner_phone text;
