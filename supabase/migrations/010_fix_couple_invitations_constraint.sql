-- ==============================================================================
-- 010_fix_couple_invitations_constraint.sql
-- Fix check constraint on couple_invitations to support both 'accepted' (used by accept_invitation RPC)
-- and 'used' statuses alongside 'pending' and 'expired'.
-- ==============================================================================

ALTER TABLE public.couple_invitations 
  DROP CONSTRAINT IF EXISTS couple_invitations_status_check;

ALTER TABLE public.couple_invitations 
  ADD CONSTRAINT couple_invitations_status_check 
  CHECK (status IN ('pending', 'accepted', 'used', 'expired'));
