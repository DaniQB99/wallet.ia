import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Category, CategoryScope } from "../types/database";

/**
 * Hook para la gestión de categorías de movimientos.
 *
 * Permite listar y administrar categorías (ingresos, gastos, ahorros).
 * Soporta filtrado por scope (personal/compartido) y sincronización
 * en tiempo real para mantener la consistencia entre usuarios de la pareja.
 */
export function useCategories(scope?: CategoryScope) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  /** Carga inicial y recarga de categorías */
  const fetch = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      let query = supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

      if (scope) {
        query = query.eq("scope", scope);
      }

      const { data, error } = await query;

      if (!error && data) {
        setCategories(data as Category[]);
      }
      setLoading(false);
    },
    [scope],
  );

  useEffect(() => {
    fetch();

    // Canal con ID único para evitar colisiones en Realtime
    const channelName = `categories-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        () => fetch(true),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch]);

  /** Crear una nueva categoría personalizada */
  const addCategory = useCallback(
    async (category: Partial<Category>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("categories").insert({
        ...category,
        user_id: user.id,
      });

      if (!error) fetch(true);
      return error;
    },
    [fetch],
  );

  /** Modificar una categoría existente */
  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      const { error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id);
      if (!error) fetch(true);
      return error;
    },
    [fetch],
  );

  /** Eliminar una categoría */
  const deleteCategory = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (!error) fetch(true);
      return error;
    },
    [fetch],
  );

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetch,
  };
}
