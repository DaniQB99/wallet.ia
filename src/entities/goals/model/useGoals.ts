import { useMemo } from "react";
import { useData } from "../../../app/providers/DataProvider";
import type { Goal, GoalCategory } from "../../../shared/types/database";

export function useGoals(scope: 'personal' | 'shared') {
  const {
    goals: allGoals,
    transactions,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    addGoalCategory,
    removeGoalCategory,
    updateGoalCategory,
  } = useData();

  const goals = useMemo(() => {
    const filtered = allGoals.filter((g) => g.type === scope);

    return filtered.map((g: Goal) => {
      let totalTarget = 0;
      let totalCurrent = 0;

      const computedCategories = (g.goal_categories || []).map((gc) => {
        const currentAmount = transactions.reduce((sum, tx) => {
          const isCategoryMatch = tx.category_id === gc.category_id && tx.type === g.type;
          const isAfterStart = !g.start_date || tx.date >= g.start_date;
          const isBeforeEnd = !g.deadline || tx.date <= g.deadline;

          if (isCategoryMatch && isAfterStart && isBeforeEnd) {
            if (g.goal_type === 'budget' && tx.amount < 0) {
              return sum + Math.abs(Number(tx.amount));
            } else if (g.goal_type === 'savings' && tx.amount > 0) {
              return sum + Number(tx.amount);
            }
          }
          return sum;
        }, 0);

        totalTarget += Number(gc.target_amount || 0);
        totalCurrent += currentAmount;

        return {
          ...gc,
          current_amount: currentAmount,
        } as GoalCategory & { current_amount: number };
      });

      return {
        ...g,
        target_amount: totalTarget > 0 ? totalTarget : (g.target_amount || 0),
        current_amount: totalCurrent,
        goal_categories: computedCategories,
      };
    });
  }, [allGoals, transactions, scope]);

  return {
    goals,
    loading: loading.goals || loading.transactions,
    error: null,
    addGoal,
    updateGoal,
    deleteGoal,
    addGoalCategory,
    removeGoalCategory,
    updateGoalCategory,
  };
}
