-- Migration 007: Refactor goals to budgets with multiple categories

-- 1. Create goal_categories table
CREATE TABLE IF NOT EXISTS public.goal_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  target_amount DECIMAL(12,2) NOT NULL CONSTRAINT goal_categories_target_amount_positive CHECK (target_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, category_id)
);

-- 2. RLS for goal_categories
ALTER TABLE public.goal_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and shared goal categories" ON public.goal_categories FOR SELECT
  USING (goal_id IN (SELECT id FROM public.goals));

CREATE POLICY "Users can insert goal categories" ON public.goal_categories FOR INSERT
  WITH CHECK (goal_id IN (SELECT id FROM public.goals));

CREATE POLICY "Users can update goal categories" ON public.goal_categories FOR UPDATE
  USING (goal_id IN (SELECT id FROM public.goals));

CREATE POLICY "Users can delete goal categories" ON public.goal_categories FOR DELETE
  USING (goal_id IN (SELECT id FROM public.goals));

CREATE INDEX IF NOT EXISTS idx_goal_categories_goal_id ON public.goal_categories(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_categories_category_id ON public.goal_categories(category_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.goal_categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_categories;

-- 3. Modify public.goals
-- Drop constraints
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_target_amount_positive;
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_current_amount_non_negative;

-- Make target and current amounts nullable as they are now computed or not used at the root level
ALTER TABLE public.goals ALTER COLUMN target_amount DROP NOT NULL;
ALTER TABLE public.goals ALTER COLUMN current_amount DROP NOT NULL;
ALTER TABLE public.goals ALTER COLUMN category_id DROP NOT NULL;

-- 4. Update the export function
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS JSONB AS $$
DECLARE
  uid UUID := (select auth.uid());
  result JSONB;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', uid,
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = uid),
    'accounts', COALESCE((SELECT jsonb_agg(row_to_json(a)) FROM public.accounts a WHERE a.user_id = uid), '[]'::jsonb),
    'categories', COALESCE((SELECT jsonb_agg(row_to_json(c)) FROM public.categories c WHERE c.user_id = uid), '[]'::jsonb),
    'transactions', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM public.transactions t WHERE t.user_id = uid), '[]'::jsonb),
    'goals', COALESCE((SELECT jsonb_agg(row_to_json(g)) FROM public.goals g WHERE g.user_id = uid), '[]'::jsonb),
    'goal_categories', COALESCE((SELECT jsonb_agg(row_to_json(gc)) FROM public.goal_categories gc JOIN public.goals g ON g.id = gc.goal_id WHERE g.user_id = uid), '[]'::jsonb),
    'notifications', COALESCE((SELECT jsonb_agg(row_to_json(n)) FROM public.notifications n WHERE n.user_id = uid), '[]'::jsonb),
    'consents', COALESCE((SELECT jsonb_agg(row_to_json(uc)) FROM public.user_consents uc WHERE uc.user_id = uid), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
