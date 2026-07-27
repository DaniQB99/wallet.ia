/**
 * @module frankfurter
 * @description Cliente HTTP para la API de Frankfurter (api.frankfurter.app).
 * Implementa deduplicación de peticiones en vuelo para evitar múltiples requests
 * a la misma URL simultáneamente, soporte de rangos de fechas para minimizar
 * el número de peticiones HTTP, y timeouts configurables.
 *
 * Base currency: EUR (fijo, coincide con la moneda base de Wallet.ia en BD).
 *
 * Endpoints usados:
 *   GET /latest?from=EUR&to=USD          → tasa de hoy
 *   GET /2024-01-15?from=EUR&to=USD      → tasa histórica puntual
 *   GET /2024-01-01..2024-01-31?from=EUR&to=USD → rango de fechas
 */

const BASE_URL = 'https://api.frankfurter.dev/v1';
const BASE_CURRENCY = 'EUR';
const TIMEOUT_MS = 8000;

/**
 * Mapa de peticiones en vuelo. Clave: URL completa.
 * Garantiza que dos llamadas al mismo endpoint devuelven la misma Promise.
 */
const inFlight = new Map<string, Promise<number | null>>();
const inFlightRange = new Map<string, Promise<Record<string, number>>>();

/** Helper para crear una Promise con timeout usando AbortSignal. */
function withTimeout(ms: number): AbortSignal {
  try {
    return AbortSignal.timeout(ms);
  } catch {
    // Fallback para entornos que no soporten AbortSignal.timeout
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }
}

/**
 * Obtiene la tasa de cambio EUR → {currency} para una fecha histórica concreta.
 * Deduplica peticiones en vuelo: llamar dos veces a la misma fecha/moneda
 * mientras la primera petición está en curso retorna la misma Promise.
 *
 * @param currency - Código ISO 4217 de la moneda destino (ej: 'USD')
 * @param dateISO  - Fecha en formato "YYYY-MM-DD"
 * @returns La tasa de cambio como número positivo, o null si falla la petición.
 */
export async function fetchRate(currency: string, dateISO: string): Promise<number | null> {
  const dateKey = dateISO.slice(0, 10);
  const url = `${BASE_URL}/${dateKey}?from=${BASE_CURRENCY}&to=${currency}`;

  if (inFlight.has(url)) return inFlight.get(url)!;

  const promise = (async (): Promise<number | null> => {
    try {
      const res = await fetch(url, { signal: withTimeout(TIMEOUT_MS) });
      if (!res.ok) return null;
      const data = await res.json();
      const rate = Number(data?.rates?.[currency]);
      return Number.isFinite(rate) && rate > 0 ? rate : null;
    } catch {
      return null;
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, promise);
  return promise;
}

/**
 * Obtiene la tasa de cambio EUR → {currency} para hoy.
 * Usa el endpoint /latest que siempre devuelve la tasa del día de mercado más reciente.
 * Deduplica peticiones en vuelo.
 *
 * @param currency - Código ISO 4217 de la moneda destino
 * @returns La tasa de cambio como número positivo, o null si falla.
 */
export async function fetchLatestRate(currency: string): Promise<number | null> {
  const url = `${BASE_URL}/latest?from=${BASE_CURRENCY}&to=${currency}`;

  if (inFlight.has(url)) return inFlight.get(url)!;

  const promise = (async (): Promise<number | null> => {
    try {
      const res = await fetch(url, { signal: withTimeout(TIMEOUT_MS) });
      if (!res.ok) return null;
      const data = await res.json();
      const rate = Number(data?.rates?.[currency]);
      return Number.isFinite(rate) && rate > 0 ? rate : null;
    } catch {
      return null;
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, promise);
  return promise;
}

/**
 * Obtiene tasas de cambio EUR → {currency} para un rango de fechas en UNA SOLA petición.
 * La API de Frankfurter soporta el formato: /startDate..endDate?from=EUR&to=USD
 *
 * Esto minimiza el número de peticiones HTTP cuando se necesitan tasas de múltiples
 * días (ej: al cargar el historial de transacciones del último mes).
 *
 * Deduplica peticiones en vuelo para el mismo rango+moneda.
 *
 * @param currency  - Código ISO 4217 de la moneda destino
 * @param startDate - Fecha inicio "YYYY-MM-DD" (inclusive)
 * @param endDate   - Fecha fin "YYYY-MM-DD" (inclusive)
 * @returns Objeto { "YYYY-MM-DD": rate } para cada día del rango con datos disponibles.
 *          Los fines de semana y festivos no tienen datos en la API (mercados cerrados).
 */
export async function fetchRateRange(
  currency: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const start = startDate.slice(0, 10);
  const end = endDate.slice(0, 10);
  const url = `${BASE_URL}/${start}..${end}?from=${BASE_CURRENCY}&to=${currency}`;

  if (inFlightRange.has(url)) return inFlightRange.get(url)!;

  const promise = (async (): Promise<Record<string, number>> => {
    try {
      const res = await fetch(url, { signal: withTimeout(TIMEOUT_MS + 2000) });
      if (!res.ok) return {};
      const data = await res.json();

      // data.rates = { "2024-01-01": { "USD": 1.08 }, "2024-01-02": { "USD": 1.09 }, ... }
      const result: Record<string, number> = {};
      const rates = data?.rates as Record<string, Record<string, number>> | undefined;
      if (!rates) return {};

      for (const [date, dayRates] of Object.entries(rates)) {
        const rate = dayRates[currency];
        if (Number.isFinite(rate) && rate > 0) {
          result[date] = rate;
        }
      }
      return result;
    } catch {
      return {};
    } finally {
      inFlightRange.delete(url);
    }
  })();

  inFlightRange.set(url, promise);
  return promise;
}
