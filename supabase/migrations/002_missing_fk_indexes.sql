-- ==========================================
-- wallet.ia — Migration 002: Missing Foreign Key Indexes
-- Postgres does NOT auto-index FK columns.
-- Missing indexes cause full table scans on JOINs and CASCADE ops.
-- Impact: 10-100x faster JOINs and RLS evaluation
-- ==========================================

-- accounts.user_id — used in every RLS policy + JOINs
CREATE INDEX IF NOT EXISTS idx_accounts_user_id
  ON public.accounts(user_id);

-- accounts.couple_id — used in shared account RLS checks
CREATE INDEX IF NOT EXISTS idx_accounts_couple_id
  ON public.accounts(couple_id) WHERE couple_id IS NOT NULL;

-- categories.user_id — used in every category RLS policy
-- Note: idx_categories_user_scope from migration_performance.sql covers (user_id, scope)
-- but a standalone user_id index is still needed for simple lookups
CREATE INDEX IF NOT EXISTS idx_categories_user_id
  ON public.categories(user_id);

-- transactions.account_id — used in balance trigger SUM + JOINs
CREATE INDEX IF NOT EXISTS idx_transactions_account_id
  ON public.transactions(account_id);

-- transactions.category_id — used in goal progress calculation + JOINs
-- Note: idx_transactions_category_type from migration_performance.sql covers (category_id, type)
-- but standalone index helps the FK cascade
CREATE INDEX IF NOT EXISTS idx_transactions_category_id
  ON public.transactions(category_id) WHERE category_id IS NOT NULL;

-- goals.user_id — used in every goal RLS policy
-- Note: idx_goals_user_type from migration_performance.sql covers (user_id, type)
-- but standalone index helps FK cascade on user deletion
CREATE INDEX IF NOT EXISTS idx_goals_user_id
  ON public.goals(user_id);

-- goals.category_id — used in category-based goal queries
CREATE INDEX IF NOT EXISTS idx_goals_category_id
  ON public.goals(category_id) WHERE category_id IS NOT NULL;

-- couple_invitations.inviter_id — used in invitation RLS policies
CREATE INDEX IF NOT EXISTS idx_couple_invitations_inviter
  ON public.couple_invitations(inviter_id);
