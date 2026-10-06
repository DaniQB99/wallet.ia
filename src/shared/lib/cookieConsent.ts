import { supabase } from '../api/supabase';

export interface CookiePreferences {
  status: 'accepted' | 'rejected' | 'customized';
  necessary: boolean; // Siempre true (obligatorias por RGPD/LSSI-CE)
  analytics: boolean; // Vercel Speed Insights y métricas
  preferences: boolean; // Preferencias extendidas de UI y caché
  timestamp: string;
  version: string;
}

export const STORAGE_KEY = 'wallet_ia_cookie_consent';
export const LEGACY_STORAGE_KEY = 'wallet_ia_consent';
export const COOKIE_NAME = 'wallet_cookie_consent';
export const CURRENT_POLICY_VERSION = '1.0';

/**
 * Obtiene las preferencias de cookies guardadas en localStorage o document.cookie.
 * Retorna null si el usuario aún no ha tomado una decisión.
 */
export function getStoredCookieConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as CookiePreferences;
    }

    // Fallback a document.cookie si no está en localStorage
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp(`(^|;\\s*)(${COOKIE_NAME})=([^;]*)`));
      if (match && match[3]) {
        return JSON.parse(decodeURIComponent(match[3])) as CookiePreferences;
      }
    }

    // Compatibilidad retroactiva con la clave previa 'wallet_ia_consent'
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === 'true') {
      return {
        status: 'accepted',
        necessary: true,
        analytics: true,
        preferences: true,
        timestamp: new Date().toISOString(),
        version: CURRENT_POLICY_VERSION,
      };
    }
  } catch (err) {
    console.warn('Error reading cookie preferences:', err);
  }
  return null;
}

/**
 * Guarda la elección del usuario en:
 * 1. LocalStorage (persistencia en navegador)
 * 2. Document Cookie (1 año de duración, estándar AEPD / RGPD)
 * 3. Supabase (registro de auditoría de consentimiento RGPD en user_consents si hay usuario)
 * 4. Custom Event para reactividad en la App
 */
export async function saveCookieConsent(
  choices: {
    status: 'accepted' | 'rejected' | 'customized';
    analytics: boolean;
    preferences: boolean;
  },
  userId?: string | null
): Promise<CookiePreferences> {
  const finalPrefs: CookiePreferences = {
    status: choices.status,
    necessary: true, // Siempre obligatorias
    analytics: choices.analytics,
    preferences: choices.preferences,
    timestamp: new Date().toISOString(),
    version: CURRENT_POLICY_VERSION,
  };

  const serialized = JSON.stringify(finalPrefs);

  // 1. Guardar en localStorage
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_STORAGE_KEY, 'true');
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }

  // 2. Guardar en document.cookie (1 año)
  try {
    if (typeof document !== 'undefined') {
      const maxAge = 60 * 60 * 24 * 365; // 365 días en segundos
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
        serialized
      )}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
  } catch (e) {
    console.warn('Could not set first-party cookie:', e);
  }

  // 3. Registrar auditoría RGPD en Supabase si el usuario está autenticado
  if (userId) {
    try {
      await supabase.from('user_consents').upsert(
        {
          user_id: userId,
          consent_type: 'cookie_consent',
          granted: choices.analytics,
          granted_at: finalPrefs.timestamp,
          policy_version: CURRENT_POLICY_VERSION,
        },
        { onConflict: 'user_id,consent_type,policy_version' }
      );
    } catch (err) {
      console.warn('Failed to log cookie consent in Supabase:', err);
    }
  }

  // 4. Notificar a toda la aplicación
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('wallet_cookie_consent_updated', { detail: finalPrefs })
    );
  }

  return finalPrefs;
}

/**
 * Disparador para reabrir la ventana de ajustes de cookies desde Ajustes/Privacidad
 */
export function openCookieSettings(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wallet_open_cookie_settings'));
  }
}
