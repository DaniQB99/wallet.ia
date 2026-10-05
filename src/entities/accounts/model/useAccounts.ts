import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/api/supabase';
import type { Account } from '../../../shared/types/database';

export const ACCOUNTS_QUERY_KEY = ['accounts'];

export function useAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error, refetch } = useQuery({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Account[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (account: Partial<Account>) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data, error } = await supabase
        .from('accounts')
        .insert([{ ...account, user_id: userId }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
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
