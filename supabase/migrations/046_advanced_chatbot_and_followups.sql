-- ============================================================
-- 046_advanced_chatbot_and_followups.sql
-- Advanced AI Auto-Reply Chatbot, Keyword Rules, and Follow-Up Sequences
-- ============================================================

-- Chatbot Settings Table
CREATE TABLE IF NOT EXISTS chatbot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  bot_mode TEXT DEFAULT 'hybrid', -- 'hybrid', 'ai', 'keyword'
  persona TEXT DEFAULT 'sales',   -- 'sales', 'support', 'lead_gen', 'ecommerce', 'custom'
  system_prompt TEXT,
  welcome_enabled BOOLEAN DEFAULT true,
  welcome_message TEXT,
  fallback_message TEXT,
  away_enabled BOOLEAN DEFAULT false,
  away_message TEXT,
  typing_delay_seconds INTEGER DEFAULT 2,
  max_replies_per_conv INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id)
);

ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their account chatbot settings" 
  ON chatbot_settings 
  FOR ALL 
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Chatbot Keyword Rules Table
CREATE TABLE IF NOT EXISTS chatbot_keyword_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  keywords TEXT[] NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains', -- 'contains' or 'exact'
  reply_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chatbot_keyword_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their account keyword rules" 
  ON chatbot_keyword_rules 
  FOR ALL 
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Follow-Up Sequences Table
CREATE TABLE IF NOT EXISTS followup_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT DEFAULT 'no_reply_inbound',
  cancel_on_reply BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE followup_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their account followup sequences" 
  ON followup_sequences 
  FOR ALL 
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );
