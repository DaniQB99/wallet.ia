-- 1. Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Setup RLS for storage.objects
-- Allow public viewing of avatars
CREATE POLICY "Avatar images are publicly accessible." 
  ON storage.objects FOR SELECT 
  USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatars." 
  ON storage.objects FOR INSERT 
  WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatars." 
  ON storage.objects FOR UPDATE 
  USING ( auth.uid() = owner )
  WITH CHECK ( bucket_id = 'avatars' );

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatars." 
  ON storage.objects FOR DELETE 
  USING ( auth.uid() = owner );

-- 3. Update the handle_new_user trigger function to include avatar_url
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.accounts (user_id, name, balance, icon, color)
  VALUES (NEW.id, 'Efectivo principal', 0, '💵', '#10B981') RETURNING id INTO default_account_id;

  INSERT INTO public.categories (user_id, name, icon, color, scope) VALUES
  (NEW.id, 'Ocio', '🍺', '#F59E0B', 'personal'),
  (NEW.id, 'Comida', '🍔', '#EF4444', 'personal'),
  (NEW.id, 'Transporte', '🚌', '#3B82F6', 'personal'),
  (NEW.id, 'Compras', '🛍️', '#EC4899', 'personal'),
  (NEW.id, 'Suscripciones', '📱', '#8B5CF6', 'personal'),
  (NEW.id, 'Hogar', '🏠', '#6366F1', 'shared'),
  (NEW.id, 'Supermercado', '🛒', '#10B981', 'shared'),
  (NEW.id, 'Servicios', '💡', '#F59E0B', 'shared'),
  (NEW.id, 'Transporte', '🚗', '#3B82F6', 'shared');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 4. Retroactively apply avatar_url from Google auth metadata to existing profiles if null
UPDATE public.profiles p
SET avatar_url = u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE p.id = u.id 
  AND p.avatar_url IS NULL 
  AND u.raw_user_meta_data->>'avatar_url' IS NOT NULL;
