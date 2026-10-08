-- Migration 016: Fix default unicode emojis and decouple automatic card creation
-- 1. Updates handle_new_user to use real UTF-8 emojis for categories
-- 2. Removes automatic account creation so new users are guided by CreateAccountWizardModal
-- 3. Sanitizes existing corrupted unicode escape sequences in categories and accounts

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_name text;
  v_avatar text;
BEGIN
  v_name := COALESCE(
    NULLIF(left(btrim(COALESCE(NEW.raw_user_meta_data->>'display_name',
                               split_part(COALESCE(NEW.email, ''), '@', 1))), 100), ''),
    ''
  );

  v_avatar := NEW.raw_user_meta_data->>'avatar_url';
  IF v_avatar IS NOT NULL AND (
       char_length(v_avatar) > 2048
       OR v_avatar !~* '^https://([a-z0-9-]+\.)*(googleusercontent\.com|supabase\.co)(/|$)'
     ) THEN
    v_avatar := NULL;
  END IF;

  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, v_name, v_avatar)
  ON CONFLICT (id) DO NOTHING;

  -- Default categories with real UTF-8 emojis
  INSERT INTO public.categories (user_id, name, icon, color, scope) VALUES
    (NEW.id, 'Ocio',          '🍺',  '#F59E0B', 'personal'),
    (NEW.id, 'Comida',        '🍔',  '#EF4444', 'personal'),
    (NEW.id, 'Transporte',    '🚌',  '#3B82F6', 'personal'),
    (NEW.id, 'Compras',       '🛍️',  '#EC4899', 'personal'),
    (NEW.id, 'Suscripciones', '📱',  '#8B5CF6', 'personal'),
    (NEW.id, 'Hogar',         '🏠',  '#6366F1', 'shared'),
    (NEW.id, 'Supermercado',  '🛒',  '#10B981', 'shared'),
    (NEW.id, 'Servicios',     '💡',  '#F59E0B', 'shared'),
    (NEW.id, 'Transporte',    '🚗',  '#3B82F6', 'shared')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END $function$;

-- Sanitize any corrupted escape sequences in existing accounts and categories
UPDATE public.accounts
SET icon = '💵'
WHERE icon LIKE '%\U0001F4B5%' OR icon LIKE '%\\U0001F4B5%';

UPDATE public.categories SET icon = '🍺' WHERE icon LIKE '%\U0001F37A%' OR icon LIKE '%\\U0001F37A%';
UPDATE public.categories SET icon = '🍔' WHERE icon LIKE '%\U0001F354%' OR icon LIKE '%\\U0001F354%';
UPDATE public.categories SET icon = '🚌' WHERE icon LIKE '%\U0001F68C%' OR icon LIKE '%\\U0001F68C%';
UPDATE public.categories SET icon = '🛍️' WHERE icon LIKE '%\U0001F6CD%' OR icon LIKE '%\\U0001F6CD%';
UPDATE public.categories SET icon = '📱' WHERE icon LIKE '%\U0001F4F1%' OR icon LIKE '%\\U0001F4F1%';
UPDATE public.categories SET icon = '🏠' WHERE icon LIKE '%\U0001F3E0%' OR icon LIKE '%\\U0001F3E0%';
UPDATE public.categories SET icon = '🛒' WHERE icon LIKE '%\U0001F6D2%' OR icon LIKE '%\\U0001F6D2%';
UPDATE public.categories SET icon = '💡' WHERE icon LIKE '%\U0001F4A1%' OR icon LIKE '%\\U0001F4A1%';
UPDATE public.categories SET icon = '🚗' WHERE icon LIKE '%\U0001F697%' OR icon LIKE '%\\U0001F697%';
