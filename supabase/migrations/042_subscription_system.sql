-- Add subscription fields to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_plan TEXT; -- 'basic', 'standard', 'premium'
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial'; -- 'trial', 'active', 'expired', 'cancelled'
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;

-- Set trial for existing accounts (7 days from now)
UPDATE accounts SET trial_ends_at = NOW() + INTERVAL '7 days' WHERE trial_ends_at IS NULL;

-- Update the signup trigger to auto-set trial_ends_at for new accounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_account_id UUID;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.accounts (name, owner_user_id, trial_ends_at)
  VALUES (COALESCE(NULLIF(v_full_name, ''), NEW.email, 'My account'), NEW.id, NOW() + INTERVAL '7 days')
  RETURNING id INTO v_account_id;

  INSERT INTO public.profiles (user_id, full_name, email, account_id, account_role)
  VALUES (NEW.id, v_full_name, NEW.email, v_account_id, 'owner');

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to bootstrap account/profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
