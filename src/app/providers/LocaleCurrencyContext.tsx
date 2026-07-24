import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadLocaleMessages, getLoadedMessages, defaultMessages } from '../../shared/config/locales/index';
import type { SupportedLocale } from '../../shared/config/locales/index';
import { supabase } from '../../shared/api/supabase';
import { useAuthContext } from './AuthContext';

export type SupportedCurrency = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'MXN' | 'BRL' | 'ARS' | 'COP' | 'CLP';

interface LocaleCurrencyContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
  formatMoney: (amount: number) => string;
  convertAmount: (amount: number) => number; // Kept for backwards compatibility
  prefetchRates: (dates: string[]) => Promise<void>; // Dummy for backwards compatibility
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

const LocaleCurrencyContext = createContext<LocaleCurrencyContextType | undefined>(undefined);

export function LocaleCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('es-ES');
  const [currency, setCurrencyState] = useState<SupportedCurrency>('EUR');
  const [messagesVersion, setMessagesVersion] = useState(0);
  const { user } = useAuthContext();

  // Load from localStorage initially
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as SupportedLocale | null;
    const savedCurrency = localStorage.getItem(CURRENCY_KEY) as SupportedCurrency | null;

    if (savedLocale) {
      setLocaleState(savedLocale);
      void loadLocaleMessages(savedLocale).then(() => setMessagesVersion(v => v + 1));
    }

    if (savedCurrency) {
      setCurrencyState(savedCurrency);
    } else if (savedLocale) {
      setCurrencyState(localeToCurrency[savedLocale] ?? 'EUR');
    }
  }, []);

  // Fetch true currency from database when user logs in
  useEffect(() => {
    if (!user) return;

    const fetchUserCurrency = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('currency')
        .eq('id', user.id)
        .single();

      if (!error && data?.currency) {
        setCurrencyState(data.currency as SupportedCurrency);
        localStorage.setItem(CURRENCY_KEY, data.currency);
      }
    };

    void fetchUserCurrency();
  }, [user]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_KEY, newLocale);
    void loadLocaleMessages(newLocale).then(() => setMessagesVersion(v => v + 1));
  }, []);

  const setCurrency = useCallback((newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_KEY, newCurrency);
  }, []);

  const value = useMemo<LocaleCurrencyContextType>(() => ({
    locale,
    setLocale,
    currency,
    setCurrency,
    // convertAmount no longer does exchange rates, since the DB holds the raw value in the user's currency.
    convertAmount: (amount: number) => amount,
    prefetchRates: async () => { }, // Dummy function for components that still call it
    formatMoney: (amount: number) => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
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
