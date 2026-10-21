// i18n exports
export { LanguageProvider, useLanguage } from './LanguageContext';
export { default as LanguageSwitcher } from '../components/LanguageSwitcher';
export { LANGUAGES } from './languages';

// English is bundled with the app. Other locales are loaded on demand
// (see ./languages.js) so they are not re-exported here.
export { default as en } from './en.json';
