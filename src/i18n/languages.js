// Language registry. Labels and text direction are static so the switcher and
// <html dir> work before a locale file has loaded. English is bundled with the
// app (default + fallback); every other locale is a separate chunk that is only
// downloaded when that language is selected.
export const LANGUAGES = {
  en: { label: 'English', dir: 'ltr' },
  fr: { label: 'Français', dir: 'ltr' },
  fa: { label: 'فارسی', dir: 'rtl' },
  es: { label: 'Español', dir: 'ltr' },
  zh: { label: '中文', dir: 'ltr' },
  it: { label: 'Italiano', dir: 'ltr' },
  he: { label: 'עברית', dir: 'rtl' },
  ru: { label: 'Русский', dir: 'ltr' },
  ig: { label: 'Igbo', dir: 'ltr' },
};

export const DEFAULT_LANGUAGE = 'en';

export const localeLoaders = {
  fr: () => import('./fr.json'),
  fa: () => import('./fa.json'),
  es: () => import('./es.json'),
  zh: () => import('./zh.json'),
  it: () => import('./it.json'),
  he: () => import('./he.json'),
  ru: () => import('./ru.json'),
  ig: () => import('./ig.json'),
};
