import { describe, it, expect } from 'vitest';
import {
  parseCurrencyInput,
  calculateTransactionSummary,
  calculateTransferImpact,
  calculateGoalProgress,
} from './financialMath';

describe('financialMath domain utility', () => {
  describe('parseCurrencyInput', () => {
    it('should parse numbers with comma as decimal separator', () => {
      expect(parseCurrencyInput('12,50')).toBe(12.5);
      expect(parseCurrencyInput('1500,99')).toBe(1500.99);
    });

    it('should parse numbers with dot as decimal separator', () => {
      expect(parseCurrencyInput('12.50')).toBe(12.5);
      expect(parseCurrencyInput('49.99')).toBe(49.99);
    });

    it('should round to 2 decimal places', () => {
      expect(parseCurrencyInput('10,555')).toBe(10.56);
      expect(parseCurrencyInput('10.123')).toBe(10.12);
    });

    it('should safely return 0 for invalid or empty inputs', () => {
      expect(parseCurrencyInput('')).toBe(0);
      expect(parseCurrencyInput('abc')).toBe(0);
      expect(parseCurrencyInput('   ')).toBe(0);
    });
  });

  describe('calculateTransactionSummary', () => {
    it('should correctly sum incomes and expenses and calculate net balance', () => {
      const transactions = [
        { amount: 1200.5 }, // Ingreso nómina
        { amount: -50.25 }, // Gasto comida
        { amount: -150.25 }, // Gasto compras
        { amount: 200.0 }, // Ingreso extra
      ];

      const summary = calculateTransactionSummary(transactions);

      expect(summary.incomeTotal).toBe(1400.5);
      expect(summary.expenseTotal).toBe(200.5);
      expect(summary.netBalance).toBe(1200.0);
    });

    it('should handle empty transaction list', () => {
      const summary = calculateTransactionSummary([]);
      expect(summary.incomeTotal).toBe(0);
      expect(summary.expenseTotal).toBe(0);
      expect(summary.netBalance).toBe(0);
    });

    it('should avoid IEEE 754 floating point precision errors', () => {
      const transactions = [
        { amount: 0.1 },
        { amount: 0.2 },
        { amount: -0.3 },
      ];

      const summary = calculateTransactionSummary(transactions);
      expect(summary.incomeTotal).toBe(0.3);
      expect(summary.expenseTotal).toBe(0.3);
      expect(summary.netBalance).toBe(0);
    });
  });

  describe('calculateTransferImpact', () => {
    it('should correctly transfer funds and conserve the total sum of money', () => {
      const sourceBalance = 500.0;
      const destinationBalance = 150.0;
      const transferAmount = 100.0;

      const result = calculateTransferImpact(sourceBalance, destinationBalance, transferAmount);

      expect(result.newSourceBalance).toBe(400.0);
      expect(result.newDestinationBalance).toBe(250.0);
      expect(result.isTotalConserved).toBe(true);
      expect(result.newSourceBalance + result.newDestinationBalance).toBe(sourceBalance + destinationBalance);
    });

    it('should handle transfers with cents accurately', () => {
      const result = calculateTransferImpact(100.25, 50.15, 25.10);

      expect(result.newSourceBalance).toBe(75.15);
      expect(result.newDestinationBalance).toBe(75.25);
      expect(result.isTotalConserved).toBe(true);
    });
  });

  describe('calculateGoalProgress', () => {
    it('should calculate saving progress percentage and remaining amount', () => {
      const progress = calculateGoalProgress(250, 1000, 'saving');

      expect(progress.percentage).toBe(25);
      expect(progress.remaining).toBe(750);
      expect(progress.isCompleted).toBe(false);
    });

    it('should cap saving percentage at 100% when goal is exceeded', () => {
      const progress = calculateGoalProgress(1200, 1000, 'saving');

      expect(progress.percentage).toBe(100);
      expect(progress.remaining).toBe(0);
      expect(progress.isCompleted).toBe(true);
    });

    it('should return safe values when target is 0 or negative', () => {
      const progress = calculateGoalProgress(50, 0, 'saving');

      expect(progress.percentage).toBe(0);
      expect(progress.remaining).toBe(0);
      expect(progress.isCompleted).toBe(false);
    });

    it('should calculate budget goal remaining percentage', () => {
      const progress = calculateGoalProgress(300, 500, 'budget');

      expect(progress.percentage).toBe(40); // 200 restantes de 500 = 40%
      expect(progress.remaining).toBe(200);
      expect(progress.isCompleted).toBe(false);
    });
  });
});
