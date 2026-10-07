-- ==============================================================================
-- 011_add_account_position.sql
-- Add position column to accounts table to allow custom user ordering of cards
-- ==============================================================================

ALTER TABLE public.accounts 
  ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) - 1 AS new_pos
  FROM public.accounts
)
UPDATE public.accounts a
SET position = n.new_pos
FROM numbered n
WHERE a.id = n.id;

CREATE INDEX IF NOT EXISTS idx_accounts_user_position 
  ON public.accounts(user_id, position);
