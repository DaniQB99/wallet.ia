import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Category, CategoryScope } from "../types/database";

export function useCategories(scope?: CategoryScope) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

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
  }, [scope]);

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel("user-categories")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        () => fetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch]);

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

      if (!error) fetch();
      return error;
    },
    [fetch],
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      const { error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id);
      if (!error) fetch();
      return error;
    },
    [fetch],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (!error) fetch();
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
