import { describe, it, expect, vi } from 'vitest';
import {
  convertAmountWithRate,
  processCrossCurrencyPayment,
  type ExchangeRateProvider,
} from './currencyExchange';
import type { SupportedCurrency } from '../../app/providers/LocaleCurrencyContext';

describe('Suite de Tests para Cambio de Divisa (Estabilidad, Precisión y Resiliencia)', () => {
  // Mock provider con tasas históricas simuladas
  const createMockRateProvider = (ratesDb: Record<string, Record<string, number>>): ExchangeRateProvider => ({
    getRate: vi.fn(async (from: SupportedCurrency, to: SupportedCurrency, date?: string) => {
      const dateKey = date ? date.slice(0, 10) : 'latest';
      const dayRates = ratesDb[dateKey] ?? ratesDb['latest'];
      if (!dayRates) throw new Error(`Network Error: Provider unavailable for date ${dateKey}`);
      
      const pairKey = `${from}_${to}`;
      if (dayRates[pairKey] === undefined) {
        throw new Error(`Invalid currency pair: ${pairKey}`);
      }
      return dayRates[pairKey];
    }),
  });

  // --------------------------------------------------------------------------
  // 1. Actualización Diaria de Tasas de Cambio
  // --------------------------------------------------------------------------
  describe('1. Actualización Diaria y Uso de la Tasa del Día Correspondiente', () => {
    const historicalRates = {
      '2026-10-01': { 'EUR_USD': 1.0820 },
      '2026-10-02': { 'EUR_USD': 1.0875 },
      '2026-10-03': { 'EUR_USD': 1.0910 },
      'latest': { 'EUR_USD': 1.0950 },
    };

    it('debe utilizar la tasa histórica exacta del día especificado en la transacción', async () => {
      const provider = createMockRateProvider(historicalRates);

      const paymentDay1 = await processCrossCurrencyPayment(
        { chargeAmount: 100, chargeCurrency: 'EUR', accountCurrency: 'USD', date: '2026-10-01' },
        provider
      );
      const paymentDay2 = await processCrossCurrencyPayment(
        { chargeAmount: 100, chargeCurrency: 'EUR', accountCurrency: 'USD', date: '2026-10-02' },
        provider
      );

      expect(paymentDay1.exchangeRateUsed).toBe(1.0820);
      expect(paymentDay1.accountAmount).toBe(108.20);

      expect(paymentDay2.exchangeRateUsed).toBe(1.0875);
      expect(paymentDay2.accountAmount).toBe(108.75);

      expect(provider.getRate).toHaveBeenCalledWith('EUR', 'USD', '2026-10-01');
      expect(provider.getRate).toHaveBeenCalledWith('EUR', 'USD', '2026-10-02');
    });

    it('debe retornar 1.0 sin consultar el proveedor si las divisas origen y destino son idénticas', async () => {
      const provider = createMockRateProvider(historicalRates);

      const payment = await processCrossCurrencyPayment(
        { chargeAmount: 50, chargeCurrency: 'USD', accountCurrency: 'USD', date: '2026-10-01' },
        provider
      );

      expect(payment.exchangeRateUsed).toBe(1.0);
      expect(payment.accountAmount).toBe(50);
      expect(provider.getRate).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Fluctuación Drástica de Valores e Inmutabilidad Histórica
  // --------------------------------------------------------------------------
  describe('2. Fluctuación de Valores e Inmutabilidad del Histórico', () => {
    it('debe mantener inmutable el valor de transacciones históricas aunque la divisa fluctúe bruscamente', async () => {
      // Simulación de crash o apreciación drástica (ej. EUR/USD salta de 1.05 a 1.35 al día siguiente)
      const volatileRates = {
        '2026-10-05': { 'EUR_USD': 1.0500 },
        '2026-10-06': { 'EUR_USD': 1.3500 },
      };
      const provider = createMockRateProvider(volatileRates);

      // Transacción registrada el día 5
      const txPast = await processCrossCurrencyPayment(
        { chargeAmount: 200, chargeCurrency: 'EUR', accountCurrency: 'USD', date: '2026-10-05' },
        provider
      );

      // Transacción registrada el día 6 (mismo importe en EUR)
      const txCurrent = await processCrossCurrencyPayment(
        { chargeAmount: 200, chargeCurrency: 'EUR', accountCurrency: 'USD', date: '2026-10-06' },
        provider
      );

      // La transacción del día 5 conserva 210.00 USD (200 * 1.05)
      expect(txPast.exchangeRateUsed).toBe(1.0500);
      expect(txPast.accountAmount).toBe(210.00);

      // La nueva transacción del día 6 refleja el nuevo tipo de cambio: 270.00 USD (200 * 1.35)
      expect(txCurrent.exchangeRateUsed).toBe(1.3500);
      expect(txCurrent.accountAmount).toBe(270.00);

      // Demostración de inmutabilidad: el cambio de mercado no altera el resultado previo
      expect(txPast.accountAmount).not.toBe(txCurrent.accountAmount);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Precisión Matemática y Redondeo Bancario
  // --------------------------------------------------------------------------
  describe('3. Precisión Matemática y Ausencia de Pérdida de Decimales', () => {
    it('evita artefactos de punto flotante IEEE 754 (ej. 0.1 * 0.2)', () => {
      // 0.1 * 0.2 = 0.020000000000000004 en JS puro
      const converted = convertAmountWithRate(0.1, 0.2, 'EUR');
      expect(converted).toBe(0.02);
    });

    it('redondea con precisión a 2 decimales para divisas estándar (EUR, USD, GBP)', () => {
      expect(convertAmountWithRate(33.333, 1.0825, 'USD')).toBe(36.08); // 36.083... -> 36.08
      expect(convertAmountWithRate(100.555, 1.1555, 'EUR')).toBe(116.19); // 116.191... -> 116.19
    });

    it('respeta divisas sin decimales como el Yen Japonés (JPY)', () => {
      // 100 EUR a 163.45 JPY = 16345 JPY (entero sin centavos)
      const inJpy = convertAmountWithRate(100, 163.456, 'JPY');
      expect(inJpy).toBe(16346);
      expect(Number.isInteger(inJpy)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Casos Límite y Manejo de Errores
  // --------------------------------------------------------------------------
  describe('4. Casos Límite, Fallos de Red y Errores de Validación', () => {
    it('maneja importes con valor cero sin fallar y sin consultar la API', async () => {
      const provider = createMockRateProvider({});

      const zeroPayment = await processCrossCurrencyPayment(
        { chargeAmount: 0, chargeCurrency: 'EUR', accountCurrency: 'USD', date: '2026-10-07' },
        provider
      );

      expect(zeroPayment.originalAmount).toBe(0);
      expect(zeroPayment.accountAmount).toBe(0);
      expect(zeroPayment.exchangeRateUsed).toBe(1.0);
      expect(provider.getRate).not.toHaveBeenCalled();
    });

    it('preserva el signo negativo en transacciones de gasto o reembolso', () => {
      const negativeExpense = convertAmountWithRate(-50.50, 1.10, 'USD');
      expect(negativeExpense).toBe(-55.55);
    });

    it('lanza un error explícito si la tasa de cambio es inválida o no positiva', () => {
      expect(() => convertAmountWithRate(100, 0, 'USD')).toThrowError('Exchange rate must be a positive finite number');
      expect(() => convertAmountWithRate(100, -1.2, 'USD')).toThrowError('Exchange rate must be a positive finite number');
      expect(() => convertAmountWithRate(100, NaN, 'USD')).toThrowError('Exchange rate must be a positive finite number');
    });

    it('captura y propaga error si el proveedor de API falla por caída de red (HTTP 500)', async () => {
      const failingProvider: ExchangeRateProvider = {
        getRate: vi.fn().mockRejectedValue(new Error('500 Internal Server Error: Gateway Timeout')),
      };

      await expect(
        processCrossCurrencyPayment(
          { chargeAmount: 75, chargeCurrency: 'EUR', accountCurrency: 'USD', date: '2026-10-07' },
          failingProvider
        )
      ).rejects.toThrowError('500 Internal Server Error: Gateway Timeout');
    });

    it('lanza error cuando se solicita un par de divisas no soportado', async () => {
      const provider = createMockRateProvider({
        latest: { 'EUR_USD': 1.08 },
      });

      await expect(
        processCrossCurrencyPayment(
          { chargeAmount: 100, chargeCurrency: 'EUR', accountCurrency: 'ARS', date: '2026-10-07' },
          provider
        )
      ).rejects.toThrowError('Invalid currency pair: EUR_ARS');
    });
  });
});
