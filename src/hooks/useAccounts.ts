import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Account } from "../types/database";

/**
 * Hook para la gestión de cuentas bancarias y saldos.
 *
 * Centraliza la lógica de visualización y manipulación de cuentas del usuario.
 * Utiliza Supabase Realtime para reflejar cambios en los saldos de forma instantánea
 * cuando se registran nuevas transacciones (gestado por triggers en base de datos).
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  /** Obtiene todas las cuentas accesibles por el usuario */
  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

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

    // Configuración de canal de escucha para cambios en la tabla 'accounts'
    const channelName = `accounts-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "accounts",
        },
        () => fetch(true),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch]);

  /** Crea una nueva cuenta bancaria o billetera */
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

      if (!error) fetch(true);
      return error;
    },
    [fetch],
  );

  /** Modifica los parámetros de una cuenta existente */
  const updateAccount = useCallback(
    async (id: string, updates: Partial<Account>) => {
      const { error } = await supabase
        .from("accounts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) fetch(true);
      return error;
    },
    [fetch],
  );

  /** Elimina una cuenta y toda su información relacionada */
  const deleteAccount = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("accounts").delete().eq("id", id);
        if (error) {
          console.error("Error deleting account:", error);
          return error;
        }
        fetch(true);
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
