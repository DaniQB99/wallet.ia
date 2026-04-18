import { useMemo } from "react";
import type { Transaction } from "../types/database";
import { useAuthContext } from "../contexts/AuthContext";

/**
 * Hook personalizado para extraer y calcular estadísticas de las transacciones para el Dashboard.
 * Diferencia entre cuentas personales y compartidas, determinando la contribución tuya y de tu pareja,
 * proveyendo a su vez de un desglose por cada categoría de los movimientos operados.
 *
 * @param transactions - El arreglo que contiene todo el historial de transacciones a examinar.
 * @returns Las estadísticas procesadas: total compartido, contribución propia, de pareja, total personal y desglose de las categorías.
 */
export function useDashboardStats(transactions: Transaction[]) {
  const { user } = useAuthContext();

  return useMemo(() => {
    let totalShared = 0;
    let myContribution = 0;
    let partnerContribution = 0;
    let personalTotal = 0;

    const categoryMap = new Map<
      string,
      { name: string; icon: string; color: string; total: number }
    >();

    transactions.forEach((tx) => {
      const amount = Number(tx.amount);

      if (tx.type === "shared") {
        totalShared += amount;

        if (tx.user_id === user?.id) {
          myContribution += amount;
        } else {
          partnerContribution += amount;
        }

        // Group by category for breakdown
        if (tx.category) {
          const { id, name, icon, color } = tx.category;
          const existing = categoryMap.get(id);
          if (existing) {
            existing.total += amount;
          } else {
            categoryMap.set(id, { name, icon, color, total: amount });
          }
        }
      } else if (tx.type === "personal") {
        if (tx.user_id === user?.id) {
          personalTotal += amount;
        }
      }
    });

    // Convert map to array and sort by absolute total descending
    const categoryBreakdown = Array.from(categoryMap.values()).sort(
      (a, b) => Math.abs(b.total) - Math.abs(a.total),
    );

    return {
      totalShared,
      myContribution,
      partnerContribution,
      personalTotal,
      categoryBreakdown,
    };
  }, [transactions, user]);
}
