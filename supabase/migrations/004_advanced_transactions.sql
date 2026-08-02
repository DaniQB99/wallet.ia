-- ==========================================
-- wallet.ia — Advanced Transactions (Recurring & Transfers)
-- ==========================================

-- 1. Modify transactions table
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS transfer_group_id UUID,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;

-- 2. Create recurring_transactions table
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES public.couple_links(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  destination_account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE, -- For recurring transfers
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'shared')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  interval TEXT NOT NULL CHECK (interval IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  last_processed_date DATE,
  next_process_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recurring transactions" ON public.recurring_transactions FOR SELECT
  USING ((type = 'personal' AND (select auth.uid()) = user_id) OR (type = 'shared' AND couple_id IN (SELECT id FROM public.couple_links WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid())) AND status = 'active')));
CREATE POLICY "Users can insert recurring transactions" ON public.recurring_transactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update recurring transactions" ON public.recurring_transactions FOR UPDATE
  USING (
    (select auth.uid()) = user_id
    OR (
      type = 'shared'
      AND couple_id IN (
        SELECT id FROM public.couple_links
        WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid()))
        AND status = 'active'
        AND shared_permission = 'read_write'
      )
    )
  );
CREATE POLICY "Users can delete recurring transactions" ON public.recurring_transactions FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR (
      type = 'shared'
      AND couple_id IN (
        SELECT id FROM public.couple_links
        WHERE (user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid()))
        AND status = 'active'
        AND shared_permission = 'read_write'
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_recurring_next_process ON public.recurring_transactions(next_process_date);
CREATE INDEX IF NOT EXISTS idx_recurring_user ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_couple ON public.recurring_transactions(couple_id) WHERE couple_id IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.recurring_transactions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Cron function to process recurring transactions
CREATE OR REPLACE FUNCTION public.process_recurring_transactions()
RETURNS void AS $$
DECLARE
  rec RECORD;
  new_next_date DATE;
  t_group_id UUID;
BEGIN
  FOR rec IN 
    SELECT * FROM public.recurring_transactions 
    WHERE next_process_date <= CURRENT_DATE 
      AND (end_date IS NULL OR next_process_date <= end_date)
  LOOP
    -- Calculate next date
    IF rec.interval = 'daily' THEN
      new_next_date := rec.next_process_date + interval '1 day';
    ELSIF rec.interval = 'weekly' THEN
      new_next_date := rec.next_process_date + interval '1 week';
    ELSIF rec.interval = 'monthly' THEN
      new_next_date := rec.next_process_date + interval '1 month';
    ELSIF rec.interval = 'yearly' THEN
      new_next_date := rec.next_process_date + interval '1 year';
    END IF;

    -- If it's a transfer
    IF rec.destination_account_id IS NOT NULL THEN
      t_group_id := uuid_generate_v4();
      
      -- Expense from source
      INSERT INTO public.transactions (
        user_id, couple_id, type, account_id, amount, description, category_id, date, transfer_group_id, is_recurring
      ) VALUES (
        rec.user_id, rec.couple_id, rec.type, rec.account_id, -abs(rec.amount), rec.description, rec.category_id, rec.next_process_date, t_group_id, true
      );

      -- Income to destination
      INSERT INTO public.transactions (
        user_id, couple_id, type, account_id, amount, description, category_id, date, transfer_group_id, is_recurring
      ) VALUES (
        rec.user_id, rec.couple_id, rec.type, rec.destination_account_id, abs(rec.amount), rec.description, rec.category_id, rec.next_process_date, t_group_id, true
      );
    ELSE
      -- Normal recurring income/expense
      INSERT INTO public.transactions (
        user_id, couple_id, type, account_id, amount, description, category_id, date, is_recurring
      ) VALUES (
        rec.user_id, rec.couple_id, rec.type, rec.account_id, rec.amount, rec.description, rec.category_id, rec.next_process_date, true
      );
    END IF;

    -- Update recurring transaction
    UPDATE public.recurring_transactions 
    SET last_processed_date = rec.next_process_date,
        next_process_date = new_next_date
    WHERE id = rec.id;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Schedule the cron job to run daily at 00:00 GMT
-- pg_cron uses standard cron syntax
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('process_recurring_transactions_job', '0 0 * * *', 'SELECT public.process_recurring_transactions()');
  END IF;
END
$$;
