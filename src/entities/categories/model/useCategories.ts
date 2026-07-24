import { useMemo } from "react";
import { useData } from "../../../app/providers/DataProvider";
import type { Category, CategoryScope } from "../../../shared/types/database";

/**
 * Hook para la gestión de categorías de movimientos.
 *
 * REFACTORIZADO: Thin wrapper sobre DataProvider.
 * - Lee categories del DataProvider (ya en memoria)
 * - Filtra por scope localmente (instantáneo)
 * - Delega mutaciones al DataProvider
 * - Sin suscripciones Realtime propias
 */
export function useCategories(scope?: CategoryScope) {
  const {
    categories: allCategories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    invalidate,
  } = useData();

  // Filtrado local por scope — instantáneo
  const categories = useMemo(() => {
    if (!scope) return allCategories;
    return allCategories.filter((c) => c.scope === scope);
  }, [allCategories, scope]);

  return {
    categories,
    loading: loading.categories,
    addCategory: async (category: Partial<Category>) => {
      const error = await addCategory(category);
      return error;
    },
    updateCategory: async (id: string, updates: Partial<Category>) => {
      const error = await updateCategory(id, updates);
      return error;
    },
    deleteCategory: async (id: string) => {
      const error = await deleteCategory(id);
      return error;
    },
    refetch: () => invalidate("categories"),
  };
}
