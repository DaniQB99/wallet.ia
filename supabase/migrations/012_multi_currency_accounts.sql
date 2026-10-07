-- ==============================================================================
-- 012_multi_currency_accounts.sql
-- Añadir soporte de múltiples divisas nativas a las cuentas/tarjetas bancarias
-- ==============================================================================

-- 1. Añadir columna currency a la tabla accounts
ALTER TABLE public.accounts 
  ADD COLUMN IF NOT EXISTS currency public.supported_currency NOT NULL DEFAULT 'EUR';

-- 2. Backfill inicial: sincronizar la divisa de las cuentas existentes con la divisa configurada en el perfil del usuario
UPDATE public.accounts a
SET currency = CASE 
  WHEN p.currency IN ('USD', 'EUR', 'MXN', 'GBP', 'JPY', 'BRL', 'ARS', 'COP', 'CLP') 
    THEN p.currency::public.supported_currency 
  ELSE 'EUR'::public.supported_currency 
END
FROM public.profiles p
WHERE a.user_id = p.id;

-- 3. Índice para filtros y ordenación rápida por usuario y divisa
CREATE INDEX IF NOT EXISTS idx_accounts_user_currency 
  ON public.accounts(user_id, currency);

-- 4. Notificar a PostgREST para recargar la caché del esquema
NOTIFY pgrst, 'reload schema';
