-- ==========================================
-- wallet.ia — Migration 009: Automated Account Deletion Cron
-- Uses pg_cron to automatically delete accounts past their 30-day grace period
-- ==========================================

-- 1. Enable pg_cron extension (usually already enabled in Supabase, but good practice)
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- 2. Function to process deletions
CREATE OR REPLACE FUNCTION public.process_deletion_requests()
RETURNS void AS $$
DECLARE
  req RECORD;
BEGIN
  FOR req IN 
    SELECT id, user_id FROM public.deletion_requests 
    WHERE status = 'pending' AND scheduled_for <= now()
  LOOP
    -- Delete the user from auth.users 
    -- (This automatically cascades to profiles, accounts, transactions, etc. due to FK constraints)
    DELETE FROM auth.users WHERE id = req.user_id;
    
    -- Mark the request as processed
    UPDATE public.deletion_requests 
    SET status = 'processed', processed_at = now()
    WHERE id = req.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

-- 3. Unschedule if it already exists (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('process_account_deletions');
EXCEPTION WHEN OTHERS THEN
  -- Ignore if it doesn't exist
END $$;

-- 4. Schedule the cron job to run every day at midnight (UTC)
SELECT cron.schedule(
  'process_account_deletions',
  '0 0 * * *', -- At 00:00 every day
  'SELECT public.process_deletion_requests()'
);
