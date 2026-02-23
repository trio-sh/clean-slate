import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './en.json';
import fr from './fr.json';
import fa from './fa.json';
import es from './es.json';
import zh from './zh.json';
import it from './it.json';

const translations = {
  en,
  fr,
  fa,
  es,
  zh,
  it,
};

const defaultLanguage = 'en';

const LanguageContext = createContext({
  language: defaultLanguage,
  setLanguage: () => {},
  t: () => '',
  dir: 'ltr',
});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Helper function to get nested translation values
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : null;
  }, obj);
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    // Try to get from localStorage first
    const saved = localStorage.getItem('amani-language');
    if (saved && translations[saved]) {
      return saved;
    }
    // Try to get from navigator
    const browserLang = navigator.language?.split('-')[0] || defaultLanguage;
    if (translations[browserLang]) {
      return browserLang;
    }
    return defaultLanguage;
  });

  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('amani-language', lang);
      // Update document direction for RTL languages
      const dir = translations[lang]?.meta?.direction || 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
    }
  }, []);

  const t = useCallback((key, params = {}) => {
    const translation = getNestedValue(translations[language], key);
    if (!translation) {
      // Fallback to English
      const fallback = getNestedValue(translations.en, key);
      if (fallback) {
        return interpolate(fallback, params);
      }
      // If still not found, return the key
      return key;
    }
    return interpolate(translation, params);
  }, [language]);

  const interpolate = (str, params) => {
    if (typeof str !== 'string') return str;
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  };

  useEffect(() => {
    const dir = translations[language]?.meta?.direction || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    dir: translations[language]?.meta?.direction || 'ltr',
    languages: {
      en: translations.en.meta.language,
      fr: translations.fr.meta.language,
      fa: translations.fa.meta.language,
      es: translations.es.meta.language,
      zh: translations.zh.meta.language,
      it: translations.it.meta.language,
    },
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
