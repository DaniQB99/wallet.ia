-- ==========================================
-- wallet.ia — Migration 010: DB Currency Conversion
-- Adds 'currency' column to profiles
-- Creates RPC to mutate values when changing currency
-- ==========================================

-- 1. Add currency column to profiles (default EUR)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';

-- 2. Create RPC to convert all financial records for a user
CREATE OR REPLACE FUNCTION public.convert_user_currency(
  p_user_id uuid,
  p_exchange_rate numeric,
  p_new_currency text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_couple_id uuid;
  v_partner_id uuid;
BEGIN
  -- Validate
  IF p_exchange_rate <= 0 THEN
    RAISE EXCEPTION 'Exchange rate must be positive';
  END IF;

  -- Find if user is in an active couple
  SELECT id INTO v_couple_id
  FROM public.couple_links
  WHERE (user_a_id = p_user_id OR user_b_id = p_user_id)
    AND status = 'active'
  LIMIT 1;

  -- Find partner ID if in couple
  IF v_couple_id IS NOT NULL THEN
    SELECT 
      CASE WHEN user_a_id = p_user_id THEN user_b_id ELSE user_a_id END
    INTO v_partner_id
    FROM public.couple_links
    WHERE id = v_couple_id;
  END IF;

  -- 1. Update Accounts
  UPDATE public.accounts
  SET balance = balance * p_exchange_rate
  WHERE user_id = p_user_id 
     OR (v_couple_id IS NOT NULL AND couple_id = v_couple_id);

  -- 2. Update Transactions
  UPDATE public.transactions
  SET amount = amount * p_exchange_rate
  WHERE user_id = p_user_id
     OR (v_couple_id IS NOT NULL AND couple_id = v_couple_id);

  -- 3. Update Goals
  UPDATE public.goals
  SET target_amount = target_amount * p_exchange_rate,
      current_amount = current_amount * p_exchange_rate
  WHERE user_id = p_user_id
     OR (v_partner_id IS NOT NULL AND user_id = v_partner_id AND type = 'shared');

  -- 4. Update Profiles (User and Partner)
  UPDATE public.profiles
  SET currency = p_new_currency
  WHERE id = p_user_id OR (v_partner_id IS NOT NULL AND id = v_partner_id);

END;
$$;
