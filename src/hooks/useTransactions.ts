import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Transaction, TransactionType } from "../types/database";

export function useTransactions(type: TransactionType | "all" = "personal") {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("transactions")
      .select("*, category:categories(*), account:accounts(*)")
      .order("date", { ascending: false });

    if (type !== "all") {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  }, [type]);

  useEffect(() => {
    fetch();

    // Realtime subscription for shared transactions or all
    if (type === "shared" || type === "all") {
      const channel = supabase
        .channel("shared-transactions")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transactions",
            filter: type === "shared" ? `type=eq.shared` : undefined,
          },
          () => fetch(),
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [type, fetch]);

  const addTransaction = useCallback(
    async (tx: Partial<Transaction>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("transactions").insert({
        ...tx,
        user_id: user.id,
      });

      if (!error) fetch();
      return error;
    },
    [fetch],
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id);
      if (!error) fetch();
      return error;
    },
    [fetch],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (!error) fetch();
      return error;
    },
    [fetch],
  );

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetch,
  };
}
