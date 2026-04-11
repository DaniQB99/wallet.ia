import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Transaction, TransactionType } from "../types/database";

/**
 * Hook para la gestión de transacciones (movimientos financieros).
 *
 * Implementa un patrón de sincronización híbrido:
 * 1. Carga inicial de datos mediante REST.
 * 2. Suscripción en tiempo real mediante WebSockets (Supabase Realtime) para actualizaciones instantáneas.
 * 3. Refetch silencioso para minimizar el parpadeo de la UI.
 *
 * @param type Filtra por tipo de transacción: 'personal', 'shared' o 'all'.
 */
export function useTransactions(type: TransactionType | "all" = "personal") {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Obtiene la lista de transacciones desde la base de datos.
   * @param silent Si es true, no activa el estado de carga global (spinner).
   */
  const fetch = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      // Construcción de la consulta con JOINs para obtener categorías y cuentas
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
    },
    [type],
  );

  useEffect(() => {
    fetch();

    /**
     * Suscripción Realtime.
     * Generamos un nombre de canal único para evitar conflictos de suscripción
     * cuando múltiples componentes usan este hook simultáneamente.
     */
    const channelName = `transactions-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => fetch(true), // Actualización silenciosa ante cambios externos
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, fetch]);

  /** Registra un nuevo movimiento financiero */
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

      if (!error) fetch(true);
      return error;
    },
    [fetch],
  );

  /** Actualiza una transacción existente */
  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id);
      if (!error) fetch(true);
      return error;
    },
    [fetch],
  );

  /** Elimina un movimiento de la base de datos */
  const deleteTransaction = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (!error) fetch(true);
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
