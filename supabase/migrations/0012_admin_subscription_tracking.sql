-- Tracks when a subscription actually got canceled, independent of the
-- current subscription_status string. Needed for the admin dashboard's
-- 12-month subscriber chart (reconstructing "was this merchant active at
-- month end X" requires knowing when a cancellation happened, not just the
-- current state) and reused later by the in-app cancel button.
alter table merchants add column if not exists subscription_canceled_at timestamptz;

-- Pause-subscription columns, added early alongside the admin dashboard
-- (which surfaces a "pause ending soon" alert) even though the pause
-- feature itself ships later. Harmless nullable columns until then.
alter table merchants add column if not exists subscription_paused_at timestamptz;
alter table merchants add column if not exists subscription_pause_ends_at timestamptz;
alter table merchants add column if not exists pause_reminder_sent_at timestamptz;
