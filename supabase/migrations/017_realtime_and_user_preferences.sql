-- ====================================================================
-- 017_realtime_and_user_preferences.sql
-- Sincronización en la nube de preferencias de usuario y habilitación
-- de Supabase Realtime en profiles para sincronización multi-dispositivo.
-- ====================================================================

-- 1. Añadir columnas de preferencias de usuario en public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#F71E5D';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'es-ES';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hide_card_balance BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Asegurar que las tablas operativas tengan réplica completa para payloads Realtime
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.goals REPLICA IDENTITY FULL;

-- 3. Habilitar la publicación en tiempo real para profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
