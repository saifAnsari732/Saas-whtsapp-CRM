-- ============================================================
-- Migration 048: Instant Broadcast Auto-Reply Engine
--
-- Enables instant automatic responses whenever a customer replies
-- to a broadcast campaign.
--   1. Adds auto_reply_enabled & auto_reply_text columns to `broadcasts`
--   2. Adds auto_reply_sent_at to `broadcast_recipients` to guarantee
--      strictly once-per-recipient dispatch (idempotency / no spam)
-- ============================================================

ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reply_text TEXT;

ALTER TABLE broadcast_recipients
  ADD COLUMN IF NOT EXISTS auto_reply_sent_at TIMESTAMPTZ;

-- Index to optimize quick lookup when a customer replies
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_contact_reply_check
  ON broadcast_recipients (contact_id, status, auto_reply_sent_at);
