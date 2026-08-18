-- ============================================================
-- 040_wallet_and_transactions.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  low_balance_alert NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id)
);

CREATE INDEX IF NOT EXISTS idx_wallets_account_id ON wallets(account_id);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Account members can view wallets" ON wallets;
DROP POLICY IF EXISTS "Admins can update wallets" ON wallets;

CREATE POLICY "Account members can view wallets" ON wallets FOR SELECT USING (is_account_member(account_id, 'viewer'));
CREATE POLICY "Admins can update wallets" ON wallets FOR UPDATE USING (is_account_member(account_id, 'admin'));
CREATE POLICY "Admins can insert wallets" ON wallets FOR INSERT WITH CHECK (is_account_member(account_id, 'admin'));

-- Create triggers to update 'updated_at'
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_wallets_updated_at ON wallets;
CREATE TRIGGER trigger_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT NOT NULL,
  reference_id TEXT, -- e.g., payment gateway intent ID or broadcast ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_account_id ON wallet_transactions(account_id);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Account members can view transactions" ON wallet_transactions;

CREATE POLICY "Account members can view transactions" ON wallet_transactions FOR SELECT USING (is_account_member(account_id, 'viewer'));

-- Triggers for transactions are typically system-level (serverless functions), so no direct user inserts via RLS.
