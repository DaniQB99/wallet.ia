-- ==============================================================================
-- 003_fix_audit_trigger.sql
-- Fix PostgreSQL 22P02 "malformed array literal" in audit_transaction_change
-- Replace ambiguous text[] concatenation (v_changed || 'field') with pg_catalog.array_append
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.audit_transaction_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_changed text[] := NULL;
  v_owner uuid;
  v_id uuid;
BEGIN
  IF COALESCE(current_setting('app.bypass_audit', true), '') = 'on' THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_owner := OLD.user_id;
    v_id := OLD.id;
    IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_owner) THEN
      RETURN NULL;
    END IF;
  ELSE
    v_owner := NEW.user_id;
    v_id := NEW.id;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_changed := ARRAY[]::text[];
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN v_changed := pg_catalog.array_append(v_changed, 'amount'); END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN v_changed := pg_catalog.array_append(v_changed, 'description'); END IF;
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN v_changed := pg_catalog.array_append(v_changed, 'category_id'); END IF;
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN v_changed := pg_catalog.array_append(v_changed, 'account_id'); END IF;
    IF OLD.date IS DISTINCT FROM NEW.date THEN v_changed := pg_catalog.array_append(v_changed, 'date'); END IF;
    IF OLD.type IS DISTINCT FROM NEW.type THEN v_changed := pg_catalog.array_append(v_changed, 'type'); END IF;
    IF OLD.goal_id IS DISTINCT FROM NEW.goal_id THEN v_changed := pg_catalog.array_append(v_changed, 'goal_id'); END IF;
    IF OLD.currency::text IS DISTINCT FROM NEW.currency::text THEN v_changed := pg_catalog.array_append(v_changed, 'currency'); END IF;
  END IF;

  INSERT INTO public.audit_log
    (table_name, record_id, action, user_id, actor_id, old_data, new_data, changed_fields, ip_address)
  VALUES (
    'transactions',
    v_id,
    TG_OP,
    v_owner,
    (SELECT auth.uid()),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_changed,
    private.request_ip()
  );
  RETURN NULL;
END $function$;
