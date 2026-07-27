import { useMemo } from "react";
import { useData } from "../../../app/providers/DataProvider";
import type { Goal, GoalType } from "../../../shared/types/database";

/**
 * Hook para la gestión de metas financieras (ahorro o gastos).
 *
 * REFACTORIZADO: Antes hacía 2 queries en cascada:
 * 1. SELECT * FROM goals
 * 2. SELECT * FROM transactions (SIN FILTRO — todas las transacciones)
 * Luego calculaba current_amount en JS iterando O(goals × transactions).
 *
 * AHORA:
 * - Lee goals y transactions del DataProvider (ya en memoria)
 * - Calcula current_amount en memoria (instantáneo con datos cacheados)
 * - Sin queries adicionales, sin suscripciones propias
 *
 * RESULTADO: De ~2-3 segundos → instantáneo.
 */
export function useGoals(type: GoalType) {
  const {
    goals: allGoals,
    transactions,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useData();

  // Filtrar goals por tipo y calcular current_amount usando las transactions en memoria
  const goals = useMemo(() => {
    const filtered = allGoals.filter((g) => g.type === type);

    return filtered.map((g: Goal) => {
      // Calcular current_amount sumando las transacciones que coinciden
      const currentAmount = transactions.reduce((sum: number, tx) => {
        const isGoalMatch = tx.goal_id === g.id;
        const isCategoryMatch =
          g.category_id &&
          tx.category_id === g.category_id &&
          tx.type === g.type;

        // Solo contar si la fecha es >= start_date de la meta (si está definida)
        const isDateMatch = !g.start_date || tx.date >= g.start_date;

        if ((isGoalMatch || isCategoryMatch) && isDateMatch) {
          return sum + Number(tx.amount);
        }
        return sum;
      }, 0);

      return {
        ...g,
        current_amount: currentAmount || 0,
      };
    });
  }, [allGoals, transactions, type]);

  return {
    goals,
    loading: loading.goals || loading.transactions,
    error: null,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}
