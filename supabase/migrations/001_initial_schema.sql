-- ==========================================
-- wallet.ia — Initial Master Schema Migration
-- Comprehensive Schema: Core Tracking, Joint Accounts, GDPR,
-- Audit Logs, Currency Conversion, RPC Functions & Realtime.
-- ==========================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- ==========================================
-- 2. User Profiles
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "Users can view partner profile" ON public.profiles
  FOR SELECT USING (
    id IN (
      SELECT CASE
        WHEN cl.user_a_id = (select auth.uid()) THEN cl.user_b_id
        ELSE cl.user_a_id
      END
      FROM public.couple_links cl
      WHERE (cl.user_a_id = (select auth.uid()) OR cl.user_b_id = (select auth.uid()))
        AND cl.status = 'active'
    )
  );

-- ==========================================
-- 3. Couple Links & Invitations
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

CREATE POLICY "Users can view own couple links" ON public.couple_links
  FOR SELECT USING ((select auth.uid()) = user_a_id OR (select auth.uid()) = user_b_id);
CREATE POLICY "Users can insert couple links" ON public.couple_links
  FOR INSERT WITH CHECK ((select auth.uid()) = user_a_id OR (select auth.uid()) = user_b_id);
CREATE POLICY "Users can update own couple links" ON public.couple_links
  FOR UPDATE USING ((select auth.uid()) = user_a_id OR (select auth.uid()) = user_b_id);
CREATE POLICY "Users can delete own couple links" ON public.couple_links
  FOR DELETE USING ((select auth.uid()) = user_a_id OR (select auth.uid()) = user_b_id);

CREATE INDEX IF NOT EXISTS idx_couple_links_active_reverse
  ON public.couple_links(user_b_id, user_a_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.couple_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.couple_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invitation by code" ON public.couple_invitations
  FOR SELECT USING (status = 'pending' AND expires_at > now());
CREATE POLICY "Users can view own invitations" ON public.couple_invitations
  FOR SELECT USING ((select auth.uid()) = inviter_id);
CREATE POLICY "Users can create invitations" ON public.couple_invitations
  FOR INSERT WITH CHECK ((select auth.uid()) = inviter_id);
CREATE POLICY "Users can update own invitations" ON public.couple_invitations
  FOR UPDATE USING ((select auth.uid()) = inviter_id);

CREATE INDEX IF NOT EXISTS idx_couple_invitations_inviter ON public.couple_invitations(inviter_id);

-- ==========================================
-- 4. Shared & Personal Categories
-- ==========================================
CREATE TABLE IF NOT EXISTS public.shared_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CONSTRAINT shared_categories_name_unique UNIQUE,
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
  ('Viajes', '✈️', '#8B5CF6'), ('Regalos', '🎁', '#F97316')
ON CONFLICT (name) DO NOTHING;

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

CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can view partner shared categories" ON public.categories FOR SELECT
  USING (
    scope = 'shared' AND EXISTS (
      SELECT 1 FROM public.couple_links cl
      WHERE cl.status = 'active' AND ((cl.user_a_id = (select auth.uid()) AND cl.user_b_id = categories.user_id) OR (cl.user_b_id = (select auth.uid()) AND cl.user_a_id = categories.user_id))
    )
  );

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_scope_name_idx ON public.categories (user_id, scope, lower(name));

-- ==========================================
-- 5. Accounts
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
  USING ((scope = 'personal' AND (select auth.uid()) = user_id) OR (scope = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid())) AND status = 'active')));
CREATE POLICY "Users can insert accounts" ON public.accounts FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update accounts" ON public.accounts FOR UPDATE
  USING ((scope = 'personal' AND (select auth.uid()) = user_id) OR (scope = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid())) AND status = 'active')));
CREATE POLICY "Users can delete accounts" ON public.accounts FOR DELETE USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_couple_id ON public.accounts(couple_id) WHERE couple_id IS NOT NULL;

-- ==========================================
-- 6. Goals
-- ==========================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  couple_id UUID REFERENCES public.couple_links(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'shared')),
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL CONSTRAINT goals_target_amount_positive CHECK (target_amount > 0),
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CONSTRAINT goals_current_amount_non_negative CHECK (current_amount >= 0),
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
  USING ((type = 'personal' AND (select auth.uid()) = user_id) OR (type = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid())) AND status = 'active')));
