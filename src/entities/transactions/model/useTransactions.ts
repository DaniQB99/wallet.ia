import { useMemo } from "react";
import { useData } from "../../../app/providers/DataProvider";
import type { TransactionType } from "../../../shared/types/database";

/**
 * Hook para la gestión de transacciones (movimientos financieros).
 *
 * REFACTORIZADO: Ahora es un thin wrapper sobre DataProvider.
 * - Lee transactions del DataProvider (ya cargadas en memoria)
 * - Filtra por tipo localmente (instantáneo, sin query)
 * - Delega mutaciones al DataProvider (centralizado)
 * - NO crea suscripciones Realtime propias (DataProvider las gestiona)
 *
 * RESULTADO: Navegar a esta página es instantáneo porque no hay fetch.
 *
 * @param type Filtra por tipo de transacción: 'personal', 'shared' o 'all'.
 */
export function useTransactions(type: TransactionType | "all" = "personal") {
  const {
    transactions: allTransactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    invalidate,
  } = useData();

  // Filtrado local por tipo — instantáneo, sin query a BD
  const transactions = useMemo(() => {
    if (type === "all") return allTransactions;
    return allTransactions.filter((tx) => tx.type === type);
  }, [allTransactions, type]);

  return {
    transactions,
    loading: loading.transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: () => invalidate("transactions"),
  };
}
