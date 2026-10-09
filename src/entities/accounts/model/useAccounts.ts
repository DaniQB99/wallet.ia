import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/api/supabase';
import type { Account } from '../../../shared/types/database';
import { broadcastTabSync } from '../../../shared/lib/useRealtimeSync';

export const ACCOUNTS_QUERY_KEY = ['accounts'];

export function useAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error, refetch } = useQuery({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Account[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (account: Partial<Account>) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const nextPosition = accounts.length > 0
        ? Math.max(...accounts.map(a => a.position ?? 0)) + 1
        : 0;

      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          ...account,
          position: account.position !== undefined ? account.position : nextPosition,
          user_id: userId,
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: ACCOUNTS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Account> }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: ACCOUNTS_QUERY_KEY });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedItems: { id: string; position: number }[]) => {
      const updates = orderedItems.map(({ id, position }) =>
        supabase
          .from('accounts')
          .update({ position })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
    },
    onMutate: async (orderedItems) => {
      await queryClient.cancelQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      const previousAccounts = queryClient.getQueryData<Account[]>(ACCOUNTS_QUERY_KEY);

      if (previousAccounts) {
        const posMap = new Map(orderedItems.map(item => [item.id, item.position]));
        const optimistic = [...previousAccounts].sort((a, b) => {
          const posA = posMap.get(a.id) ?? a.position ?? 0;
          const posB = posMap.get(b.id) ?? b.position ?? 0;
          return posA - posB;
        });
        queryClient.setQueryData(ACCOUNTS_QUERY_KEY, optimistic);
      }

      return { previousAccounts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(ACCOUNTS_QUERY_KEY, context.previousAccounts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: ACCOUNTS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: ACCOUNTS_QUERY_KEY });
    },
  });

  return {
    accounts,
    loading: isLoading,
    error,
    addAccount: async (account: Partial<Account>) => {
      try {
        await addMutation.mutateAsync(account);
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    updateAccount: async (id: string, updates: Partial<Account>) => {
      try {
        await updateMutation.mutateAsync({ id, updates });
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    reorderAccounts: async (orderedAccounts: Account[]) => {
      try {
        const payload = orderedAccounts.map((acc, index) => ({
          id: acc.id,
          position: index,
        }));
        await reorderMutation.mutateAsync(payload);
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    deleteAccount: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    refetch,
  };
}
