import { useData } from "../contexts/DataProvider";
import type { Account } from "../types/database";

/**
 * Hook para la gestión de cuentas bancarias y saldos.
 *
 * REFACTORIZADO: Thin wrapper sobre DataProvider.
 * - Lee accounts del DataProvider (ya en memoria)
 * - Delega mutaciones al DataProvider
 * - Sin suscripciones Realtime propias
 */
export function useAccounts() {
  const {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    invalidate,
  } = useData();

  return {
    accounts,
    loading: loading.accounts,
    addAccount: async (account: Partial<Account>) => {
      const error = await addAccount(account);
      return error;
    },
    updateAccount: async (id: string, updates: Partial<Account>) => {
      const error = await updateAccount(id, updates);
      return error;
    },
    deleteAccount: async (id: string) => {
      const error = await deleteAccount(id);
      return error;
    },
    refetch: () => invalidate("accounts"),
  };
}
