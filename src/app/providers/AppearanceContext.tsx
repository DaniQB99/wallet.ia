import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from './AuthContext';
import { supabase } from '../../shared/api/supabase';
import { broadcastTabSync, TAB_SYNC_CHANNEL, type TabSyncMessage } from '../../shared/lib/useRealtimeSync';

/**
 * Contexto de Apariencia de Wallet.ia.
 *
 * Gestiona el tema visual (Claro/Oscuro/Sistema) y el color de acento personalizado.
 * Soporta cualquier color hexadecimal libre (#RRGGBB) mediante escala dinámica,
 * computando las variables CSS nativas (--accent-primary, hover, glow, gradient)
 * para un rendimiento instantáneo sin recargas visuales.
 */

export type Theme = 'dark' | 'light' | 'system';
export type AccentColor = string;

interface AppearanceContextType {
  /** Tema actual de la interfaz: 'dark' (predeterminado) o 'light' */
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  /** Actualiza el tema visual y lo persiste en localStorage */
  setTheme: (theme: Theme) => void;
  /** Color principal de la marca aplicado a botones, bordes y acentos dinámicos (#HEX) */
  accentColor: AccentColor;
  /** Actualiza el color de acento y sus variables CSS derivadas (--accent-primary, etc.) */
  setAccentColor: (color: AccentColor) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const THEME_KEY = 'wallet_ia_theme';
const ACCENT_KEY = 'wallet_ia_accent';

// Compatibilidad con presets heredados
const LEGACY_ACCENTS: Record<string, string> = {
  indigo: '#6366F1',
  emerald: '#10B981',
  rose: '#E11D48',
  amber: '#F59E0B',
};

/**
 * Calcula dinámicamente las variables de diseño CSS a partir de cualquier código hexadecimal.
 */
export const resolveAccentVariables = (rawColor: string) => {
  const hex = LEGACY_ACCENTS[rawColor] || (rawColor?.startsWith('#') ? rawColor : '#6366F1');
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2) || '63', 16);
  const g = parseInt(cleanHex.substring(2, 4) || '66', 16);
  const b = parseInt(cleanHex.substring(4, 6) || 'F1', 16);

  // Hover un 15% más oscuro/profundo
  const hoverR = Math.max(0, Math.floor(r * 0.85));
  const hoverG = Math.max(0, Math.floor(g * 0.85));
  const hoverB = Math.max(0, Math.floor(b * 0.85));
  const primaryHover = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`;

  // Gradiente armónico desplazando ligeramente la luminosidad
  const gradR = Math.min(255, Math.floor(r * 1.15 + 10));
  const gradG = Math.min(255, Math.floor(g * 1.05));
  const gradB = Math.min(255, Math.floor(b * 1.2 + 15));
  const gradientSecond = `#${gradR.toString(16).padStart(2, '0')}${gradG.toString(16).padStart(2, '0')}${gradB.toString(16).padStart(2, '0')}`;
  const gradient = `linear-gradient(135deg, ${hex}, ${gradientSecond})`;

  return {
    hex,
    primary: hex,
    primaryHover,
    gradient,
    r,
    g,
    b,
  };
};

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  try {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
  } catch {
    // Fallback si localStorage no está disponible o lanza error de seguridad
  }
  return 'system';
};

const getInitialResolvedTheme = (prefTheme: Theme): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  if (prefTheme === 'light') return 'light';
  if (prefTheme === 'dark') return 'dark';
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // Fallback si matchMedia no está soportado en el entorno
  }
  return 'dark';
};

const getInitialAccent = (): AccentColor => {
  if (typeof window === 'undefined') return '#F71E5D';
  try {
    const savedAccent = localStorage.getItem(ACCENT_KEY);
    if (savedAccent) {
      if (LEGACY_ACCENTS[savedAccent]) return LEGACY_ACCENTS[savedAccent];
      if (savedAccent.startsWith('#')) return savedAccent;
    }
  } catch {
    // Fallback al color de acento predeterminado
  }
  return '#F71E5D';
};

/**
 * Proveedor que inyecta la lógica de diseño en el árbol de componentes.
 */
