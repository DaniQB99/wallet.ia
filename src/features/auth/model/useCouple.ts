import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/api/supabase';
import type { CoupleLink, UserProfile } from '../../../shared/types/database';
import { useAuthContext } from '../../../app/providers/AuthContext';

export const COUPLE_QUERY_KEY = ['couple'];

export function useCouple() {
  const { user } = useAuthContext();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [...COUPLE_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: coupleData } = await supabase
        .from('couple_links')
        .select('*')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .eq('status', 'active')
        .maybeSingle();

      if (!coupleData) return { couple: null, partner: null };

      const partnerId = coupleData.user_a_id === userId ? coupleData.user_b_id : coupleData.user_a_id;
      
      const { data: partnerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single();

      return {
        couple: coupleData as CoupleLink,
        partner: partnerData as UserProfile,
      };
    },
  });

  const couple = data?.couple ?? null;
  const partner = data?.partner ?? null;

  const generateInvite = async () => {
    const { data, error } = await supabase.rpc('generate_invite_code');
    if (error) return null;
    return data;
  };

  const acceptInviteMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('accept_invite', { invite_code: code });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPLE_QUERY_KEY });
    },
  });

  const unlinkCoupleMutation = useMutation({
    mutationFn: async () => {
      if (!couple) return;
      const { error } = await supabase.from('couple_links').delete().eq('id', couple.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPLE_QUERY_KEY });
    },
  });

  const togglePermissionMutation = useMutation({
    mutationFn: async () => {
      if (!couple) return;
      const newPerm = couple.shared_permission === 'read_write' ? 'read_only' : 'read_write';
      const { error } = await supabase
        .from('couple_links')
        .update({ shared_permission: newPerm })
        .eq('id', couple.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPLE_QUERY_KEY });
    },
  });

  return {
    couple,
    partner,
    loading: isLoading,
    error,
    generateInvite,
    acceptInvite: async (code: string) => {
      try {
        await acceptInviteMutation.mutateAsync(code);
        return { error: null };
      } catch (err: any) {
        return { error: err.message };
      }
    },
    unlinkCouple: async () => {
      try {
        await unlinkCoupleMutation.mutateAsync();
      } catch (err) {
        console.error(err);
      }
    },
    togglePermission: async () => {
      try {
        await togglePermissionMutation.mutateAsync();
      } catch (err) {
        console.error(err);
      }
    },
  };
}
