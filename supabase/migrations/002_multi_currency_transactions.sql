-- 1. Enum para divisas soportadas
DO $$ BEGIN
    CREATE TYPE public.supported_currency AS ENUM ('USD', 'EUR', 'MXN', 'GBP', 'JPY', 'BRL', 'ARS', 'COP', 'CLP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Añadir nuevas columnas a la tabla de Transacciones existente
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency public.supported_currency NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC(18, 9) NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS base_amount NUMERIC NOT NULL DEFAULT 0.0;

-- Nota: Como añadimos NOT NULL, el default llenará los valores existentes.
-- Actualizamos los valores base_amount de las transacciones antiguas para que coincidan con su amount original (asumiendo que eran en EUR)
UPDATE public.transactions SET base_amount = amount WHERE base_amount = 0;

-- 3. Tabla de Caché de Divisas
CREATE TABLE IF NOT EXISTS public.exchange_rates_cache (
  base_currency public.supported_currency PRIMARY KEY,
  rates JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en caché (Opcional, pero recomendado)
ALTER TABLE public.exchange_rates_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read exchange rates cache" ON public.exchange_rates_cache FOR SELECT USING (true);

-- (Las políticas de transactions ya existen y cubren toda la tabla)