export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const userId = user?.id;

  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => getInitialResolvedTheme(getInitialTheme()));
  const [accentColor, setAccentColorState] = useState<AccentColor>(getInitialAccent);

  // Inicialización: Sincronizar cambios externos de localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme;
    const savedAccent = localStorage.getItem(ACCENT_KEY);

    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    if (savedAccent) {
      const resolved = LEGACY_ACCENTS[savedAccent] || (savedAccent.startsWith('#') ? savedAccent : null);
      if (resolved) setAccentColorState(resolved);
    }
  }, []);

  // Sincronizar desde la nube (perfil del usuario en Supabase)
  useEffect(() => {
    if (!user) return;
    if (user.theme && ['light', 'dark', 'system'].includes(user.theme)) {
      setThemeState(user.theme as Theme);
      try {
        localStorage.setItem(THEME_KEY, user.theme);
      } catch {
        // ignore
      }
    }
    if (user.accent_color) {
      const resolved = LEGACY_ACCENTS[user.accent_color] || (user.accent_color.startsWith('#') ? user.accent_color : null);
      if (resolved) {
        setAccentColorState(resolved);
        try {
          localStorage.setItem(ACCENT_KEY, resolved);
        } catch {
          // ignore
        }
      }
    }
  }, [user?.theme, user?.accent_color]);

  // Sincronizar cambios entre pestañas/ventanas abiertas en el mismo navegador (0ms)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      const bc = new BroadcastChannel(TAB_SYNC_CHANNEL);
      bc.onmessage = (event: MessageEvent<TabSyncMessage>) => {
        if (event.data?.type === 'APPEARANCE_CHANGE') {
          if (event.data.theme && ['light', 'dark', 'system'].includes(event.data.theme)) {
            setThemeState(event.data.theme as Theme);
          }
          if (event.data.accentColor) {
            const resolved = LEGACY_ACCENTS[event.data.accentColor] || (event.data.accentColor.startsWith('#') ? event.data.accentColor : null);
            if (resolved) setAccentColorState(resolved);
          }
        }
      };
      return () => bc.close();
    } catch {
      // ignore
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {
      // ignore
    }
    broadcastTabSync({ type: 'APPEARANCE_CHANGE', theme: newTheme });

    if (userId) {
      void supabase
        .from('profiles')
        .update({ theme: newTheme, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  };

  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor);
    try {
      localStorage.setItem(ACCENT_KEY, newColor);
    } catch {
      // ignore
    }
    broadcastTabSync({ type: 'APPEARANCE_CHANGE', accentColor: newColor });

    if (userId) {
      void supabase
        .from('profiles')
        .update({ accent_color: newColor, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  };

  /**
   * Efecto reactivo para inyectar variables CSS en el DOM (:root).
   */
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme: 'dark' | 'light' = media.matches ? 'dark' : 'light';
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setResolvedTheme(currentTheme);

    // Gestión del tema mediante el atributo data-theme
    if (currentTheme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme'); // default es dark
    }

    // Inyección de variables CSS de acento dinámicas
    const vars = resolveAccentVariables(accentColor);
    root.style.setProperty('--accent-primary', vars.primary);
    root.style.setProperty('--accent-primary-hover', vars.primaryHover);
    root.style.setProperty('--accent-gradient', vars.gradient);
    root.style.setProperty('--accent-primary-rgb', `${vars.r}, ${vars.g}, ${vars.b}`);
    root.style.setProperty('--accent-primary-glow', `rgba(${vars.r}, ${vars.g}, ${vars.b}, 0.15)`);
    root.style.setProperty('--accent-primary-glow-strong', `rgba(${vars.r}, ${vars.g}, ${vars.b}, 0.35)`);

    if (theme === 'system') {
      const onChange = (e: MediaQueryListEvent) => {
        const nextSystemTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextSystemTheme);
        if (nextSystemTheme === 'light') {
          root.setAttribute('data-theme', 'light');
        } else {
          root.removeAttribute('data-theme');
        }
      };
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
  }, [theme, accentColor]);

  return (
    <AppearanceContext.Provider value={{ theme, resolvedTheme, setTheme, accentColor, setAccentColor }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance debe utilizarse dentro de un AppearanceProvider');
  }
  return context;
}
