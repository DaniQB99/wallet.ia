-- ==========================================
-- wallet.ia — Migration 007: Audit Log
-- Immutable financial transaction audit trail
-- Required for financial app compliance
-- ==========================================

-- 1. Audit log table (append-only)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only allow INSERTs (append-only — no UPDATE or DELETE)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only read their own audit entries
CREATE POLICY "Users can view own audit log" ON public.audit_log
  FOR SELECT USING ((select auth.uid()) = user_id);

-- No INSERT policy for clients — only SECURITY DEFINER triggers write here

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- 2. Trigger function to log transaction changes
CREATE OR REPLACE FUNCTION public.audit_transaction_change()
RETURNS TRIGGER AS $$
DECLARE
  changed TEXT[];
  uid UUID;
BEGIN
  -- Determine the user
  IF TG_OP = 'DELETE' THEN
    uid := OLD.user_id;
  ELSE
    uid := NEW.user_id;
  END IF;

  -- Calculate changed fields for UPDATE
  IF TG_OP = 'UPDATE' THEN
    changed := ARRAY[]::TEXT[];
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN changed := changed || 'amount'; END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN changed := changed || 'description'; END IF;
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN changed := changed || 'category_id'; END IF;
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN changed := changed || 'account_id'; END IF;
    IF OLD.date IS DISTINCT FROM NEW.date THEN changed := changed || 'date'; END IF;
    IF OLD.type IS DISTINCT FROM NEW.type THEN changed := changed || 'type'; END IF;
    IF OLD.couple_id IS DISTINCT FROM NEW.couple_id THEN changed := changed || 'couple_id'; END IF;
    IF OLD.goal_id IS DISTINCT FROM NEW.goal_id THEN changed := changed || 'goal_id'; END IF;
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

  RETURN NULL; -- AFTER trigger, return value ignored
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

-- 3. Apply audit trigger to transactions
DROP TRIGGER IF EXISTS audit_transactions ON public.transactions;
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_transaction_change();

-- 4. Audit trigger for account balance changes
CREATE OR REPLACE FUNCTION public.audit_account_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log balance changes (most critical for financial auditing)
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

DROP TRIGGER IF EXISTS audit_accounts ON public.accounts;
CREATE TRIGGER audit_accounts
  AFTER UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_account_change();
