# Translation Integration Guide - Amani Cleaners

## ✅ Completed

### Core Infrastructure
- [x] Translation files for 6 languages (en, fr, fa, es, zh, it)
- [x] LanguageContext with useLanguage hook
- [x] LanguageSwitcher component
- [x] LanguageProvider wrapped in App.jsx
- [x] Language switcher in CustomerLayout header and footer

### HomePage Translations
- [x] Hero section title, subtitle, buttons
- [x] Feature pills (Same-Day, Satisfaction, Eco-Friendly, Rated)
- [x] Features section (titles and descriptions)
- [x] Services section (service names)
- [x] Testimonials (locations and review text)
- [x] Stats labels

## 📝 Quick Integration Guide for Remaining Pages

### Step 1: Import useLanguage Hook

```jsx
import { useLanguage } from '../../i18n/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  // ...
}
```

### Step 2: Replace Hardcoded Text

**Before:**
```jsx
<h1>Welcome to Amani Cleaners</h1>
<button>Order Now</button>
<p>Free pickup and delivery</p>
```

**After:**
```jsx
<h1>{t('auth.welcome')}</h1>
<button>{t('navigation.orderNow')}</button>
<p>{t('features.freePickupDelivery.title')}</p>
```

### Step 3: Add Missing Translation Keys

Add new keys to `src/i18n/en.json`:

```json
{
  "myNewPage": {
    "title": "My Page Title",
    "description": "Page description text",
    "button": "Click me"
  }
}
```

Then translate to all language files (fr.json, fa.json, es.json, zh.json, it.json).

## 📋 Pages Requiring Translation Integration

### 1. OrderPage.jsx (High Priority)
**Key sections to translate:**
- Order type selection (Pickup/Drop-off)
- Cart items section
- Add-ons section
- Contact form fields
- Address form fields
- Schedule section
- Payment section
- Order summary

**Example:**
```jsx
// Add import
import { useLanguage } from '../../i18n/LanguageContext';

// In component
const { t } = useLanguage();

// Replace
<h2>Your Items ({items.length})</h2>
→ <h2>{t('order.yourItems')} ({items.length})</h2>

// Replace
<label>First Name *</label>
→ <label>{t('order.firstName')} *</label>
```

### 2. ServicesPage.jsx
**Key sections:**
- Page title
- Service categories
- Service names and descriptions
- Add to cart buttons
- Price displays

### 3. PricingPage.jsx
**Key sections:**
- Pricing tiers
- Feature lists
- Plan names
- CTA buttons

### 4. TrackOrderPage.jsx
**Key sections:**
- Title and input placeholder
- Status labels (Pending, Confirmed, etc.)
- Error messages
- Success messages

### 5. AccountPage.jsx
**Key sections:**
- Profile sections
- Order history
- Settings labels
- Form fields

### 6. Auth Pages (LoginPage.jsx, RegisterPage.jsx)
**Key sections:**
- Form labels
- Error messages
- Button text
- Links

### 7. Application Pages
- PartnerApplicationPage.jsx
- DriverApplicationPage.jsx
- CareerApplicationPage.jsx

## 🔑 Common Translation Keys Reference

### Forms
```javascript
t('order.firstName')      // First Name
t('order.lastName')       // Last Name
t('order.email')          // Email
t('order.phone')          // Phone
t('order.address')        // Address
t('order.city')           // City
t('order.postalCode')     // Postal Code
t('order.notes')          // Notes
```

### Buttons
```javascript
t('common.save')          // Save
t('common.cancel')        // Cancel
t('common.submit')        // Submit
t('common.delete')        // Delete
t('common.edit')          // Edit
t('order.placeOrder')     // Place Order
```

### Status
```javascript
t('track.status.pending')     // Pending
t('track.status.confirmed')   // Confirmed
t('track.status.picked_up')   // Picked Up
t('track.status.processing')  // Processing
t('track.status.ready')       // Ready
t('track.status.delivered')   // Delivered
t('track.status.completed')   // Completed
t('track.status.cancelled')   // Cancelled
```

### Validation
```javascript
t('validation.required')     // This field is required
t('validation.invalidEmail') // Please enter a valid email
t('validation.invalidPhone') // Please enter a valid phone
t('validation.passwordMismatch') // Passwords do not match
```

### Messages
```javascript
t('common.loading')     // Loading...
t('common.error')       // Error
t('common.success')     // Success
t('errors.generic')     // Something went wrong
t('errors.network')     // Network error
```

## 🎯 Best Practices

1. **Always use translation keys** - Never hardcode user-visible text
2. **Use fallback values** - `t('key') || 'Fallback Text'`
3. **Keep keys descriptive** - `order.firstName` not `form.input1`
4. **Group related keys** - All order keys under `order.*`
5. **Test RTL** - Always check Farsi (fa) translation for RTL layout
6. **Update all languages** - When adding new keys, update all 6 files

## 🚀 Quick Start for Each Page

```bash
# For each page, follow these steps:
1. Add import: import { useLanguage } from '../../i18n/LanguageContext';
2. Get hook: const { t } = useLanguage();
3. Find all hardcoded strings (use grep/search)
4. Replace with t('key') calls
5. Add keys to en.json
6. Translate to all 5 other languages
7. Test in each language
```

## 📊 Translation Progress Tracker

| Page | Status | Progress |
|------|--------|----------|
| HomePage | ✅ Done | 100% |
| CustomerLayout | ✅ Done | 100% |
| OrderPage | ⏳ Pending | 0% |
| ServicesPage | ⏳ Pending | 0% |
| PricingPage | ⏳ Pending | 0% |
| TrackOrderPage | ⏳ Pending | 0% |
| AccountPage | ⏳ Pending | 0% |
| LoginPage | ⏳ Pending | 0% |
| RegisterPage | ⏳ Pending | 0% |
| PartnerApplicationPage | ⏳ Pending | 0% |
| DriverApplicationPage | ⏳ Pending | 0% |
| CareerApplicationPage | ⏳ Pending | 0% |

## 🛠️ Useful Commands

```bash
# Find all hardcoded strings in JSX
grep -r "className.*>" src/pages/customer/*.jsx | grep -v "t("

# Check for untranslated text
grep -E '>[A-Za-z ]+<' src/pages/**/*.jsx | grep -v "t("
```

## 📞 Need Help?

Refer to:
- `src/i18n/README.md` - Full documentation
- `src/i18n/en.json` - Master translation file
- `src/pages/customer/HomePage.jsx` - Example implementation

---

**Last Updated:** 2026-02-23
**Languages Supported:** 6 (English, French, Farsi, Spanish, Chinese, Italian)