CREATE POLICY "Users can insert goals" ON public.goals FOR INSERT WITH CHECK ((select auth.uid()) = created_by);
CREATE POLICY "Users can update own goals or shared goals" ON public.goals FOR UPDATE
  USING ((select auth.uid()) = user_id OR (type = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid())) AND status = 'active')));
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING ((select auth.uid()) = created_by);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category_id ON public.goals(category_id) WHERE category_id IS NOT NULL;

-- ==========================================
-- 7. Transactions
-- ==========================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'shared')),
  couple_id UUID REFERENCES public.couple_links(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions" ON public.transactions FOR SELECT
  USING ((type = 'personal' AND (select auth.uid()) = user_id) OR (type = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid())) AND status = 'active')));
CREATE POLICY "Users can insert transactions" ON public.transactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update transactions" ON public.transactions FOR UPDATE
  USING (
    (select auth.uid()) = user_id
    OR (
      type = 'shared'
      AND couple_id IN (
        SELECT id FROM public.couple_links
        WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid()))
        AND status = 'active'
        AND shared_permission = 'read_write'
      )
    )
  );
CREATE POLICY "Users can delete transactions" ON public.transactions FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR (
      type = 'shared'
      AND couple_id IN (
        SELECT id FROM public.couple_links
        WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid()))
        AND status = 'active'
        AND shared_permission = 'read_write'
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_couple ON public.transactions(couple_id) WHERE couple_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_analytics ON public.transactions(user_id, date DESC, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_covering ON public.transactions(user_id, date DESC) INCLUDE (amount, type, category_id, account_id, description);

-- ==========================================
-- 8. Notifications
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ==========================================
-- 9. GDPR & Compliance (Consents, Deletion Requests, Audit Log)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('privacy_policy', 'data_processing', 'terms_of_service')),
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  policy_version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_consent UNIQUE (user_id, consent_type, policy_version)
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON public.user_consents FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own consents" ON public.user_consents FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own consents" ON public.user_consents FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id);

CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'processed'))
);

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests" ON public.deletion_requests FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can create deletion request" ON public.deletion_requests FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can cancel deletion request" ON public.deletion_requests FOR UPDATE USING ((select auth.uid()) = user_id AND status = 'pending');

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON public.deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_pending ON public.deletion_requests(scheduled_for) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'BALANCE_CHANGE')),
  user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit log" ON public.audit_log FOR SELECT USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- ==========================================
-- 10. Triggers & Functions
-- ==========================================

-- Function for auto updating updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.accounts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.goals;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.transactions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function for User Provisioning
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.accounts (user_id, name, balance, icon, color)
  VALUES (NEW.id, 'Efectivo principal', 0, '💵', '#10B981') RETURNING id INTO default_account_id;

  INSERT INTO public.categories (user_id, name, icon, color, scope) VALUES
  (NEW.id, 'Ocio', '🍺', '#F59E0B', 'personal'),
  (NEW.id, 'Comida', '🍔', '#EF4444', 'personal'),
  (NEW.id, 'Transporte', '🚌', '#3B82F6', 'personal'),
  (NEW.id, 'Compras', '🛍️', '#EC4899', 'personal'),
  (NEW.id, 'Suscripciones', '📱', '#8B5CF6', 'personal'),
  (NEW.id, 'Hogar', '🏠', '#6366F1', 'shared'),
  (NEW.id, 'Supermercado', '🛒', '#10B981', 'shared'),
  (NEW.id, 'Servicios', '💡', '#F59E0B', 'shared'),
  (NEW.id, 'Transporte', '🚗', '#3B82F6', 'shared');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optimized Incremental O(1) Account Balance Trigger
CREATE OR REPLACE FUNCTION public.handle_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.accounts
    SET balance = balance + NEW.amount
    WHERE id = NEW.account_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.accounts
    SET balance = balance - OLD.amount
    WHERE id = OLD.account_id;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF OLD.amount IS DISTINCT FROM NEW.amount THEN
      UPDATE public.accounts SET balance = balance + (NEW.amount - OLD.amount) WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
CREATE TRIGGER on_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_change();

