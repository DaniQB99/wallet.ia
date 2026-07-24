-- ==========================================
-- wallet.ia — Migration 008: Scalability Optimization
-- Optimizes Realtime, adds partial indexes, prepares for growth
-- ==========================================

-- 1. Remove static/rarely-changing tables from Realtime
-- shared_categories is seed data — never changes at runtime
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.shared_categories;

-- 2. Composite index for transaction analytics queries
-- Covers: monthly breakdown by user, category grouping, date range filtering
CREATE INDEX IF NOT EXISTS idx_transactions_analytics
  ON public.transactions(user_id, date DESC, category_id);

-- 3. Covering index for the most common transaction query pattern
-- (the DataProvider SELECT with category and account JOINs)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_covering
  ON public.transactions(user_id, date DESC)
  INCLUDE (amount, type, category_id, account_id, description);

-- 4. Partial index for active couple links (used in EVERY shared data query)
-- The existing idx_couple_links_active covers (user_a_id, user_b_id) WHERE active
-- Add reverse lookup index
CREATE INDEX IF NOT EXISTS idx_couple_links_active_reverse
  ON public.couple_links(user_b_id, user_a_id) WHERE status = 'active';

-- 5. Partial index for pending deletion requests (admin/cron job query)
CREATE INDEX IF NOT EXISTS idx_deletion_pending
  ON public.deletion_requests(scheduled_for)
  WHERE status = 'pending';
