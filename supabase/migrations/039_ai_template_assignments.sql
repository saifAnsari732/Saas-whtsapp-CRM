-- ============================================================
-- 039_ai_template_assignments.sql — Template-Specific AI Auto-Reply
--
-- Adds scope and assigned templates columns to ai_configs so
-- the AI Agent can be restricted to replying only to responses
-- from specific assigned WhatsApp message templates.
-- ============================================================

ALTER TABLE ai_configs 
ADD COLUMN IF NOT EXISTS auto_reply_scope text NOT NULL DEFAULT 'all' 
  CHECK (auto_reply_scope IN ('all', 'assigned_templates')),
ADD COLUMN IF NOT EXISTS assigned_templates text[] NOT NULL DEFAULT '{}';
