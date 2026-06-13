import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadCacheFromStorage,
  saveCacheToStorage,
  getRate,
  getNearestRate,
  setRate,
  markTodayFetched,
  getMissingDates,
  type RatesStore,
} from '../lib/ratesCache';
import { fetchRate, fetchRateRange } from '../lib/frankfurter';
import { loadLocaleMessages, getLoadedMessages, defaultMessages } from '../locales';
import type { SupportedLocale } from '../locales';

/**
 * @module LocaleCurrencyContext
 * @description Contexto de internacionalización y cambio de divisas.
 *
 * REFACTORIZADO:
 * - Las traducciones ahora se cargan desde archivos JSON separados (~50KB menos en el bundle)
 * - es-ES se carga estáticamente (disponible inmediatamente)
 * - Otros idiomas se cargan con import() dinámico y se cachean
 * - El sistema de divisas mantiene Frankfurter API con caché localStorage
 */

/**
 * Define las opciones de monedas soportadas disponibles para la representación de valores monetarios.
 */
type SupportedCurrency = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'MXN' | 'BRL' | 'ARS' | 'COP' | 'CLP';

/**
 * Interfaz fundamental que describe el flujo de internacionalización del usuario.
 * Gestiona el idioma configurado, la moneda actual, herramientas de conversión entre divisas
 * usando el tipo de cambio oficial, y el sistema de traducción (i18n).
 */
interface LocaleCurrencyContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
  prefetchRates: (dates: string[]) => Promise<void>;
  formatMoney: (amountInBase: number, dateISO?: string) => string;
  convertAmount: (amountInBase: number, dateISO?: string) => number;
  loadingRates: boolean;
  t: (key: string) => string;
}

const LOCALE_KEY = 'wallet_ia_locale';
const CURRENCY_KEY = 'wallet_ia_currency';
const BASE_CURRENCY: SupportedCurrency = 'EUR';

const localeToCurrency: Record<SupportedLocale, SupportedCurrency> = {
  'es-ES': 'EUR',
  'en-US': 'USD',
  'fr-FR': 'EUR',
  'de-DE': 'EUR',
  'it-IT': 'EUR',
  'pt-PT': 'EUR',
};

const LocaleCurrencyContext = createContext<LocaleCurrencyContextType | undefined>(undefined);

