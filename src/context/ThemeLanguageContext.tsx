'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, Translations, translations } from '@/lib/i18n';

export type Theme = 'light' | 'dark';

interface ThemeLanguageContextType {
  language: Language;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'cartoon_tool_theme';

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language: Language = 'en';
  const [theme, setThemeState] = useState<Theme>('dark');

  // Initialize theme from localStorage or system defaults on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    let initialTheme: Theme = 'dark';
    if (savedTheme === 'light' || savedTheme === 'dark') {
      initialTheme = savedTheme;
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      initialTheme = prefersDark ? 'dark' : 'light';
    }

    setThemeState(initialTheme);
    applyThemeClass(initialTheme);
    document.documentElement.lang = 'en';
  }, []);

  const applyThemeClass = (newTheme: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeClass(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const t = (key: keyof Translations, params?: Record<string, string | number>): string => {
    const dict = translations.en;
    let text = dict[key] || String(key);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        language,
        theme,
        setTheme,
        toggleTheme,
        t,
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export function useThemeLanguage(): ThemeLanguageContextType {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
}