-- Audit Triggers
CREATE OR REPLACE FUNCTION public.audit_transaction_change()
RETURNS TRIGGER AS $$
DECLARE
  changed TEXT[];
  uid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN uid := OLD.user_id; ELSE uid := NEW.user_id; END IF;

  IF TG_OP = 'UPDATE' THEN
    changed := ARRAY[]::TEXT[];
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN changed := changed || 'amount'; END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN changed := changed || 'description'; END IF;
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN changed := changed || 'category_id'; END IF;
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN changed := changed || 'account_id'; END IF;
    IF OLD.date IS DISTINCT FROM NEW.date THEN changed := changed || 'date'; END IF;
    IF OLD.type IS DISTINCT FROM NEW.type THEN changed := changed || 'type'; END IF;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, user_id, old_data, new_data, changed_fields)
  VALUES (
    'transactions',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    uid,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    changed
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS audit_transactions ON public.transactions;
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_transaction_change();

CREATE OR REPLACE FUNCTION public.audit_account_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.balance IS DISTINCT FROM NEW.balance THEN
    INSERT INTO public.audit_log (table_name, record_id, action, user_id, old_data, new_data, changed_fields)
    VALUES (
      'accounts',
      NEW.id,
      'BALANCE_CHANGE',
      NEW.user_id,
      jsonb_build_object('balance', OLD.balance),
      jsonb_build_object('balance', NEW.balance),
      ARRAY['balance']
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS audit_accounts ON public.accounts;
CREATE TRIGGER audit_accounts
  AFTER UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.audit_account_change();

-- ==========================================
-- 11. RPC Helper Functions
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_partner_id()
RETURNS UUID AS $$
DECLARE
  partner UUID;
BEGIN
  SELECT
    CASE WHEN user_a_id = (select auth.uid()) THEN user_b_id ELSE user_a_id END INTO partner
  FROM public.couple_links
  WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid()))
    AND status = 'active'
  LIMIT 1;
  RETURN partner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS JSONB AS $$
DECLARE
  uid UUID := (select auth.uid());
  result JSONB;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', uid,
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = uid),
    'accounts', COALESCE((SELECT jsonb_agg(row_to_json(a)) FROM public.accounts a WHERE a.user_id = uid), '[]'::jsonb),
    'categories', COALESCE((SELECT jsonb_agg(row_to_json(c)) FROM public.categories c WHERE c.user_id = uid), '[]'::jsonb),
    'transactions', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM public.transactions t WHERE t.user_id = uid), '[]'::jsonb),
    'goals', COALESCE((SELECT jsonb_agg(row_to_json(g)) FROM public.goals g WHERE g.user_id = uid), '[]'::jsonb),
    'notifications', COALESCE((SELECT jsonb_agg(row_to_json(n)) FROM public.notifications n WHERE n.user_id = uid), '[]'::jsonb),
    'consents', COALESCE((SELECT jsonb_agg(row_to_json(uc)) FROM public.user_consents uc WHERE uc.user_id = uid), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
  IF p_exchange_rate <= 0 THEN RAISE EXCEPTION 'Exchange rate must be positive'; END IF;

  SELECT id INTO v_couple_id FROM public.couple_links WHERE (user_a_id = p_user_id OR user_b_id = p_user_id) AND status = 'active' LIMIT 1;
  IF v_couple_id IS NOT NULL THEN
    SELECT CASE WHEN user_a_id = p_user_id THEN user_b_id ELSE user_a_id END INTO v_partner_id FROM public.couple_links WHERE id = v_couple_id;
  END IF;

  UPDATE public.accounts SET balance = balance * p_exchange_rate WHERE user_id = p_user_id OR (v_couple_id IS NOT NULL AND couple_id = v_couple_id);
  UPDATE public.transactions SET amount = amount * p_exchange_rate WHERE user_id = p_user_id OR (v_couple_id IS NOT NULL AND couple_id = v_couple_id);
  UPDATE public.goals SET target_amount = target_amount * p_exchange_rate, current_amount = current_amount * p_exchange_rate WHERE user_id = p_user_id OR (v_partner_id IS NOT NULL AND user_id = v_partner_id AND type = 'shared');
  UPDATE public.profiles SET currency = p_new_currency WHERE id = p_user_id OR (v_partner_id IS NOT NULL AND id = v_partner_id);
END;
$$;

-- Automated Cron Deletion Function
CREATE OR REPLACE FUNCTION public.process_deletion_requests()
RETURNS void AS $$
DECLARE
  req RECORD;
BEGIN
  FOR req IN SELECT id, user_id FROM public.deletion_requests WHERE status = 'pending' AND scheduled_for <= now() LOOP
    DELETE FROM auth.users WHERE id = req.user_id;
    UPDATE public.deletion_requests SET status = 'processed', processed_at = now() WHERE id = req.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DO $$
BEGIN
  PERFORM cron.unschedule('process_account_deletions');
EXCEPTION WHEN OTHERS THEN
END $$;

SELECT cron.schedule(
  'process_account_deletions',
  '0 0 * * *',
  'SELECT public.process_deletion_requests()'
);

-- ==========================================
-- 12. Realtime Subscriptions
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
