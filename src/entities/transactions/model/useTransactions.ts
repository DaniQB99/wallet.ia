import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/api/supabase';
import type { Transaction, TransactionType } from '../../../shared/types/database';
import { useAuthContext } from '../../../app/providers/AuthContext';
import { useMemo } from 'react';

export const TRANSACTIONS_QUERY_KEY = ['transactions'];

export function useTransactions(type: TransactionType | 'all' = 'personal') {
  const { user } = useAuthContext();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data: allTransactions = [], isLoading, error, refetch } = useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      // First, find if there is a couple linked
      const { data: coupleLink } = await supabase
        .from('couple_links')
        .select('user_a_id, user_b_id')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .eq('status', 'active')
        .maybeSingle();

      let query = supabase
        .from('transactions')
        .select('*, category:categories(*), account:accounts(*)')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000); // Increased limit since there is no infinite scroll UI yet

      if (coupleLink) {
        // If part of a couple, fetch transactions for both users
        const partnerId = coupleLink.user_a_id === userId ? coupleLink.user_b_id : coupleLink.user_a_id;
        query = query.in('user_id', [userId, partnerId]);
      } else {
        // Just the user's own
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Transaction[];
    },
  });

  const transactions = useMemo(() => {
    if (type === 'all') return allTransactions;
    return allTransactions.filter((tx) => tx.type === type);
  }, [allTransactions, type]);

  const addMutation = useMutation({
    mutationFn: async (tx: Partial<Transaction> | Partial<Transaction>[]) => {
      if (!userId) throw new Error('Not authenticated');
      
      const insertData = Array.isArray(tx) 
        ? tx.map(t => ({ ...t, user_id: userId }))
        : { ...tx, user_id: userId };
        
      const { data, error } = await supabase.from('transactions').insert(insertData as any).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const addRecurringMutation = useMutation({
    mutationFn: async (tx: any) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('recurring_transactions').insert({ ...tx, user_id: userId }).select();
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  return {
    transactions,
    loading: isLoading,
    error,
    addTransaction: async (tx: Partial<Transaction> | Partial<Transaction>[]) => {
      try {
        await addMutation.mutateAsync(tx);
        return null;
      } catch (err: any) {
        return err as Error;
      }
    },
    addRecurringTransaction: async (tx: any) => {
      try {
        await addRecurringMutation.mutateAsync(tx);
        return null;
      } catch (err: any) {
        return err as Error;
      }
    },
    updateTransaction: async (id: string, updates: Partial<Transaction>) => {
      try {
        await updateMutation.mutateAsync({ id, updates });
        return null;
      } catch (err: any) {
        return err as Error;
      }
    },
    deleteTransaction: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return null;
      } catch (err: any) {
        return err as Error;
      }
    },
    refetch,
  };
}
