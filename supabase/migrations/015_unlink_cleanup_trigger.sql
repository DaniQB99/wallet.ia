-- ==============================================================================
-- 015_unlink_cleanup_trigger.sql
-- Limpieza y conversión a personal al desvincular pareja o eliminar cuenta
-- ==============================================================================

-- 1. Función para manejar la desvinculación de pareja
CREATE OR REPLACE FUNCTION public.handle_couple_unlink_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Convertir cuentas compartidas de este vínculo a personales
  UPDATE public.accounts
  SET scope = 'personal',
      couple_id = NULL,
      updated_at = now()
  WHERE couple_id = OLD.id;

  -- Convertir metas compartidas de este vínculo a personales
  UPDATE public.goals
  SET type = 'personal',
      couple_id = NULL,
      updated_at = now()
  WHERE couple_id = OLD.id;

  -- Convertir transacciones compartidas de este vínculo a personales
  UPDATE public.transactions
  SET type = 'personal',
      couple_id = NULL
  WHERE couple_id = OLD.id;

  RETURN OLD;
END;
$$;

-- 2. Trigger en couple_links que se activa ANTES de borrar el vínculo
DROP TRIGGER IF EXISTS trg_couple_unlink_cleanup ON public.couple_links;
CREATE TRIGGER trg_couple_unlink_cleanup
  BEFORE DELETE ON public.couple_links
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_couple_unlink_cleanup();

-- 3. Limpieza de registros huérfanos históricos
UPDATE public.accounts
SET scope = 'personal',
    couple_id = NULL,
    updated_at = now()
WHERE scope = 'shared' AND couple_id IS NULL;

UPDATE public.goals
SET type = 'personal',
    couple_id = NULL,
    updated_at = now()
WHERE type = 'shared' AND couple_id IS NULL;

UPDATE public.transactions
SET type = 'personal',
    couple_id = NULL
WHERE type = 'shared' AND couple_id IS NULL;

-- 4. Notificar recarga de esquema a PostgREST
NOTIFY pgrst, 'reload schema';
