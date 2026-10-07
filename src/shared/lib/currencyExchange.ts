/**
 * @module currencyExchange
 * @description Servicio de dominio para conversión de divisas, precisión matemática
 * y procesamiento de transacciones multimoneda para Wallet.ia.
 */

import type { SupportedCurrency } from '../../app/providers/LocaleCurrencyContext';

export interface ExchangeRateProvider {
  getRate(from: SupportedCurrency, to: SupportedCurrency, date?: string): Promise<number>;
}

export interface CrossCurrencyResult {
  originalAmount: number;
  originalCurrency: SupportedCurrency;
  accountAmount: number;
  accountCurrency: SupportedCurrency;
  exchangeRateUsed: number;
  date: string;
}

/**
 * Convierte un importe de una divisa a otra aplicando la tasa de cambio dada,
 * protegiendo contra artefactos de punto flotante de IEEE 754 y respetando
 * los decimales según la divisa destino (ej. JPY sin decimales, EUR/USD con 2).
 */
export function convertAmountWithRate(
  amount: number,
  rate: number,
  targetCurrency: SupportedCurrency = 'EUR'
): number {
  if (isNaN(amount) || !Number.isFinite(amount)) {
    throw new Error('Invalid amount provided for conversion');
  }
  if (isNaN(rate) || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('Exchange rate must be a positive finite number');
  }

  // Divisas sin decimales (como JPY)
  const isZeroDecimal = targetCurrency === 'JPY';
  const decimals = isZeroDecimal ? 0 : 2;
  const factor = Math.pow(10, decimals);

  // Redondeo bancario seguro
  const rawConverted = amount * rate;
  return Math.round(rawConverted * factor) / factor;
}

/**
 * Procesa una transacción cuando la divisa de cobro difiere de la divisa de la tarjeta/cuenta.
 * Ejemplo: Pago de 50 EUR con tarjeta en USD.
 *
 * @param params Parámetros de la transacción
 * @param rateProvider Proveedor de tipos de cambio (con soporte de histórico)
 */
export async function processCrossCurrencyPayment(
  params: {
    chargeAmount: number;
    chargeCurrency: SupportedCurrency;
    accountCurrency: SupportedCurrency;
    date: string;
  },
  rateProvider: ExchangeRateProvider
): Promise<CrossCurrencyResult> {
  const { chargeAmount, chargeCurrency, accountCurrency, date } = params;

  if (chargeAmount === 0) {
    return {
      originalAmount: 0,
      originalCurrency: chargeCurrency,
      accountAmount: 0,
      accountCurrency,
      exchangeRateUsed: 1.0,
      date,
    };
  }

  // Si son la misma divisa, la tasa es exactamente 1.0
  if (chargeCurrency === accountCurrency) {
    return {
      originalAmount: chargeAmount,
      originalCurrency: chargeCurrency,
      accountAmount: chargeAmount,
      accountCurrency,
      exchangeRateUsed: 1.0,
      date,
    };
  }

  // Obtener tasa para la fecha específica
  const rate = await rateProvider.getRate(chargeCurrency, accountCurrency, date);

  if (!rate || rate <= 0) {
    throw new Error(`Failed to retrieve valid exchange rate from ${chargeCurrency} to ${accountCurrency} for ${date}`);
  }

  // La cuenta se debitará/acreditará en su propia divisa base
  const accountAmount = convertAmountWithRate(chargeAmount, rate, accountCurrency);

  return {
    originalAmount: chargeAmount,
    originalCurrency: chargeCurrency,
    accountAmount,
    accountCurrency,
    exchangeRateUsed: rate,
    date,
  };
}
