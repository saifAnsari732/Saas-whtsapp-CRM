-- Migration 045: Ensure new signups have role = 'user' and only designated platform admins have role = 'admin'

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_account_id UUID;
  v_role TEXT := 'user';
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  -- Determine if user is platform admin or standard user
  IF LOWER(NEW.email) IN ('ansarisaifuddin732@gmail.com', 'kisandeveloper2@gmail.com') THEN
    v_role := 'admin';
  ELSE
    v_role := 'user';
  END IF;

  INSERT INTO public.accounts (name, owner_user_id, trial_ends_at, subscription_status)
  VALUES (COALESCE(NULLIF(v_full_name, ''), NEW.email, 'My account'), NEW.id, NOW() + INTERVAL '5 days', 'trial')
  RETURNING id INTO v_account_id;

  INSERT INTO public.profiles (user_id, full_name, email, account_id, account_role, role)
  VALUES (NEW.id, v_full_name, NEW.email, v_account_id, 'owner', v_role);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to bootstrap account/profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Ensure existing profiles have role strictly enforced
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) IN ('ansarisaifuddin732@gmail.com', 'kisandeveloper2@gmail.com');

UPDATE public.profiles
SET role = 'user'
WHERE LOWER(email) NOT IN ('ansarisaifuddin732@gmail.com', 'kisandeveloper2@gmail.com');
