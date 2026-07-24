-- ==========================================
-- wallet.ia — Migration 004: Optimize Balance Trigger
-- Replace full-table SUM with incremental balance updates
-- Impact: O(1) per transaction change instead of O(n)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Add the new amount to the account balance
    UPDATE public.accounts
    SET balance = balance + NEW.amount
    WHERE id = NEW.account_id;

    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    -- Subtract the old amount from the account balance
    UPDATE public.accounts
    SET balance = balance - OLD.amount
    WHERE id = OLD.account_id;

    RETURN OLD;

  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
      -- Transaction moved to a different account: adjust both
      UPDATE public.accounts
      SET balance = balance - OLD.amount
      WHERE id = OLD.account_id;

      UPDATE public.accounts
      SET balance = balance + NEW.amount
      WHERE id = NEW.account_id;
    ELSIF OLD.amount IS DISTINCT FROM NEW.amount THEN
      -- Same account, amount changed: adjust the delta
      UPDATE public.accounts
      SET balance = balance + (NEW.amount - OLD.amount)
      WHERE id = NEW.account_id;
    END IF;
    -- If neither account nor amount changed, no balance update needed

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';
