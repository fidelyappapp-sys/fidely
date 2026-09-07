-- Anonymous "Avis" tier purchase: the Google review link the buyer entered,
-- plus the rotating single-use edit-token hash used to let them change it
-- later without ever having a real account (see app/avis/edit/[token]).
create table if not exists avis_links (
  id uuid primary key default gen_random_uuid(),
  public_shop_order_id uuid not null references public_shop_orders(id) on delete cascade,
  buyer_email text not null,
  google_review_link text not null,
  edit_token_hash text unique,
  edit_token_rotated_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_avis_links_order on avis_links(public_shop_order_id);

alter table avis_links enable row level security;
-- No policies: only ever read/written via the service-role client (public
-- checkout, Stripe webhook, the token-resolution route) — same convention
-- as public_shop_orders/stripe_webhook_events.
