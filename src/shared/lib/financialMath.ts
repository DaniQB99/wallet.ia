/**
 * @module financialMath
 * @description Funciones puras de cálculo y validación financiera para Wallet.ia.
 * Centraliza la aritmética de balances, transferencias, metas y parseo de importes.
 */

export * from './currencyExchange';

export interface TransactionSummary {
  incomeTotal: number;
  expenseTotal: number;
  netBalance: number;
}

/**
 * Parsea una cadena de texto ingresada por el usuario a un valor numérico seguro.
 * Soporta formato europeo con coma ('12,50') y formato con punto ('12.50').
 * Retorna 0 si la cadena no representa un número válido.
 */
export function parseCurrencyInput(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  
  // Normalizar reemplazando comas por puntos y eliminando caracteres no numéricos excepto el punto
  const cleaned = value.trim().replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed) || !isFinite(parsed)) return 0;
  
  // Redondeo a 2 decimales para precisión de centavos
  return Math.round(parsed * 100) / 100;
}

/**
 * Calcula el resumen de transacciones (ingresos, gastos y balance neto).
 * Por convención en Wallet.ia:
 * - Ingresos: importes >= 0
 * - Gastos: importes < 0 (se suman en positivo para expenseTotal)
 * - Balance neto = incomeTotal - expenseTotal
 */
export function calculateTransactionSummary(
  transactions: Array<{ amount: number }>
): TransactionSummary {
  let incomeTotal = 0;
  let expenseTotal = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (isNaN(amount)) continue;

    if (amount >= 0) {
      incomeTotal += amount;
    } else {
      expenseTotal += Math.abs(amount);
    }
  }

  // Redondeo para evitar artefactos de punto flotante de IEEE 754
  const roundedIncome = Math.round(incomeTotal * 100) / 100;
  const roundedExpense = Math.round(expenseTotal * 100) / 100;
  const netBalance = Math.round((roundedIncome - roundedExpense) * 100) / 100;

  return {
    incomeTotal: roundedIncome,
    expenseTotal: roundedExpense,
    netBalance,
  };
}

/**
 * Simula el impacto de una transferencia entre dos cuentas y valida la invariante de conservación de saldo.
 * @param sourceBalance Saldo de la cuenta de origen.
 * @param destinationBalance Saldo de la cuenta de destino.
 * @param transferAmount Importe a transferir (debe ser positivo).
 */
export function calculateTransferImpact(
  sourceBalance: number,
  destinationBalance: number,
  transferAmount: number
): {
  newSourceBalance: number;
  newDestinationBalance: number;
  isTotalConserved: boolean;
} {
  const amount = Math.abs(transferAmount);
  const newSource = Math.round((sourceBalance - amount) * 100) / 100;
  const newDest = Math.round((destinationBalance + amount) * 100) / 100;

  const initialTotal = Math.round((sourceBalance + destinationBalance) * 100) / 100;
  const finalTotal = Math.round((newSource + newDest) * 100) / 100;

  return {
    newSourceBalance: newSource,
    newDestinationBalance: newDest,
    isTotalConserved: initialTotal === finalTotal,
  };
}

/**
 * Calcula el porcentaje de avance de una meta.
 * @param current Importe actual ahorrado o gastado.
 * @param target Importe objetivo.
 * @param type 'saving' (meta de ahorro) o 'budget' (presupuesto límite).
 */
export function calculateGoalProgress(
  current: number,
  target: number,
  type: 'saving' | 'budget' = 'saving'
): {
  percentage: number;
  remaining: number;
  isCompleted: boolean;
} {
  if (target <= 0) {
    return { percentage: 0, remaining: 0, isCompleted: false };
  }

  const safeCurrent = Math.max(0, current);

  if (type === 'saving') {
    const rawPercent = Math.round((safeCurrent / target) * 100);
    const remaining = Math.max(0, Math.round((target - safeCurrent) * 100) / 100);
    return {
      percentage: Math.min(100, rawPercent),
      remaining,
      isCompleted: safeCurrent >= target,
    };
  }

  // Tipo presupuesto ('budget'): porcentaje restante del límite
  const remainingBudget = Math.max(0, Math.round((target - safeCurrent) * 100) / 100);
  const percentRemaining = Math.max(0, Math.round((remainingBudget / target) * 100));
  return {
    percentage: percentRemaining,
    remaining: remainingBudget,
    isCompleted: safeCurrent >= target, // Se alcanzó el presupuesto
  };
}
