-- ==========================================
-- wallet.ia — Migration 005: Schema Sync & Integrity
-- Ensures live DB matches TypeScript interfaces
-- ==========================================

-- 1. Fix SECURITY DEFINER functions — add search_path protection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.accounts (user_id, name, balance, icon, color)
  VALUES (NEW.id, 'Efectivo principal', 0, '💵', '#10B981')
  RETURNING id INTO default_account_id;

  INSERT INTO public.categories (user_id, name, icon, color, scope) VALUES
  (NEW.id, 'Ocio', '🍺', '#F59E0B', 'personal'),
  (NEW.id, 'Comida', '🍔', '#EF4444', 'personal'),
  (NEW.id, 'Transporte', '🚌', '#3B82F6', 'personal'),
  (NEW.id, 'Compras', '🛍️', '#EC4899', 'personal'),
  (NEW.id, 'Suscripciones', '📱', '#8B5CF6', 'personal'),
  (NEW.id, 'Hogar (Comp.)', '🏠', '#6366F1', 'shared'),
  (NEW.id, 'Supermercado (Comp.)', '🛒', '#10B981', 'shared'),
  (NEW.id, 'Servicios (Comp.)', '💡', '#F59E0B', 'shared'),
  (NEW.id, 'Transporte (Comp.)', '🚗', '#3B82F6', 'shared');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_partner_id()
RETURNS UUID AS $$
DECLARE
  partner UUID;
BEGIN
  SELECT
    CASE
      WHEN user_a_id = (select auth.uid()) THEN user_b_id
      ELSE user_a_id
    END INTO partner
  FROM public.couple_links
  WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid()))
    AND status = 'active'
  LIMIT 1;

  RETURN partner;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql
SECURITY INVOKER;

-- 2. Add missing columns to goals if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'current_amount'
  ) THEN
    ALTER TABLE public.goals ADD COLUMN current_amount DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.goals ADD COLUMN created_by UUID REFERENCES auth.users(id);
    -- Backfill: set created_by = user_id for existing rows
    UPDATE public.goals SET created_by = user_id WHERE created_by IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.goals ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- 3. Add CHECK constraints for financial integrity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_target_amount_positive'
  ) THEN
    ALTER TABLE public.goals ADD CONSTRAINT goals_target_amount_positive CHECK (target_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_current_amount_non_negative'
  ) THEN
    ALTER TABLE public.goals ADD CONSTRAINT goals_current_amount_non_negative CHECK (current_amount >= 0);
  END IF;
END $$;

-- 4. Make shared_categories seed idempotent
-- (Uses ON CONFLICT with a unique constraint on name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shared_categories_name_unique'
  ) THEN
    ALTER TABLE public.shared_categories ADD CONSTRAINT shared_categories_name_unique UNIQUE (name);
  END IF;
END $$;
