import { useMemo } from "react";
import type { Transaction } from "../types/database";

/**
 * Define los periodos de tiempo disponibles para el análisis.
 */
export type AnalyticsPeriod = "week" | "month" | "year";

/**
 * Define la dirección del desplazamiento en el tiempo (-1 para pasado, 1 para futuro).
 */
export type AnalyticsDirection = -1 | 1;

/**
 * Obtiene el lunes de la semana correspondiente a una fecha dada.
 * @param date - La fecha de referencia.
 * @returns Un nuevo objeto Date ajustado al lunes de esa semana a las 00:00:00.
 */
const startOfWeekMonday = (date: Date) => {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Ajusta una fecha para que represente el final de su día.
 * @param date - La fecha a ajustar.
 * @returns Un nuevo objeto Date ajustado a las 23:59:59.999 del mismo día.
 */
const endOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Verifica si una fecha se encuentra dentro de un rango específico (inclusivo).
 * @param value - La fecha a verificar.
 * @param start - La fecha de inicio del rango.
 * @param end - La fecha de fin del rango.
 * @returns `true` si la fecha está dentro del rango, de lo contrario `false`.
 */
const inRange = (value: Date, start: Date, end: Date) =>
  value >= start && value <= end;

/**
 * Desplaza una fecha de referencia hacia adelante o hacia atrás según el periodo especificado.
 * @param referenceDate - La fecha base sobre la cual realizar el desplazamiento.
 * @param period - El periodo de tiempo a desplazar ('week', 'month' o 'year').
 * @param direction - La dirección del desplazamiento (-1 para retroceder, 1 para avanzar).
 * @returns Una nueva fecha desplazada.
 */
export function shiftReferenceDate(
  referenceDate: Date,
  period: AnalyticsPeriod,
  direction: AnalyticsDirection,
) {
  const next = new Date(referenceDate);
  if (period === "week") {
    next.setDate(next.getDate() + 7 * direction);
  } else if (period === "month") {
    next.setMonth(next.getMonth() + direction);
  } else {
    next.setFullYear(next.getFullYear() + direction);
  }
  return next;
}

/**
 * Hook personalizado para calcular y agregar estadísticas analíticas a partir de una lista de transacciones.
 * Calcula totales de ingresos y gastos, y desglosa los montos operados por categoría dentro de un marco de tiempo.
 *
 * @param transactions - El arreglo de transacciones a analizar.
 * @param period - El periodo de análisis temporal ('week', 'month' o 'year').
 * @param referenceDate - La fecha base que determina el momento a analizar (por defecto la fecha actual).
 * @returns Estadísticas calculadas incluyendo rangos de fechas, transacciones filtradas, agregados y desglose por categorías.
 */
export function useAnalyticsStats(
  transactions: Transaction[],
  period: AnalyticsPeriod,
  referenceDate = new Date(),
) {
  return useMemo(() => {
    const now = new Date(referenceDate);
    let start = new Date(now);
    let end = new Date(now);

    if (period === "week") {
      start = startOfWeekMonday(now);
      end = endOfDay(
        new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6),
      );
    } else if (period === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = endOfDay(new Date(now.getFullYear(), 11, 31));
    }

    const filtered = transactions.filter((tx) => {
      const txDate = new Date(`${tx.date}T00:00:00`);
      return inRange(txDate, start, end);
    });

    let incomeTotal = 0;
    let expenseTotal = 0;
    const categoryMap = new Map<
      string,
      {
        id: string;
        name: string;
        icon: string;
        total: number;
        movements: number;
      }
    >();

    for (const tx of filtered) {
      const amount = Number(tx.amount);
      if (amount >= 0) {
        incomeTotal += amount;
      } else {
        expenseTotal += Math.abs(amount);
      }

      const key = tx.category_id || tx.category?.id || "unknown";
      const current = categoryMap.get(key) ?? {
        id: key,
        name: tx.category?.name || "Sin categoría",
        icon: tx.category?.icon || "🏷️",
        total: 0,
        movements: 0,
      };
      current.total += Math.abs(amount);
      current.movements += 1;
      categoryMap.set(key, current);
    }

    const categories = Array.from(categoryMap.values()).sort(
      (a, b) => b.total - a.total,
    );

    return {
      rangeStart: start,
      rangeEnd: end,
      filtered,
      incomeTotal,
      expenseTotal,
      categories,
    };
  }, [transactions, period, referenceDate]);
}
