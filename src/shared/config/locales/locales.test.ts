import { describe, it, expect } from 'vitest';
import {
  loadLocaleMessages,
  getLoadedMessages,
  defaultMessages,
  type SupportedLocale,
} from './index';

import esES from './es-ES.json';
import enUS from './en-US.json';
import deDE from './de-DE.json';
import frFR from './fr-FR.json';
import itIT from './it-IT.json';
import ptPT from './pt-PT.json';

describe('i18n locale loading and contract integrity', () => {
  const supportedLocales: SupportedLocale[] = [
    'es-ES',
    'en-US',
    'de-DE',
    'fr-FR',
    'it-IT',
    'pt-PT',
  ];

  const localeMap: Record<SupportedLocale, Record<string, string>> = {
    'es-ES': esES,
    'en-US': enUS,
    'de-DE': deDE,
    'fr-FR': frFR,
    'it-IT': itIT,
    'pt-PT': ptPT,
  };

  it('should have exact key parity across all 6 languages', () => {
    const baseKeys = Object.keys(esES).sort();

    for (const locale of supportedLocales) {
      const currentKeys = Object.keys(localeMap[locale]).sort();
      expect(currentKeys).toEqual(baseKeys);
    }
  });

  it('should not contain empty string values in any language', () => {
    for (const locale of supportedLocales) {
      const dict = localeMap[locale];
      for (const [key, value] of Object.entries(dict)) {
        expect(
          value.trim().length,
          `Key "${key}" in ${locale} must not be empty`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('should load dynamic locale messages with loadLocaleMessages', async () => {
    const enMessages = await loadLocaleMessages('en-US');
    expect(enMessages).toBeDefined();
    expect(enMessages.dashboard).toBe('Dashboard');

    const frMessages = await loadLocaleMessages('fr-FR');
    expect(frMessages).toBeDefined();
    expect(frMessages.dashboard).toBe('Tableau de Bord');
  });

  it('should return cached or default messages in getLoadedMessages', () => {
    const defaultLoaded = getLoadedMessages('es-ES');
    expect(defaultLoaded).toEqual(defaultMessages);
  });
});
