# Multilingual Support (i18n) - Amani Cleaners

## Overview

Amani Cleaners now supports **6 languages**:
- 🇬🇧 **English** (en)
- 🇫🇷 **Français** (fr)
- 🇮🇷 **فارسی / Farsi (Persian)** (fa) - RTL support
- 🇪🇸 **Español** (es)
- 🇨🇳 **中文 / Chinese** (zh)
- 🇮🇹 **Italiano** (it)

## File Structure

```
src/
├── i18n/
│   ├── en.json              # English translations
│   ├── fr.json              # French translations
│   ├── fa.json              # Farsi/Persian translations (RTL)
│   ├── es.json              # Spanish translations
│   ├── zh.json              # Chinese translations
│   ├── it.json              # Italian translations
│   └── LanguageContext.jsx  # Language context & provider
├── components/
│   └── LanguageSwitcher.jsx # Language switcher component
└── App.jsx                  # Main app with LanguageProvider
```

## Usage

### 1. Using the Translation Hook

```jsx
import { useLanguage } from '../i18n/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button onClick={() => setLanguage('fr')}>
        Switch to French
      </button>
    </div>
  );
}
```

### 2. Translation Key Format

Keys use dot notation for nested objects:

```javascript
// en.json
{
  "hero": {
    "title": "Premium Laundry & Dry Cleaning",
    "subtitle": "Toronto's most trusted..."
  }
}

// Usage
t('hero.title')     // "Premium Laundry & Dry Cleaning"
t('hero.subtitle')  // "Toronto's most trusted..."
```

### 3. Parameter Interpolation

```javascript
// en.json
{
  "footer": {
    "copyright": "© {year} Amani's Cleaners. All rights reserved. 🍁"
  }
}

// Usage
t('footer.copyright', { year: new Date().getFullYear() })
// "© 2026 Amani's Cleaners. All rights reserved. 🍁"
```

### 4. Language Switcher Component

```jsx
import LanguageSwitcher from '../components/LanguageSwitcher';

// Button variant (for header)
<LanguageSwitcher variant="button" />

// Menu variant (for footer/settings)
<LanguageSwitcher variant="menu" />
```

## Translation Keys Reference

### Navigation
```javascript
t('navigation.home')        // Home / Accueil / خانه / Inicio / 首页 / Home
t('navigation.services')    // Services / Services / خدمات / Servicios / 服务 / Servizi
t('navigation.pricing')     // Pricing / Tarifs / قیمت‌ها / Precios / 价格 / Prezzi
t('navigation.orderNow')    // Order Now / Commander / سفارش / Ordenar / 订购 / Ordina
```

### Hero Section
```javascript
t('hero.title')             // Premium Laundry & Dry Cleaning
t('hero.subtitle')          // Toronto's most trusted cleaning service...
t('hero.orderNow')          // Order Now — 15% Off
t('hero.proudlyCanadian')   // Proudly Canadian Since 2013
```

### Features
```javascript
t('features.whyChooseUs')           // WHY CHOOSE US
t('features.title')                 // The Amani Difference
t('features.freePickupDelivery.title')   // Free Pickup & Delivery
t('features.sameDayService.title')       // Same Day Service
t('features.qualityGuaranteed.title')    // Quality Guaranteed
t('features.ecoFriendly.title')          // Eco-Friendly
```

### FAQ
```javascript
t('faq.title')              // FAQ
t('faq.heading')            // Frequently Asked Questions
t('faq.pricing.question')   // How Does Pricing Work?
t('faq.preparation.question') // How Do I Prepare My Order?
t('faq.sorting.question')   // Do I Need to Separate Whites & Darks?
t('faq.languages.question') // Languages We Speak
```

### Order Page
```javascript
t('order.title')            // Order Online
t('order.orderType')        // How would you like to order?
t('order.pickup')           // Pickup & Delivery
t('order.laundryRegular')   // Wash & Fold (Regular)
t('order.laundryCommercial') // Wash & Fold (Commercial)
t('order.addons')           // Premium Add-ons
t('order.lowHeatDry')       // Low Heat Dry
t('order.hypoallergenic')   // Hypoallergenic Wash
t('order.sameDayRush')      // Same Day Rush
```

## RTL Support

Farsi (Persian) is a right-to-left language. The system automatically handles RTL:

```jsx
// The LanguageProvider sets document direction automatically
{
  "meta": {
    "language": "فارسی",
    "code": "fa",
    "direction": "rtl"  // This triggers RTL layout
  }
}
```

CSS automatically adjusts:
```css
/* In index.css or global styles */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .some-element {
  margin-left: 0;
  margin-right: 1rem;
}
```

## Adding New Translations

### Step 1: Add to English (en.json)
```json
{
  "newSection": {
    "title": "New Feature",
    "description": "Description of the feature"
  }
}
```

### Step 2: Add to All Language Files
Copy the structure to each language file (fr.json, fa.json, es.json, zh.json, it.json) with appropriate translations.

### Step 3: Use in Components
```jsx
const { t } = useLanguage();
<h2>{t('newSection.title')}</h2>
```

## Language Persistence

The selected language is automatically:
1. Saved to `localStorage` as `amani-language`
2. Restored on page reload
3. Applied to document `dir` and `lang` attributes

## Best Practices

1. **Always use translation keys** - Never hardcode text in components
2. **Keep keys descriptive** - Use `hero.title` not `h1.text`
3. **Fallback to English** - Missing translations fall back to English
4. **Test RTL layouts** - Always test Farsi translation for RTL issues
5. **Use parameters** - For dynamic values, use `{param}` syntax
6. **Keep files organized** - Group related translations together

## Common Issues

### Issue: Translation returns the key
**Solution:** Check if the key exists in the translation file

### Issue: RTL layout broken
**Solution:** Ensure `dir="rtl"` is set on `<html>` element (handled automatically)

### Issue: Language not persisting
**Solution:** Check localStorage permissions and browser settings

## API Reference

### useLanguage Hook

```typescript
interface LanguageContext {
  language: string;           // Current language code
  setLanguage: (code: string) => void;  // Change language
  t: (key: string, params?: object) => string;  // Translate
  dir: 'ltr' | 'rtl';         // Text direction
  languages: {                // Available languages
    en: string;
    fr: string;
    fa: string;
    es: string;
    zh: string;
    it: string;
  };
}
```

## Future Enhancements

- [ ] Add more languages (Arabic, Portuguese, German, etc.)
- [ ] Implement lazy loading for translation files
- [ ] Add language detection based on user location
- [ ] Create admin interface for managing translations
- [ ] Add translation completeness checking
