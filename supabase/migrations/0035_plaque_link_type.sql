-- Categorizes what an Avis-tier plaque's single destination actually is
-- (see prompt-fidely-produits.md §1). Purely descriptive for most types —
-- the actual URL still lives in plaques.redirect_url — except:
--   - 'google_review': redirect_url is ignored, the link is computed from
--     google_place_id at render time (keeps working if the place changes).
--   - 'vcard': redirect_url is ignored, the plaque instead redirects to
--     /api/vcard/{code}, which renders vcard_data as a .vcf file.
alter table plaques add column if not exists link_type text check (
  link_type in (
    'google_review', 'tripadvisor', 'social', 'menu', 'vcard', 'website',
    'whatsapp', 'reservation', 'linktree', 'loyalty', 'other'
  )
);

alter table plaques add column if not exists vcard_data jsonb;
