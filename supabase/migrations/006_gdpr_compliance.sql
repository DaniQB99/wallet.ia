-- ==========================================
-- wallet.ia — Migration 006: GDPR/RGPD Compliance
-- Consent tracking, data export, account deletion
-- ==========================================

-- 1. User consent tracking table
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('privacy_policy', 'data_processing', 'terms_of_service')),
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  policy_version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_consent UNIQUE (user_id, consent_type, policy_version)
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON public.user_consents
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own consents" ON public.user_consents
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own consents" ON public.user_consents
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id);

-- 2. Account deletion requests
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Grace period: 30 days before actual deletion
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'processed'))
);

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests" ON public.deletion_requests
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create deletion request" ON public.deletion_requests
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can cancel deletion request" ON public.deletion_requests
  FOR UPDATE USING ((select auth.uid()) = user_id AND status = 'pending');

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON public.deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_pending ON public.deletion_requests(status, scheduled_for)
  WHERE status = 'pending';

-- 3. Data export function (GDPR Article 20 - Right to Data Portability)
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS JSONB AS $$
DECLARE
  uid UUID := (select auth.uid());
  result JSONB;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', uid,
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = uid),
    'accounts', COALESCE((SELECT jsonb_agg(row_to_json(a)) FROM public.accounts a WHERE a.user_id = uid), '[]'::jsonb),
    'categories', COALESCE((SELECT jsonb_agg(row_to_json(c)) FROM public.categories c WHERE c.user_id = uid), '[]'::jsonb),
    'transactions', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM public.transactions t WHERE t.user_id = uid), '[]'::jsonb),
    'goals', COALESCE((SELECT jsonb_agg(row_to_json(g)) FROM public.goals g WHERE g.user_id = uid), '[]'::jsonb),
    'notifications', COALESCE((SELECT jsonb_agg(row_to_json(n)) FROM public.notifications n WHERE n.user_id = uid), '[]'::jsonb),
    'consents', COALESCE((SELECT jsonb_agg(row_to_json(uc)) FROM public.user_consents uc WHERE uc.user_id = uid), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';