export function LocaleCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('es-ES');
  const [currency, setCurrencyState] = useState<SupportedCurrency>('EUR');
  // ratesStore: inicializado desde localStorage para evitar cualquier parpadeo al montar
  const [ratesStore, setRatesStoreState] = useState<RatesStore>(() => loadCacheFromStorage());
  const [loadingRates, setLoadingRates] = useState(false);
  // Estado de traducciones cargadas — trigger de re-render al cargar nuevo idioma
  const [messagesVersion, setMessagesVersion] = useState(0);

  const todayKey = new Date().toISOString().slice(0, 10);

  /**
   * Actualiza el store en memoria Y persiste en localStorage de forma atómica.
   * Usar siempre este helper en lugar de setRatesStoreState directo.
   */
  const updateStore = useCallback((updater: (prev: RatesStore) => RatesStore) => {
    setRatesStoreState(prev => {
      const next = updater(prev);
      saveCacheToStorage(next);
      return next;
    });
  }, []);

  // Restaurar locale y currency desde localStorage al montar
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as SupportedLocale | null;
    const savedCurrency = localStorage.getItem(CURRENCY_KEY) as SupportedCurrency | null;
    if (savedLocale) {
      setLocaleState(savedLocale);
      // Cargar traducciones del idioma guardado
      void loadLocaleMessages(savedLocale).then(() => setMessagesVersion(v => v + 1));
    }
    if (savedCurrency) {
      setCurrencyState(savedCurrency);
    } else if (savedLocale) {
      setCurrencyState(localeToCurrency[savedLocale] ?? 'EUR');
    }
  }, []);

  // Sincronizar el atributo lang del documento HTML
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  /**
   * Cargar tasa de HOY cuando la moneda cambia.
   * Lee SOLO desde localStorage (no desde el estado de React) para evitar closures stale.
   */
  useEffect(() => {
    if (currency === BASE_CURRENCY) return;

    // Leer siempre desde localStorage (fuente de verdad persistente)
    const stored = loadCacheFromStorage();
    const storedTodayRate = getRate(stored, currency, todayKey);

    if (storedTodayRate !== null) {
      // Tasa de hoy ya disponible en localStorage — sincronizar memoria y salir
      console.log(`[wallet.ia] Rate for ${currency} loaded from cache: ${storedTodayRate}`);
      setRatesStoreState(stored);
      return;
    }

    // No hay tasa de hoy → hacer fetch a la API
    console.log(`[wallet.ia] Fetching rate for ${currency}...`);
    const load = async () => {
      setLoadingRates(true);
      try {
        const res = await fetch(
          `https://api.frankfurter.app/latest?from=EUR&to=${currency}`,
          { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined }
        );
        if (!res.ok) {
          console.error(`[wallet.ia] Frankfurter API error: ${res.status}`);
          return;
        }
        const data = await res.json();
        const rate = Number(data?.rates?.[currency]);
        console.log(`[wallet.ia] Rate for ${currency}: ${rate}`);
        if (Number.isFinite(rate) && rate > 0) {
          updateStore(prev => {
            let next = setRate(prev, currency, todayKey, rate);
            next = markTodayFetched(next, currency);
            return next;
          });
        }
      } catch (err) {
        console.error('[wallet.ia] Rate fetch failed:', err);
      } finally {
        setLoadingRates(false);
      }
    };
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, todayKey]);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_KEY, newLocale);
    const suggested = localeToCurrency[newLocale] ?? 'EUR';
    setCurrencyState(suggested);
    localStorage.setItem(CURRENCY_KEY, suggested);
    // Cargar traducciones del nuevo idioma
    void loadLocaleMessages(newLocale).then(() => setMessagesVersion(v => v + 1));
  }, []);

  const setCurrency = useCallback((newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_KEY, newCurrency);
  }, []);

  /**
   * Resuelve la tasa de cambio de forma SINCRÓNICA — nunca bloquea la UI.
   * Prioridad: tasa exacta del día → cualquier tasa disponible más cercana → 1 (EUR base).
   */
  const resolveRateSync = useCallback((dateISO?: string): number => {
    if (currency === BASE_CURRENCY) return 1;
    const dateKey = dateISO ? dateISO.slice(0, 10) : todayKey;

    // 1. Tasa exacta del día solicitado
    const exact = getRate(ratesStore, currency, dateKey);
    if (exact !== null) return exact;

    // 2. Tasa de hoy (lo más representativo para totales sin fecha)
    const todayRate = getRate(ratesStore, currency, todayKey);
    if (todayRate !== null) return todayRate;

    // 3. Tasa más cercana disponible (cualquier dirección)
    const nearest = getNearestRate(ratesStore, currency, dateKey);
    if (nearest !== null) return nearest;

    // 4. Cualquier tasa disponible para esta moneda
    const currencyData = ratesStore[currency];
    if (currencyData) {
      const anyRate = Object.entries(currencyData)
        .filter(([k]) => k !== '_fetched')
        .map(([, v]) => v)
        .find(v => typeof v === 'number' && (v as number) > 0);
      if (anyRate !== undefined) return anyRate as number;
    }

    // 5. Sin tasa: devolver 1 (muestra en EUR)
    return 1;
  }, [currency, ratesStore, todayKey]);

  const convertAmount = useCallback((amountInBase: number, dateISO?: string): number => {
    return amountInBase * resolveRateSync(dateISO);
  }, [resolveRateSync]);

  /**
   * Pre-carga las tasas para un conjunto de fechas usando la estrategia más eficiente:
   * - 0 fechas faltantes → no hace nada
   * - 1 fecha faltante  → petición individual
   * - N fechas faltantes → petición de rango (1 sola request HTTP)
   * - Fallback: peticiones individuales en paralelo si el rango falla
   *
   * Las fechas ya en caché se ignoran. El resultado se persiste en localStorage.
   */
  const prefetchRates = useCallback(async (dates: string[]): Promise<void> => {
    if (currency === BASE_CURRENCY) return;

    const missing = getMissingDates(ratesStore, currency, dates);
    if (missing.length === 0) return;

    setLoadingRates(true);
    try {
      if (missing.length === 1) {
        // Petición individual para una sola fecha
        const rate = await fetchRate(currency, missing[0]);
        if (rate !== null) {
          updateStore(prev => setRate(prev, currency, missing[0], rate));
        }
      } else {
        // Petición de rango: 1 sola request HTTP para todas las fechas
        const sortedMissing = [...missing].sort();
        const startDate = sortedMissing[0];
        const endDate = sortedMissing[sortedMissing.length - 1];
        const rangeRates = await fetchRateRange(currency, startDate, endDate);

        if (Object.keys(rangeRates).length > 0) {
          updateStore(prev => {
            let next = prev;
            for (const [date, rate] of Object.entries(rangeRates)) {
              next = setRate(next, currency, date, rate);
            }
            return next;
          });
        } else {
          // Fallback: peticiones individuales en paralelo si el rango falla
          const results = await Promise.all(
            missing.map(async (d) => {
              const r = await fetchRate(currency, d);
              return r !== null ? ([d, r] as const) : null;
            }),
          );
          updateStore(prev => {
            let next = prev;
            for (const entry of results) {
              if (entry) next = setRate(next, currency, entry[0], entry[1]);
            }
            return next;
          });
        }
      }
    } finally {
      setLoadingRates(false);
    }
  }, [currency, ratesStore, updateStore]);

  const value = useMemo<LocaleCurrencyContextType>(() => ({
    locale,
    setLocale,
    currency,
    setCurrency,
    prefetchRates,
    convertAmount,
    formatMoney: (amountInBase: number, dateISO?: string) => {
      const converted = convertAmount(amountInBase, dateISO);
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    },
    loadingRates,
    t: (key: string) => {
      const msgs = getLoadedMessages(locale);
      return msgs[key] ?? (defaultMessages as Record<string, string>)[key] ?? key;
    },
  }), [locale, currency, loadingRates, ratesStore, messagesVersion, setLocale, setCurrency, prefetchRates, convertAmount]);

  return <LocaleCurrencyContext.Provider value={value}>{children}</LocaleCurrencyContext.Provider>;
}

export const useLocaleCurrency = () => {
  const context = useContext(LocaleCurrencyContext);
  if (!context) {
    throw new Error('useLocaleCurrency must be used within LocaleCurrencyProvider');
  }
  return context;
};

export type { SupportedLocale, SupportedCurrency };
