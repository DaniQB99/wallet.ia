-- Allow users to update partner's shared categories
CREATE POLICY "Users can update partner shared categories" ON public.categories FOR UPDATE
  USING (
    scope = 'shared' AND EXISTS (
      SELECT 1 FROM public.couple_links cl
      WHERE cl.status = 'active' AND ((cl.user_a_id = (select auth.uid()) AND cl.user_b_id = categories.user_id) OR (cl.user_b_id = (select auth.uid()) AND cl.user_a_id = categories.user_id))
    )
  );

-- Allow users to delete partner's shared categories
CREATE POLICY "Users can delete partner shared categories" ON public.categories FOR DELETE
  USING (
    scope = 'shared' AND EXISTS (
      SELECT 1 FROM public.couple_links cl
      WHERE cl.status = 'active' AND ((cl.user_a_id = (select auth.uid()) AND cl.user_b_id = categories.user_id) OR (cl.user_b_id = (select auth.uid()) AND cl.user_a_id = categories.user_id))
    )
  );

-- Prevenir categorías duplicadas por usuario y ámbito (case insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_scope_name_idx 
  ON public.categories (user_id, scope, lower(name));
