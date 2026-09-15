-- Billing orders to track Razorpay orders
CREATE TABLE IF NOT EXISTS billing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL, -- in paise
  currency TEXT DEFAULT 'INR',
  plan_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'wallet_topup', 'addon')),
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_orders_account ON billing_orders(account_id);
CREATE INDEX idx_billing_orders_razorpay ON billing_orders(razorpay_order_id);

ALTER TABLE billing_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account members can view orders" ON billing_orders FOR SELECT USING (is_account_member(account_id, 'viewer'));
CREATE POLICY "System can insert orders" ON billing_orders FOR INSERT WITH CHECK (is_account_member(account_id, 'admin'));

-- Billing plans configuration table
CREATE TABLE IF NOT EXISTS billing_plans (
  id TEXT PRIMARY KEY, -- 'starter', 'essential', 'growth', 'allinone'
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL, -- in paise (29900 = ₹299)
  price_yearly INTEGER NOT NULL, -- in paise
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}', -- {messages: 1000, contacts: 1000, users: 1, whatsapp_numbers: 1}
  services JSONB NOT NULL DEFAULT '{}', -- {whatsapp_api: true, website: false, chatbot: 'basic', ...}
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read plans" ON billing_plans FOR SELECT TO authenticated USING (true);

-- Seed the 4 plans
INSERT INTO billing_plans (id, name, price_monthly, price_yearly, features, limits, services, sort_order) VALUES
('starter', 'Starter', 49900, 479040, 
  '["1 WhatsApp Number", "2,000 Messages/month", "2,000 Contacts", "1 User", "Basic CRM Templates", "Basic AI Chatbot", "Basic Broadcasts", "Contact Management", "Standard Analytics", "Community Support"]'::jsonb,
  '{"messages": 2000, "contacts": 2000, "users": 1, "whatsapp_numbers": 1}'::jsonb,
  '{"whatsapp_api": "basic", "website": false, "chatbot": "basic", "ai_agent": false, "seo": false, "ai_automation": false}'::jsonb,
  1),
('essential', 'Essential', 99900, 959040,
  '["2 WhatsApp Numbers", "15,000 Messages/month", "15,000 Contacts", "5 Users", "Advanced AI Chatbot", "Unlimited Campaigns", "Flow Builder", "API & Webhooks", "Website Development Support", "Email Support"]'::jsonb,
  '{"messages": 15000, "contacts": 15000, "users": 5, "whatsapp_numbers": 2}'::jsonb,
  '{"whatsapp_api": "standard", "website": "landing_page", "chatbot": "advanced", "ai_agent": false, "seo": false, "ai_automation": "basic"}'::jsonb,
  2),
('growth', 'Growth', 199900, 1919040,
  '["3 WhatsApp Numbers", "50,000 Messages/month", "Unlimited Contacts", "15 Users", "Custom AI Agents & Workflows", "Advanced Flow Builder", "AI Template Generator", "Lead Generation Funnels", "E-Commerce Integration", "Priority Support"]'::jsonb,
  '{"messages": 50000, "contacts": -1, "users": 15, "whatsapp_numbers": 3}'::jsonb,
  '{"whatsapp_api": "advanced", "website": "full_site", "chatbot": "custom", "ai_agent": 3, "seo": "basic", "ai_automation": "advanced"}'::jsonb,
  3),
('allinone', 'All-In-One', 399900, 3839040,
  '["Unlimited WhatsApp Numbers", "Unlimited Messages", "Unlimited Contacts", "Unlimited Users", "Full AI Automation Suite", "Sequence & Auto-Followups", "Custom Website & Mobile App Dev", "SEO Optimization & Google Ads", "Advanced Integrations", "Dedicated Account Manager"]'::jsonb,
  '{"messages": -1, "contacts": -1, "users": -1, "whatsapp_numbers": -1}'::jsonb,
  '{"whatsapp_api": "unlimited", "website": "full_plus_app", "chatbot": "unlimited", "ai_agent": -1, "seo": "full", "ai_automation": "full"}'::jsonb,
  4)
ON CONFLICT (id) DO UPDATE SET price_monthly = EXCLUDED.price_monthly, price_yearly = EXCLUDED.price_yearly;

-- Processed webhook events for idempotency
CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id TEXT PRIMARY KEY, -- razorpay event ID
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
