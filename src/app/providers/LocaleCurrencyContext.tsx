import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadLocaleMessages, getLoadedMessages, defaultMessages } from '../../shared/config/locales/index';
import type { SupportedLocale } from '../../shared/config/locales/index';
export type { SupportedLocale };
import { supabase } from '../../shared/api/supabase';
import { useAuthContext } from './AuthContext';

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
