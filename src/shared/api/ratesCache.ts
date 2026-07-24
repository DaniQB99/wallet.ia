/**
 * @module ratesCache
 * @description Capa de persistencia para las tasas de cambio de divisas.
 * Almacena las tasas en localStorage organizadas por moneda y fecha ISO,
 * con TTL de 4 horas para la tasa de hoy y persistencia indefinida para
 * las tasas históricas (que son inmutables por naturaleza).
 *
 * Estructura en localStorage bajo la clave 'wallet_ia_rates_v2':
 * {
 *   "USD": {
 *     "2024-01-15": 1.0823,
 *     "2024-01-16": 1.0891,
 *     "_fetched": "2026-05-16T10:00:00Z"  // timestamp del último fetch de "hoy"
 *   },
 *   "GBP": { ... }
 * }
 */

const CACHE_KEY = 'wallet_ia_rates_v2';
const TODAY_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

/**
 * Store completo: { [currency]: { [dateISO | "_fetched"]: number | string } }
 * Las claves de fecha son "YYYY-MM-DD", la clave especial "_fetched" es un ISO timestamp.
 */
export type RatesStore = Record<string, Record<string, number | string>>;

/** Carga el store completo desde localStorage. Devuelve {} si no existe o está corrupto. */
export function loadCacheFromStorage(): RatesStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/** Persiste el store completo en localStorage. No lanza errores si storage está lleno. */
export function saveCacheToStorage(store: RatesStore): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // Storage lleno (cuota excedida): la app sigue funcionando con datos en memoria
    console.warn('[RatesCache] localStorage write failed — storage may be full');
  }
}

/**
 * Obtiene la tasa exacta para una moneda y fecha.
 * @returns La tasa como número, o null si no existe en caché.
 */
export function getRate(store: RatesStore, currency: string, dateISO: string): number | null {
  const dateKey = dateISO.slice(0, 10);
  const rate = store[currency]?.[dateKey];
  if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) return rate;
  return null;
}

/**
 * Busca la tasa más cercana ANTERIOR disponible para una fecha dada.
 * Garantiza que no se pierda dinero usando la tasa más representativa disponible
 * cuando no existe la tasa exacta del día solicitado.
 * @returns La tasa del día más cercano anterior, o null si no hay ninguna.
 */
export function getNearestRate(store: RatesStore, currency: string, dateISO: string): number | null {
  const currencyData = store[currency];
  if (!currencyData) return null;

  const targetDate = dateISO.slice(0, 10);
  const availableDates = Object.keys(currencyData)
    .filter(k => k !== '_fetched' && k <= targetDate)
    .sort()
    .reverse();

  if (availableDates.length === 0) return null;
  const nearest = currencyData[availableDates[0]];
  return typeof nearest === 'number' && Number.isFinite(nearest) && nearest > 0 ? nearest : null;
}

/**
 * Indica si la tasa de "hoy" para una moneda está obsoleta (más de 4 horas).
 * Devuelve true si nunca se ha fetchado o si el TTL ha expirado.
 */
export function isTodayStale(store: RatesStore, currency: string): boolean {
  const fetched = store[currency]?.['_fetched'];
  if (typeof fetched !== 'string') return true;
  return Date.now() - new Date(fetched).getTime() > TODAY_TTL_MS;
}

/**
 * Devuelve un nuevo store inmutable con la tasa añadida/actualizada.
 * Preserva todas las demás entradas del store.
 */
export function setRate(store: RatesStore, currency: string, dateISO: string, rate: number): RatesStore {
  const dateKey = dateISO.slice(0, 10);
  return {
    ...store,
    [currency]: {
      ...(store[currency] ?? {}),
      [dateKey]: rate,
    },
  };
}

/**
 * Devuelve un nuevo store inmutable marcando el timestamp del último fetch de "hoy".
 * Se llama después de un fetch exitoso de la tasa del día actual.
 */
export function markTodayFetched(store: RatesStore, currency: string): RatesStore {
  return {
    ...store,
    [currency]: {
      ...(store[currency] ?? {}),
      _fetched: new Date().toISOString(),
    },
  };
}

/**
 * Devuelve un listado de fechas que NO están en caché para una moneda dada.
 * Útil para determinar qué fechas hay que fetchear antes de una precarga.
 */
export function getMissingDates(store: RatesStore, currency: string, dates: string[]): string[] {
  return dates
    .map(d => d.slice(0, 10))
    .filter((d, i, arr) => arr.indexOf(d) === i) // deduplicar
    .filter(d => getRate(store, currency, d) === null);
}

/**
 * Inserta múltiples tasas de una vez. Más eficiente que llamar setRate() N veces
 * porque solo crea 1 nuevo objeto (en vez de N copias inmutables en cascada).
 */
export function bulkSetRates(store: RatesStore, currency: string, rates: Record<string, number>): RatesStore {
  const currencyData = { ...(store[currency] ?? {}) };
  for (const [date, rate] of Object.entries(rates)) {
    const dateKey = date.slice(0, 10);
    if (Number.isFinite(rate) && rate > 0) {
      currencyData[dateKey] = rate;
    }
  }
  return { ...store, [currency]: currencyData };
}

/**
 * Limpia tasas históricas más antiguas que `maxAgeDays` para evitar que
 * localStorage crezca indefinidamente con el tiempo.
 * Mantiene siempre la tasa de hoy y el marcador _fetched.
 *
 * @param maxAgeDays Número de días máximo a conservar (por defecto 180 = 6 meses)
 * @returns Un nuevo store con las tasas antiguas eliminadas
 */
export function cleanOldRates(store: RatesStore, maxAgeDays = 180): RatesStore {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const cleaned: RatesStore = {};
  for (const [currency, data] of Object.entries(store)) {
    const filteredData: Record<string, number | string> = {};
    for (const [key, value] of Object.entries(data)) {
      // Mantener _fetched, tasas recientes, y cualquier entrada no-fecha
      if (key === '_fetched' || key >= cutoffStr || !/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        filteredData[key] = value;
      }
    }
    if (Object.keys(filteredData).length > 0) {
      cleaned[currency] = filteredData;
    }
  }
  return cleaned;
}

