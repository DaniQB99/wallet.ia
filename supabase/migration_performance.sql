-- ==========================================
-- wallet.ia — Performance Optimization Migration
-- Adds indices for common query patterns and
-- a view for efficient goal progress calculation.
-- ==========================================

-- 1. Índice para búsqueda de goals con category matching
-- Usado por useGoals al calcular current_amount por categoría
CREATE INDEX IF NOT EXISTS idx_transactions_category_type 
  ON public.transactions(category_id, type);

-- 2. Índice para notifications del usuario con filtro de lectura
-- Acelera la query de notificaciones no leídas en el badge
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, is_read);

-- 3. Índice para goals del usuario filtrado por tipo
-- Acelera la carga de metas personales vs compartidas
CREATE INDEX IF NOT EXISTS idx_goals_user_type
  ON public.goals(user_id, type);

-- 4. Índice para categories por usuario y scope
-- Acelera el filtrado de categorías por personal/shared
CREATE INDEX IF NOT EXISTS idx_categories_user_scope
  ON public.categories(user_id, scope);

-- 5. Índice para couple_links activos
-- Acelera la búsqueda de pareja activa (usado en casi todas las páginas)
CREATE INDEX IF NOT EXISTS idx_couple_links_active
  ON public.couple_links(user_a_id, user_b_id) WHERE status = 'active';
