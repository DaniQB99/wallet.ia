import { useMemo } from 'react';
import type { Transaction } from '../types/database';

export type AnalyticsPeriod = 'week' | 'month' | 'year';
export type AnalyticsDirection = -1 | 1;

const startOfWeekMonday = (date: Date) => {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const inRange = (value: Date, start: Date, end: Date) => value >= start && value <= end;

export function shiftReferenceDate(referenceDate: Date, period: AnalyticsPeriod, direction: AnalyticsDirection) {
  const next = new Date(referenceDate);
  if (period === 'week') {
    next.setDate(next.getDate() + 7 * direction);
  } else if (period === 'month') {
    next.setMonth(next.getMonth() + direction);
  } else {
    next.setFullYear(next.getFullYear() + direction);
  }
  return next;
}

export function useAnalyticsStats(transactions: Transaction[], period: AnalyticsPeriod, referenceDate = new Date()) {
  return useMemo(() => {
    const now = new Date(referenceDate);
    let start = new Date(now);
    let end = new Date(now);

    if (period === 'week') {
      start = startOfWeekMonday(now);
      end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
    } else if (period === 'month') {
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
    const categoryMap = new Map<string, { id: string; name: string; icon: string; total: number; movements: number }>();

    for (const tx of filtered) {
      const amount = Number(tx.amount);
      if (amount >= 0) {
        incomeTotal += amount;
      } else {
        expenseTotal += Math.abs(amount);
      }

      const key = tx.category_id || tx.category?.id || 'unknown';
      const current = categoryMap.get(key) ?? {
        id: key,
        name: tx.category?.name || 'Sin categoría',
        icon: tx.category?.icon || '🏷️',
        total: 0,
        movements: 0,
      };
      current.total += Math.abs(amount);
      current.movements += 1;
      categoryMap.set(key, current);
    }

    const categories = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);

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
