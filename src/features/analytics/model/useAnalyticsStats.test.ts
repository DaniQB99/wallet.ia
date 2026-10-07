import { describe, it, expect } from 'vitest';
import { shiftReferenceDate } from './useAnalyticsStats';

describe('shiftReferenceDate analytics utility', () => {
  it('should shift by exactly 7 days when period is week', () => {
    const baseDate = new Date(2026, 9, 7); // 7 de octubre de 2026
    const nextWeek = shiftReferenceDate(baseDate, 'week', 1);
    const prevWeek = shiftReferenceDate(baseDate, 'week', -1);

    expect(nextWeek.getDate()).toBe(14);
    expect(prevWeek.getDate()).toBe(30); // Septiembre tiene 30 días
    expect(prevWeek.getMonth()).toBe(8); // Mes 8 = Septiembre
  });

  it('should shift by 1 month forward and backward', () => {
    const baseDate = new Date(2026, 4, 15); // 15 de mayo
    const nextMonth = shiftReferenceDate(baseDate, 'month', 1);
    const prevMonth = shiftReferenceDate(baseDate, 'month', -1);

    expect(nextMonth.getMonth()).toBe(5); // Junio
    expect(prevMonth.getMonth()).toBe(3); // Abril
    expect(nextMonth.getDate()).toBe(15);
  });

  it('should shift by 1 year forward and backward', () => {
    const baseDate = new Date(2026, 0, 1);
    const nextYear = shiftReferenceDate(baseDate, 'year', 1);
    const prevYear = shiftReferenceDate(baseDate, 'year', -1);

    expect(nextYear.getFullYear()).toBe(2027);
    expect(prevYear.getFullYear()).toBe(2025);
  });

  it('should not mutate the original reference date object', () => {
    const baseDate = new Date(2026, 5, 10);
    const originalTime = baseDate.getTime();

    shiftReferenceDate(baseDate, 'month', 1);

    expect(baseDate.getTime()).toBe(originalTime);
  });
});
