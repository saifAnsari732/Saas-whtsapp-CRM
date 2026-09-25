-- Migration 047: Store complete Meta account details and metadata in whatsapp_config
-- Allows instant identification and prevents false disconnects across sessions

ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS verified_name TEXT,
  ADD COLUMN IF NOT EXISTS display_phone_number TEXT,
  ADD COLUMN IF NOT EXISTS quality_rating TEXT;
