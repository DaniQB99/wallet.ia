import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
type AccentColor = 'indigo' | 'emerald' | 'rose' | 'amber';

interface AppearanceContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const THEME_KEY = 'wallet_ia_theme';
const ACCENT_KEY = 'wallet_ia_accent';

// Definir variables CSS por color de acento
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

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [accentColor, setAccentColorState] = useState<AccentColor>('indigo');

  // Cargar estado inicial
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme;
    const savedAccent = localStorage.getItem(ACCENT_KEY) as AccentColor;

    if (savedTheme) setThemeState(savedTheme);
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

  // Aplicar variables CSS al root
  useEffect(() => {
    const root = document.documentElement;

    // Aplicar tema (para futuras implementaciones del modo claro, de momento forzamos la estructura)
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme'); // default es dark
    }

    // Aplicar variables de color de acento
    const vars = accentVariables[accentColor];
    if (vars) {
      root.style.setProperty('--accent-primary', vars.primary);
      root.style.setProperty('--accent-primary-hover', vars.primaryHover);
      root.style.setProperty('--accent-gradient', vars.gradient);
      // Para generar el glow con opacidad
      const hex2rgba = (hex: string, alpha = 1) => {
        const [r, g, b] = hex.match(/\w\w/g)!.map(x => parseInt(x, 16));
        return `rgba(${r},${g},${b},${alpha})`;
      };
      root.style.setProperty('--accent-primary-glow', hex2rgba(vars.primary, 0.15));
    }
  }, [theme, accentColor]);

  return (
    <AppearanceContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};
