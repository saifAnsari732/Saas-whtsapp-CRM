-- Baileys Auto-Reply Settings
CREATE TABLE IF NOT EXISTS baileys_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_reply_enabled BOOLEAN DEFAULT false,
  auto_reply_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id)
);

ALTER TABLE baileys_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their account baileys settings" 
  ON baileys_settings 
  FOR ALL 
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Baileys Scheduled Group Messages
CREATE TABLE IF NOT EXISTS scheduled_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_jid TEXT NOT NULL,
  group_name TEXT,
  message_text TEXT NOT NULL,
  schedule_time TEXT NOT NULL, -- Format: "HH:MM" (e.g., "10:00")
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scheduled_group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their account scheduled group messages" 
  ON scheduled_group_messages 
  FOR ALL 
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Allow system crons/service role to bypass RLS
