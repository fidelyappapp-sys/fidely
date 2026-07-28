-- Lets a merchant show their uploaded logo in place of the business name
-- text on the customer-facing card. Defaults to 'text' so existing cards
-- keep their exact current look until a merchant opts in.
alter table merchants add column if not exists name_display_mode text not null default 'text'
  check (name_display_mode in ('text', 'logo'));
