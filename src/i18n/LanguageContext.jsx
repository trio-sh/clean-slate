import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import en from './en.json';
import { LANGUAGES, DEFAULT_LANGUAGE, localeLoaders } from './languages';

const defaultLanguage = DEFAULT_LANGUAGE;

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

const interpolate = (str, params) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
};

const getInitialLanguage = () => {
  try {
    // Try to get from localStorage first
    const saved = localStorage.getItem('amani-language');
    if (saved && LANGUAGES[saved]) {
      return saved;
    }
  } catch {
    // storage unavailable - fall through to browser language
  }
  // Try to get from navigator
  const browserLang = navigator.language?.split('-')[0] || defaultLanguage;
  if (LANGUAGES[browserLang]) {
    return browserLang;
  }
  return defaultLanguage;
};

const applyDocumentLanguage = (lang) => {
  document.documentElement.dir = LANGUAGES[lang]?.dir || 'ltr';
  document.documentElement.lang = lang;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);
  // Messages for the active language. null until a non-English locale has loaded.
  const [messages, setMessages] = useState(() => (language === defaultLanguage ? en : null));

  const cache = useRef({ [defaultLanguage]: en });
  const latestRequest = useRef(0);

  const loadLocale = useCallback(async (lang) => {
    if (cache.current[lang]) return cache.current[lang];
    const module = await localeLoaders[lang]();
    cache.current[lang] = module.default;
    return module.default;
  }, []);

  // First load of a saved/browser non-English language. English is shown instead
  // if that locale can't be fetched (e.g. offline before it was ever cached).
  useEffect(() => {
    if (messages) return undefined;
    let cancelled = false;
    loadLocale(language)
      .then((loaded) => { if (!cancelled) setMessages(loaded); })
      .catch((error) => {
        console.error(`Failed to load "${language}" translations, using English:`, error);
        if (!cancelled) {
          setLanguageState(defaultLanguage);
          setMessages(en);
        }
      });
    return () => { cancelled = true; };
    // Runs once for the initial language only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch language: download the locale first, then swap, so the UI never
  // flashes half-translated. If several switches overlap, the latest one wins.
  const setLanguage = useCallback(async (lang) => {
    if (!LANGUAGES[lang]) return;
    const requestId = ++latestRequest.current;
    try {
      const loaded = await loadLocale(lang);
      if (requestId !== latestRequest.current) return;
      setMessages(loaded);
      setLanguageState(lang);
      try {
        localStorage.setItem('amani-language', lang);
      } catch {
        // storage unavailable - language still applies for this session
      }
    } catch (error) {
      console.error(`Failed to load "${lang}" translations:`, error);
    }
  }, [loadLocale]);

  const t = useCallback((key, params = {}) => {
    const translation = getNestedValue(messages, key);
    if (!translation) {
      // Fallback to English
      const fallback = getNestedValue(en, key);
      if (fallback) {
        return interpolate(fallback, params);
      }
      // If still not found, return the key
      return key;
    }
    return interpolate(translation, params);
  }, [messages]);

  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    dir: LANGUAGES[language]?.dir || 'ltr',
    languages: Object.fromEntries(Object.entries(LANGUAGES).map(([code, meta]) => [code, meta.label])),
  }), [language, setLanguage, t]);

  // Hold the first paint until the saved language has loaded (a fraction of a
  // second) so non-English visitors don't see a flash of English.
  if (!messages) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-busy="true">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-amani-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
