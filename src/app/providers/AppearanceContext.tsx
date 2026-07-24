import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Contexto de Apariencia de Wallet.ia.
 *
 * Gestiona el tema visual (Claro/Oscuro) y la paleta de colores de acento.
 * Los cambios se persisten en local storage y se aplican mediante variables CSS nativas
 * para garantizar un alto rendimiento sin parpadeos visuales innecesarios.
 */

type Theme = 'dark' | 'light' | 'system';
type AccentColor = 'indigo' | 'emerald' | 'rose' | 'amber';

interface AppearanceContextType {
  /** Tema actual de la interfaz: 'dark' (predeterminado) o 'light' */
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  /** Actualiza el tema visual y lo persiste en localStorage */
  setTheme: (theme: Theme) => void;
  /** Color principal de la marca aplicado a botones, bordes y acentos dinámicos */
  accentColor: AccentColor;
  /** Actualiza el color de acento y sus variables CSS derivadas (--accent-primary, etc.) */
  setAccentColor: (color: AccentColor) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const THEME_KEY = 'wallet_ia_theme';
const ACCENT_KEY = 'wallet_ia_accent';

/**
 * Variables de diseño dinámicas según el color de acento seleccionado.
 * Estas variables se inyectan en el elemento root (:root) para ser consumidas por los componentes.
 */
const accentVariables: Record<AccentColor, { primary: string, primaryHover: string, gradient: string }> = {
  indigo: {
    primary: '#6366F1',
    primaryHover: '#4F46E5',
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
  },
  emerald: {
    primary: '#10B981',
    primaryHover: '#059669',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
  },
  rose: {
    primary: '#E11D48',
    primaryHover: '#BE123C',
    gradient: 'linear-gradient(135deg, #F43F5E, #E11D48)',
  },
  amber: {
    primary: '#F59E0B',
    primaryHover: '#D97706',
    gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
  }
};

/**
 * Proveedor que inyecta la lógica de diseño en el árbol de componentes.
 */
export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColorState] = useState<AccentColor>('indigo');

  // Inicialización: Recuperar preferencias guardadas del usuario
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme;
    const savedAccent = localStorage.getItem(ACCENT_KEY) as AccentColor;

    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    if (savedAccent && accentVariables[savedAccent]) setAccentColorState(savedAccent);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  };

  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor);
    localStorage.setItem(ACCENT_KEY, newColor);
  };

  /**
   * Efecto reactivo para inyectar variables CSS en el DOM.
   * Esto permite que los estilos Vanilla CSS reaccionen instantáneamente
   * a los cambios de estado del contexto sin necesidad de re-renderizar todo el árbol.
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

    // Inyección de variables CSS de acento
    const vars = accentVariables[accentColor];
    if (vars) {
      root.style.setProperty('--accent-primary', vars.primary);
      root.style.setProperty('--accent-primary-hover', vars.primaryHover);
      root.style.setProperty('--accent-gradient', vars.gradient);

      /**
       * Genera una versión con opacidad para efectos de resplandor (glow)
       * manteniendo la consistencia con el color principal.
       */
      const hex2rgba = (hex: string, alpha = 1) => {
        const [r, g, b] = hex.match(/\w\w/g)!.map(x => parseInt(x, 16));
        return `rgba(${r},${g},${b},${alpha})`;
      };
      root.style.setProperty('--accent-primary-glow', hex2rgba(vars.primary, 0.15));
    }

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

/** Hook personalizado para acceder a la configuración de apariencia de forma segura */
export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};

