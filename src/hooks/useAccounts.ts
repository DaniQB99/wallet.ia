import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Account } from "../types/database";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
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

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setAccounts(data as Account[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel("user-accounts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "accounts",
        },
        () => fetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch]);

  const addAccount = useCallback(
    async (account: Partial<Account>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("accounts").insert({
        ...account,
        user_id: user.id,
      });

      if (!error) fetch();
      return error;
    },
    [fetch],
  );

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Account>) => {
      const { error } = await supabase
        .from("accounts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) fetch();
      return error;
    },
    [fetch],
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("accounts").delete().eq("id", id);
        if (error) {
          console.error("Error deleting account:", error);
          return error;
        }
        fetch();
        return null;
      } catch (err) {
        console.error("Unexpected error deleting account:", err);
        return err;
      }
    },
    [fetch],
  );

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    refetch: fetch,
  };
}
