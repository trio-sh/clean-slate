import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitcher = ({ variant = 'button' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { language, setLanguage, languages } = useLanguage();

  const languageOptions = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'fa', label: 'فارسی', flag: '🇮🇷', rtl: true },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  ];

  const currentLanguage = languageOptions.find(lang => lang.code === language);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'menu') {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Language / Langue</h3>
        <div className="grid grid-cols-2 gap-2">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                language === lang.code
                  ? 'bg-amani-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span dir={lang.rtl ? 'rtl' : 'ltr'}>{lang.label}</span>
              {language === lang.code && <Check className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-5 h-5 text-gray-600" />
        <span className="hidden sm:inline text-sm font-medium text-gray-700">
          {currentLanguage?.flag} {currentLanguage?.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="py-2">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    language === lang.code
                      ? 'bg-amani-50 text-amani-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="flex-1 text-left" dir={lang.rtl ? 'rtl' : 'ltr'}>
                    {lang.label}
                  </span>
                  {language === lang.code && (
                    <Check className="w-4 h-4 text-amani-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
