/**
 * @module locales/index
 * @description Carga dinámica de traducciones por idioma.
 *
 * Cada idioma es un JSON separado que se carga con import() dinámico,
 * lo que reduce el bundle principal en ~50KB (las traducciones que no se
 * usan nunca se descargan).
 *
 * El idioma por defecto (es-ES) se importa estáticamente para evitar
 * cualquier FOUC (flash of untranslated content) al montar la app.
 */

import esES from './es-ES.json';

export type SupportedLocale = 'es-ES' | 'en-US' | 'fr-FR' | 'de-DE' | 'it-IT' | 'pt-PT';

type Messages = Record<string, string>;

// Cache en memoria para idiomas ya cargados
const loadedLocales: Partial<Record<SupportedLocale, Messages>> = {
  'es-ES': esES,
};

/**
 * Carga las traducciones de un idioma.
 * - es-ES: Siempre disponible (import estático)
 * - Otros: Se cargan con import() dinámico y se cachean
 *
 * @returns Las traducciones del idioma solicitado
 */
export async function loadLocaleMessages(locale: SupportedLocale): Promise<Messages> {
  // Ya cacheado → retorno inmediato
  if (loadedLocales[locale]) return loadedLocales[locale]!;

  try {
    let messages: Messages;
    switch (locale) {
      case 'en-US':
        messages = (await import('./en-US.json')).default;
        break;
      case 'fr-FR':
        messages = (await import('./fr-FR.json')).default;
        break;
      case 'de-DE':
        messages = (await import('./de-DE.json')).default;
        break;
      case 'it-IT':
        messages = (await import('./it-IT.json')).default;
        break;
      case 'pt-PT':
        messages = (await import('./pt-PT.json')).default;
        break;
      default:
        messages = esES;
    }
    loadedLocales[locale] = messages;
    return messages;
  } catch {
    console.warn(`[i18n] Failed to load locale ${locale}, falling back to es-ES`);
    return esES;
  }
}

/** Acceso síncrono a las traducciones ya cargadas */
export function getLoadedMessages(locale: SupportedLocale): Messages {
  return loadedLocales[locale] ?? loadedLocales['es-ES'] ?? esES;
}

/** Traducciones por defecto (español) disponibles inmediatamente */
export const defaultMessages = esES;
