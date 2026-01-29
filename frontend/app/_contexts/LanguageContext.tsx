'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// @ts-ignore: Module might be missing during some type checks; ensure file exists at runtime!
import { Language, getTranslations, Translations, languageNames, languageCodes } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  languageNames: Record<Language, string>;
  languageCodes: Record<string, Language>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'tayai_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from localStorage on mount f
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr' || savedLanguage === 'nl' || savedLanguage === 'es' || savedLanguage === 'pt')) {
      setLanguageState(savedLanguage as Language);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  // Update HTML lang attribute when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: getTranslations(language),
    languageNames,
    languageCodes,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
