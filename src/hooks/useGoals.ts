import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../contexts/AuthContext";
import type { Goal, GoalType } from "../types/database";

export function useGoals(type: GoalType) {
  const { user } = useAuthContext();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchGoals = async () => {
      setLoading(true);
      try {
        let query = supabase.from("goals").select(`*`).eq("type", type);

        if (type === "personal") {
          query = query.eq("user_id", user.id);
        } else {
          // Shared goals are protected by RLS
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        // Calculate current_amount for each goal
        if (data && data.length > 0) {
          // Fetch transactions that match either goal_id OR (type match AND category_id match)
          let txQuery = supabase
            .from("transactions")
            .select("goal_id, category_id, amount, type, date");

          const { data: txData, error: txError } = await txQuery;

          if (txError) throw txError;

          const updatedGoals = data.map((g: Goal) => {
            // Sum transactions that:
            // 1. Have this goal_id explicitly
            // 2. OR match this category_id AND the type (personal/shared) matches
            const currentAmount = txData?.reduce((sum: number, tx: any) => {
              const isGoalMatch = tx.goal_id === g.id;
              const isCategoryMatch =
                g.category_id &&
                tx.category_id === g.category_id &&
                tx.type === g.type;

              // Only count if date is newer or equal to goal start date
              const isDateMatch = tx.date >= g.start_date;

              if ((isGoalMatch || isCategoryMatch) && isDateMatch) {
                return sum + tx.amount;
              }
              return sum;
            }, 0);

            return {
              ...g,
              current_amount: currentAmount || 0,
            };
          });

          setGoals(updatedGoals as Goal[]);
        } else {
          setGoals([]);
        }
      } catch (e: any) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();

    // Subscribe to changes
    const goalsSubscription = supabase
      .channel("goals_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals" },
        () => fetchGoals(),
      )
      .subscribe();

    const txSubscription = supabase
      .channel("transactions_goals_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => fetchGoals(), // Refresh to update amounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(goalsSubscription);
      supabase.removeChannel(txSubscription);
    };
  }, [user, type]);

  const addGoal = async (
    goal: Omit<
      Goal,
      | "id"
      | "created_at"
      | "updated_at"
      | "user_id"
      | "current_amount"
      | "created_by"
    >,
  ) => {
    if (!user) return new Error("Not authenticated");

    const { error } = await supabase.from("goals").insert([
      {
        ...goal,
        user_id: user.id,
      },
    ]);

    return error;
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const { error } = await supabase.from("goals").update(updates).eq("id", id);

    return error;
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);

    return error;
  };

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}
