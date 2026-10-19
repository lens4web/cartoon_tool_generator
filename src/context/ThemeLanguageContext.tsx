'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, Translations, translations } from '@/lib/i18n';

export type Theme = 'light' | 'dark';

interface ThemeLanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'cartoon_tool_lang';
const THEME_STORAGE_KEY = 'cartoon_tool_theme';

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ru');
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage or system defaults on mount
  useEffect(() => {
    // 1. Language detection
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
    if (savedLang === 'ru' || savedLang === 'en') {
      setLanguageState(savedLang);
    } else {
      // Detect system language
      const sysLang = (navigator.language || navigator.languages?.[0] || 'en').toLowerCase();
      const isRussianFamily = ['ru', 'be', 'uk', 'kk', 'ky', 'uz', 'tg'].some((prefix) =>
        sysLang.startsWith(prefix)
      );
      const defaultLang: Language = isRussianFamily ? 'ru' : 'en';
      setLanguageState(defaultLang);
    }

    // 2. Theme detection
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
    setMounted(true);
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

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === 'ru' ? 'en' : 'ru';
    setLanguage(nextLang);
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
    const dict = translations[language] || translations.ru;
    let text = dict[key] || translations.ru[key] || String(key);
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
        setLanguage,
        toggleLanguage,
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
