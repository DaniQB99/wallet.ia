import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadLocaleMessages, getLoadedMessages, defaultMessages } from '../../shared/config/locales/index';
import type { SupportedLocale } from '../../shared/config/locales/index';
export type { SupportedLocale };
import { supabase } from '../../shared/api/supabase';
import { useAuthContext } from './AuthContext';

import { broadcastTabSync, TAB_SYNC_CHANNEL } from '../../shared/lib/useRealtimeSync';

export type SupportedCurrency = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'MXN' | 'BRL' | 'ARS' | 'COP' | 'CLP';

interface LocaleCurrencyContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
  formatMoney: (amount: number, date?: string, currencyOverride?: SupportedCurrency) => string;
  formatDate: (date: string | Date | number, options?: Intl.DateTimeFormatOptions) => string;
  getCurrencySymbol: (currencyOverride?: SupportedCurrency) => string;
  translateEntityName: (name: string, type: 'category' | 'account') => string;
  convertAmount: (amount: number) => number; // Kept for backwards compatibility
  prefetchRates: (dates: string[]) => Promise<void>; // Dummy for backwards compatibility
  loadingRates?: boolean;
  t: (key: string) => string;
}

const LOCALE_KEY = 'wallet_ia_locale';
const CURRENCY_KEY = 'wallet_ia_currency';

const localeToCurrency: Record<SupportedLocale, SupportedCurrency> = {
  'es-ES': 'EUR',
  'en-US': 'USD',
  'fr-FR': 'EUR',
  'de-DE': 'EUR',
  'it-IT': 'EUR',
  'pt-PT': 'EUR',
};

const VALID_LOCALES: SupportedLocale[] = ['es-ES', 'en-US', 'fr-FR', 'de-DE', 'it-IT', 'pt-PT'];

const LocaleCurrencyContext = createContext<LocaleCurrencyContextType | undefined>(undefined);

export function LocaleCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      const saved = localStorage.getItem(LOCALE_KEY) as SupportedLocale | null;
      if (saved && VALID_LOCALES.includes(saved)) return saved;
    } catch {}
    return 'es-ES';
  });

  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_KEY) as SupportedCurrency | null;
      if (saved) return saved;
    } catch {}
    return 'EUR';
  });

  const [messagesVersion, setMessagesVersion] = useState(0);
  const { user } = useAuthContext();

  // Load from localStorage initially
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as SupportedLocale | null;
    const savedCurrency = localStorage.getItem(CURRENCY_KEY) as SupportedCurrency | null;

    if (savedLocale && VALID_LOCALES.includes(savedLocale)) {
      setLocaleState(savedLocale);
      void loadLocaleMessages(savedLocale).then(() => setMessagesVersion(v => v + 1));
    }

    if (savedCurrency) {
      setCurrencyState(savedCurrency);
    } else if (savedLocale && VALID_LOCALES.includes(savedLocale)) {
      setCurrencyState(localeToCurrency[savedLocale] ?? 'EUR');
    }
  }, []);

  // Sincronizar desde la nube (perfil de usuario en Supabase / Realtime)
  useEffect(() => {
    if (!user) return;

    if (user.locale && VALID_LOCALES.includes(user.locale as SupportedLocale)) {
      const cloudLocale = user.locale as SupportedLocale;
      setLocaleState(cloudLocale);
      try {
        localStorage.setItem(LOCALE_KEY, cloudLocale);
      } catch {}
      void loadLocaleMessages(cloudLocale).then(() => setMessagesVersion(v => v + 1));
    }

    if (user.currency) {
      const cloudCurr = user.currency as SupportedCurrency;
      setCurrencyState(cloudCurr);
      try {
        localStorage.setItem(CURRENCY_KEY, cloudCurr);
      } catch {}
    }
  }, [user?.locale, user?.currency]);

  // Sincronizar entre pestañas/ventanas abiertas en el mismo navegador (0ms)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      const channel = new BroadcastChannel(TAB_SYNC_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === 'LOCALE_CHANGED' && event.data.payload && VALID_LOCALES.includes(event.data.payload)) {
          const newLoc = event.data.payload as SupportedLocale;
          setLocaleState(newLoc);
          void loadLocaleMessages(newLoc).then(() => setMessagesVersion(v => v + 1));
        } else if (event.data?.type === 'CURRENCY_CHANGED' && event.data.payload) {
          setCurrencyState(event.data.payload as SupportedCurrency);
        }
      };
      return () => channel.close();
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_KEY, newLocale);
    } catch {}
    broadcastTabSync({ type: 'LOCALE_CHANGED', payload: newLocale });
    void loadLocaleMessages(newLocale).then(() => setMessagesVersion(v => v + 1));

    if (user?.id) {
      void supabase.from('profiles').update({ locale: newLocale }).eq('id', user.id);
    }
  }, [user?.id]);

  const setCurrency = useCallback((newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem(CURRENCY_KEY, newCurrency);
    } catch {}
    broadcastTabSync({ type: 'CURRENCY_CHANGED', payload: newCurrency });

    if (user?.id) {
      void supabase.from('profiles').update({ currency: newCurrency }).eq('id', user.id);
    }
  }, [user?.id]);

  const value = useMemo<LocaleCurrencyContextType>(() => ({
    locale,
    setLocale,
    currency,
    setCurrency,
    // convertAmount no longer does exchange rates, since the DB holds the raw value in the user's currency.
    convertAmount: (amount: number) => amount,
    prefetchRates: async () => { }, // Dummy function for components that still call it
    loadingRates: false,
    formatMoney: (amount: number, _date?: string, currencyOverride?: SupportedCurrency) => {
      const activeCurr = currencyOverride || currency;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: activeCurr,
        minimumFractionDigits: activeCurr === 'JPY' ? 0 : 2,
        maximumFractionDigits: activeCurr === 'JPY' ? 0 : 2,
      }).format(amount);
    },
    formatDate: (date: string | Date | number, options?: Intl.DateTimeFormatOptions) => {
      const d = new Date(date);
      return new Intl.DateTimeFormat(locale, options).format(d);
    },
    getCurrencySymbol: (currencyOverride?: SupportedCurrency) => {
      const targetCurr = currencyOverride || currency;
      return new Intl.NumberFormat(locale, { style: 'currency', currency: targetCurr }).formatToParts(0).find(x => x.type === 'currency')?.value || targetCurr;
    },
    translateEntityName: (name: string, type: 'category' | 'account') => {
      const msgs = getLoadedMessages(locale);
      let key = '';
      if (type === 'category') {
        key = `defaults.categories.${name}`;
      } else if (type === 'account' && name === 'Efectivo principal') {
        key = 'defaults.account.main';
      }
      if (key && (msgs[key] || (defaultMessages as Record<string, string>)[key])) {
        return msgs[key] ?? (defaultMessages as Record<string, string>)[key];
      }
      return name;
    },
    t: (key: string) => {
      const msgs = getLoadedMessages(locale);
      return msgs[key] ?? (defaultMessages as Record<string, string>)[key] ?? key;
    },
  }), [locale, currency, messagesVersion, setLocale, setCurrency]);

  return <LocaleCurrencyContext.Provider value={value}>{children}</LocaleCurrencyContext.Provider>;
}

export const useLocaleCurrency = () => {
  const context = useContext(LocaleCurrencyContext);
  if (!context) {
    throw new Error('useLocaleCurrency must be used within LocaleCurrencyProvider');
  }
  return context;
};
