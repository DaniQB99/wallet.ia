import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/api/supabase';
import type { Category, CategoryScope } from '../../../shared/types/database';

export const CATEGORIES_QUERY_KEY = ['categories'];

export function useCategories(scope?: CategoryScope) {
  const queryClient = useQueryClient();

  const { data: allCategories, isLoading, error, refetch } = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (category: Partial<Category>) => {
      // Supabase RLS expects the user_id for personal categories, but we can rely on supabase logic
      // However, if we need to inject user_id, it is handled automatically if the RLS has default rules or we pass it
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...category, user_id: userId }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  // Filtrado local por scope
  const categories = allCategories
    ? scope 
      ? allCategories.filter((c) => c.scope === scope) 
      : allCategories
    : [];

  return {
    categories,
    loading: isLoading,
    error,
    addCategory: async (category: Partial<Category>) => {
      try {
        await addMutation.mutateAsync(category);
        return null; // Return null if success to match previous interface signature (Promise<Error | null>)
      } catch (err) {
        return err as Error;
      }
    },
    updateCategory: async (id: string, updates: Partial<Category>) => {
      try {
        await updateMutation.mutateAsync({ id, updates });
        return null;
      } catch (err) {
        return err as Error;
      }
    },
    deleteCategory: async (id: string) => {
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
