-- ==========================================
-- wallet.ia — Full Unified Database Migration
-- Includes core tracking, joint accounts, and shared categories.
-- ==========================================

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. User Profiles
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- 3. Couple Links
-- ==========================================
CREATE TABLE IF NOT EXISTS public.couple_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  shared_permission TEXT NOT NULL DEFAULT 'read_only' CHECK (shared_permission IN ('read_only', 'read_write')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_at TIMESTAMPTZ,
  CONSTRAINT unique_couple UNIQUE (user_a_id, user_b_id)
);

ALTER TABLE public.couple_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own couple links" ON public.couple_links FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "Users can insert couple links" ON public.couple_links FOR INSERT WITH CHECK (auth.uid() = user_a_id);
CREATE POLICY "Users can update own couple links" ON public.couple_links FOR UPDATE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "Users can delete own couple links" ON public.couple_links FOR DELETE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- ==========================================
-- 4. Shared Categories (Seed Data)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.shared_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.shared_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read shared categories" ON public.shared_categories FOR SELECT USING (true);

INSERT INTO public.shared_categories (name, icon, color) VALUES
  ('Hogar', '🏠', '#6366F1'), ('Servicios', '💡', '#F59E0B'),
  ('Comida', '🛒', '#10B981'), ('Transporte', '🚗', '#3B82F6'),
  ('Entretención', '🎬', '#EC4899'), ('Salud', '🏥', '#EF4444'),
  ('Viajes', '✈️', '#8B5CF6'), ('Regalos', '🎁', '#F97316');

-- ==========================================
-- 5. Personal Categories
-- ==========================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'personal' CHECK (scope IN ('personal', 'shared')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Consolidated from Migration 07
CREATE POLICY "Users can view partner shared categories" ON public.categories FOR SELECT
  USING (
    scope = 'shared' AND EXISTS (
      SELECT 1 FROM public.couple_links cl
      WHERE cl.status = 'active' AND ((cl.user_a_id = auth.uid() AND cl.user_b_id = categories.user_id) OR (cl.user_b_id = auth.uid() AND cl.user_a_id = categories.user_id))
    )
  );

-- ==========================================
-- 6. Accounts (Consolidated 02 & 06)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT '🏦',
  color TEXT NOT NULL DEFAULT '#6366F1',
  scope TEXT NOT NULL DEFAULT 'personal' CHECK (scope IN ('personal', 'shared')),
  couple_id UUID REFERENCES public.couple_links(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts" ON public.accounts FOR SELECT
  USING ((scope = 'personal' AND auth.uid() = user_id) OR (scope = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid()) AND status = 'active')));
CREATE POLICY "Users can insert accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update accounts" ON public.accounts FOR UPDATE
  USING ((scope = 'personal' AND auth.uid() = user_id) OR (scope = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid()) AND status = 'active')));
CREATE POLICY "Users can delete accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 7. Goals (Consolidated 05)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  couple_id UUID REFERENCES public.couple_links(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'shared')),
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  icon TEXT NOT NULL DEFAULT '🎯',
  color TEXT NOT NULL DEFAULT '#6366F1',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and shared goals" ON public.goals FOR SELECT
  USING ((type = 'personal' AND auth.uid() = user_id) OR (type = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid()) AND status = 'active')));
CREATE POLICY "Users can insert goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own goals or shared goals" ON public.goals FOR UPDATE
  USING (auth.uid() = user_id OR (type = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid()) AND status = 'active')));
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = created_by);

-- ==========================================
-- 8. Transactions (Consolidated 02 & 05)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'shared')),
  couple_id UUID REFERENCES public.couple_links(id) ON DELETE SET NULL,
  category_id UUID,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personal and shared transactions" ON public.transactions FOR SELECT
  USING ((type = 'personal' AND auth.uid() = user_id) OR (type = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid()) AND status = 'active')));
CREATE POLICY "Users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own or permitted shared transactions" ON public.transactions FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (
      type = 'shared'
      AND couple_id IN (
        SELECT id FROM public.couple_links
        WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid())
        AND status = 'active'
        AND shared_permission = 'read_write'
      )
    )
  );
CREATE POLICY "Users can delete own or permitted shared transactions" ON public.transactions FOR DELETE
  USING (
    auth.uid() = user_id
    OR (
      type = 'shared'
      AND couple_id IN (
        SELECT id FROM public.couple_links
        WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid())
        AND status = 'active'
        AND shared_permission = 'read_write'
      )
    )
  );

CREATE INDEX idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX idx_transactions_couple ON public.transactions(couple_id) WHERE couple_id IS NOT NULL;
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);

-- ==========================================
-- 9. Setup Profiles and Generics
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.accounts (user_id, name, balance, icon, color)
  VALUES (NEW.id, 'Efectivo', 0, '💵', '#10B981') RETURNING id INTO default_account_id;

  INSERT INTO public.categories (user_id, name, icon, color, scope) VALUES
  (NEW.id, 'Ocio', '🍺', '#F59E0B', 'personal'),
  (NEW.id, 'Comida', '🍔', '#EF4444', 'personal'),
  (NEW.id, 'Transporte', '🚌', '#3B82F6', 'personal'),
  (NEW.id, 'Hogar (Comp.)', '🏠', '#6366F1', 'shared'),
  (NEW.id, 'Supermercado (Comp.)', '🛒', '#10B981', 'shared');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 10. Realtime subscriptions
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_links;

-- ==========================================
-- 11. Triggers y Funciones de Balance
-- ==========================================

-- Función para actualizar el balance de la cuenta
CREATE OR REPLACE FUNCTION public.handle_transaction_change()
RETURNS TRIGGER AS $$
DECLARE
    affected_account_id UUID;
BEGIN
    -- Determinar qué ID de cuenta requiere actualización
    IF (TG_OP = 'DELETE') THEN
        affected_account_id := OLD.account_id;
    ELSE
        affected_account_id := NEW.account_id;
    END IF;

    -- Actualizar el balance sumando todas las transacciones de esta cuenta
    UPDATE public.accounts
    SET balance = (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.transactions
        WHERE account_id = affected_account_id
    )
    WHERE id = affected_account_id;

    -- Si es un UPDATE y el account_id cambió, actualizar la cuenta anterior también
    IF (TG_OP = 'UPDATE' AND OLD.account_id IS DISTINCT FROM NEW.account_id) THEN
        UPDATE public.accounts
        SET balance = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.transactions
            WHERE account_id = OLD.account_id
        )
        WHERE id = OLD.account_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
CREATE TRIGGER on_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_transaction_change();

-- Sincronización inicial: Actualizar todos los balances para los datos existentes
UPDATE public.accounts a
SET balance = (
    SELECT COALESCE(SUM(t.amount), 0)
    FROM public.transactions t
    WHERE t.account_id = a.id
);
