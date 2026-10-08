-- ==============================================================================
-- 014_auto_link_transaction_couple.sql
-- Asegurar que cualquier transacción asociada a una cuenta compartida o de tipo 'shared'
-- tenga automáticamente asignado el couple_id correspondiente para que el RLS
-- permita su visibilidad en tiempo real a ambos miembros de la pareja.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.set_transaction_couple_id()
RETURNS TRIGGER AS $$
DECLARE
  v_acc_couple uuid;
  v_acc_scope text;
  v_active_couple uuid;
BEGIN
  -- 1. Si la transacción apunta a una cuenta, hereda sus datos si es compartida
  IF NEW.account_id IS NOT NULL THEN
    SELECT couple_id, scope INTO v_acc_couple, v_acc_scope
    FROM public.accounts
    WHERE id = NEW.account_id;
    
    IF v_acc_scope = 'shared' AND v_acc_couple IS NOT NULL THEN
      NEW.couple_id := v_acc_couple;
      NEW.type := 'shared';
    END IF;
  END IF;

  -- 2. Si la transacción es compartida pero aún no tiene couple_id, asociar al vínculo activo del usuario
  IF NEW.type = 'shared' AND NEW.couple_id IS NULL THEN
    SELECT id INTO v_active_couple
    FROM public.couple_links
    WHERE (user_a_id = NEW.user_id OR user_b_id = NEW.user_id)
      AND status = 'active'
    LIMIT 1;

    IF v_active_couple IS NOT NULL THEN
      NEW.couple_id := v_active_couple;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_transaction_couple_id') THEN
    CREATE TRIGGER trg_set_transaction_couple_id
      BEFORE INSERT OR UPDATE ON public.transactions
      FOR EACH ROW
      EXECUTE FUNCTION public.set_transaction_couple_id();
  END IF;
END $$;

-- Sincronizar transacciones compartidas existentes
UPDATE public.transactions t
   SET couple_id = a.couple_id,
       type = 'shared'
  FROM public.accounts a
 WHERE t.account_id = a.id
   AND a.scope = 'shared'
   AND a.couple_id IS NOT NULL
   AND (t.couple_id IS NULL OR t.couple_id <> a.couple_id);

UPDATE public.transactions t
   SET couple_id = cl.id
  FROM public.couple_links cl
 WHERE t.type = 'shared'
   AND t.couple_id IS NULL
   AND cl.status = 'active'
   AND (cl.user_a_id = t.user_id OR cl.user_b_id = t.user_id);
