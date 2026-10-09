import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/api/supabase';
import type { Goal, GoalCategory } from '../../../shared/types/database';
import { useTransactions } from '../../transactions/model/useTransactions';
import { broadcastTabSync } from '../../../shared/lib/useRealtimeSync';

export const GOALS_QUERY_KEY = ['goals'];

export function useGoals(scope: 'personal' | 'shared') {
  const queryClient = useQueryClient();
  const { transactions, loading: loadingTx } = useTransactions(scope);

  const { data: allGoals = [], isLoading: loadingGoals, error, refetch } = useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*, goal_categories(*, category:categories(*))');

      if (error) throw error;
      return data as Goal[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'current_amount' | 'created_by' | 'couple_id'>) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      let couple_id = null;
      if (goal.type === 'shared') {
        const { data: coupleLink } = await supabase
          .from('couple_links')
          .select('id')
          .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
          .eq('status', 'active')
          .single();
        couple_id = coupleLink?.id;
      }

      const { data, error } = await supabase
        .from('goals')
        .insert([{ ...goal, created_by: userId, user_id: userId, couple_id }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: GOALS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: GOALS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: GOALS_QUERY_KEY });
    },
  });

  const addGoalCategoryMutation = useMutation({
    mutationFn: async (goalCategory: { goal_id: string; category_id: string; target_amount: number }) => {
      const { error } = await supabase.from('goal_categories').insert([goalCategory]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: GOALS_QUERY_KEY });
    },
  });

  const removeGoalCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goal_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: GOALS_QUERY_KEY });
    },
  });

  const updateGoalCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { target_amount: number } }) => {
      const { error } = await supabase.from('goal_categories').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: GOALS_QUERY_KEY });
    },
  });

  const goals = useMemo(() => {
    const filtered = allGoals.filter((g) => g.type === scope);

    return filtered.map((g: Goal) => {
      let totalTarget = 0;
      let totalCurrent = 0;

      const computedCategories = (g.goal_categories || []).map((gc) => {
        const currentAmount = transactions.reduce((sum, tx) => {
          const isCategoryMatch = tx.category_id === gc.category_id && tx.type === g.type;
          const isAfterStart = !g.start_date || tx.date >= g.start_date;
          const isBeforeEnd = !g.deadline || tx.date <= g.deadline;

          if (isCategoryMatch && isAfterStart && isBeforeEnd) {
            if (g.goal_type === 'budget' && tx.amount < 0) {
              return sum + Math.abs(Number(tx.amount));
            } else if (g.goal_type === 'savings' && tx.amount > 0) {
              return sum + Number(tx.amount);
            }
          }
          return sum;
        }, 0);

        totalTarget += Number(gc.target_amount || 0);
        totalCurrent += currentAmount;

        return {
          ...gc,
          current_amount: currentAmount,
        } as GoalCategory & { current_amount: number };
      });

      return {
        ...g,
        target_amount: totalTarget > 0 ? totalTarget : (g.target_amount || 0),
        current_amount: totalCurrent,
        goal_categories: computedCategories,
      };
    });
  }, [allGoals, transactions, scope]);

  return {
    goals,
    loading: loadingGoals || loadingTx,
    error,
    addGoal: async (goal: any) => {
      try {
        await addMutation.mutateAsync(goal);
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    updateGoal: async (id: string, updates: Partial<Goal>) => {
      try {
        await updateMutation.mutateAsync({ id, updates });
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    deleteGoal: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    addGoalCategory: async (gc: any) => {
      try {
        await addGoalCategoryMutation.mutateAsync(gc);
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    removeGoalCategory: async (id: string) => {
      try {
        await removeGoalCategoryMutation.mutateAsync(id);
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    updateGoalCategory: async (id: string, updates: { target_amount: number }) => {
      try {
        await updateGoalCategoryMutation.mutateAsync({ id, updates });
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    refetch,
  };
}
