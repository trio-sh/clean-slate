# Amani's Cleaners - Premium Laundry & Dry Cleaning Platform

A complete full-stack laundry and dry cleaning business platform with customer ordering, staff management, driver logistics, and admin dashboard.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔐 Authentication System

### Dual Login Methods
The platform supports two login methods:

1. **Email + Password** (Uses Supabase Auth in live mode)
   - Standard email/password authentication
   - Email verification support
   - Password reset functionality
Custom implementation

2. **Phone + Password** (Custom implementation)
   - Login with phone number and password
   - Does NOT use Supabase Phone Auth (no SMS verification)
   - Uses SHA-256 password hash stored in `users.password_hash`
   - Works in both demo and live modes

### Demo Mode Credentials
All demo accounts use password: `demo123`

| Role | Email | Phone |
|------|-------|-------|
| Admin | admin@amanicleaners.com | (437) 215-6321 |
| Driver | driver@amanicleaners.com | (647) 555-0001 |
| Staff | staff@amanicleaners.com | (647) 555-0002 |
| Customer | customer@example.com | (647) 555-0003 |

### Required Fields
When creating orders, the following fields are **required**:
- First Name
- Last Name  
- Phone Number (10 digits)
- Email
- Street Address
- City
- Postal Code (Canadian format: A1A 1A1)

## 🌐 Deployment to Vercel

1. **Push to GitHub** (if not already)
2. **Import to Vercel**: Go to vercel.com → New Project → Import Git Repository
3. **Configure Environment Variables** (for live mode):
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `STRIPE_PLATFORM_SECRET_KEY` - Stripe platform secret key (Connect enabled)
   - `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
   - `STRIPE_CONNECTED_ACCOUNT_ID` - Connected account that funds are charged on
   - `STRIPE_PLATFORM_FEE_PERCENT` / `STRIPE_PLATFORM_FEE_FIXED` - Commission config
4. **Deploy**: Click Deploy

## 💳 Payments (Stripe Connect)

Online payments use **Stripe Checkout** through **Stripe Connect**. Payment links
are created as **direct charges** on the connected account (`STRIPE_CONNECTED_ACCOUNT_ID`)
via the `/api/create-payment-link` serverless function, with the platform
collecting commission through `application_fee_amount`.

> **Note:** `STRIPE_CONNECTED_ACCOUNT_ID` must point at a connected account that
> has completed onboarding (`card_payments` capability active). A direct charge
> does **not** require the `transfers` capability — that is only needed for
> destination charges, which is why an un-onboarded account fails with a
> "destination account needs the transfers capability" error.

## 📱 Features

### Customer Portal
- Browse services with real-time pricing — **Wash & Fold $2.29/lb**, **Dry Cleaning from $4.99**
- **Wash & Fold by weight** - Decimal weights supported (scale-accurate); $64 minimum order before tax
- **Reference Notes** - Optional customer reference field, visible to staff/admin/drivers on the order
- **Online payments** - Secure Stripe Checkout payment links (Stripe Connect)
- **Guest ordering** - Place orders without signing up
- Track orders by reference code with **QR codes**
- Download **invoices and receipts** (PDF) with company logo
- **Saved Addresses** - Store multiple addresses with labels (Home, Work, etc.)
- **Default Address** - Auto-select at checkout for faster ordering
- **Address Selection at Checkout** - Choose from saved addresses or enter new
- **Promo Codes** - Apply discount codes at checkout (FIRST15, SUMMER10, SAVE5)
- **Reorder** - One-click reorder from order history
- **Loyalty Program** - Earn points on orders, tier system (Bronze/Silver/Gold)
- **Referral System** - Share code, give $10, get $10
- **Password Change** - Update password from account settings
- **Notification Preferences** - Control SMS/email notifications
- Account management & order history
- Subscription plans for regular customers

### Driver Portal (/driver)
- **Daily check-in system** with GPS location logging
- Dashboard with today's tasks
- Interactive route map (OpenStreetMap/Leaflet)
- One-click navigation to addresses
- Order status updates (pickup → delivered)
- **SMS notification buttons** - "I'm On My Way", "Arriving Soon", "Pickup Reminder"
- Quick customer phone call button

### Staff Portal (/staff)
- **Daily check-in system** with GPS location
- Order queue management
- Processing workflow
- **Order editing** - Change item prices/quantities with notes
- **Invoice/Receipt generation** with company logo
- **SMS & Email notifications** to customers
- Status updates

### Admin Panel (/admin)
- Full dashboard with analytics
- **Global search** - Search orders, customers, drivers from header
- **In-app notifications** - Bell icon with notification panel
- Order management with **Order Editing** (price adjustments with notes)
- Customer/Driver/Staff management with **password creation**
- **Check-in tracking** - Monitor staff & driver attendance
- **Send login credentials** via SMS/Email (one-click button)
- **Export to CSV** - Export drivers, customers, staff lists
- Service & pricing configuration
- Reports & settings

## 🔔 Notifications (Optional)

### SMS (Infobip)
- Order confirmations & status updates
- Pickup reminders
- Ready for delivery alerts
- Driver on the way notifications
- Invoice reminders & payment confirmations
- Promotional offers & flash sales
- Welcome offers & loyalty rewards
- Custom staff messages
- Quick sign-in links

### Email (EmailJS)
- Order confirmations with tracking link
- Invoice attachments
- Login credentials

See `docs/SMS_EMAIL_SETUP.md` for setup instructions.

## 🔄 Demo vs Live Mode

The platform has two modes:
- **Demo Mode** (default): Uses IndexedDB for local storage
- **Live Mode**: Connects to Supabase for real database

Toggle between modes on the login page.

### Demo Accounts
Login at /login and select:
- **Customer**: customer@example.com
- **Driver**: driver@amanicleaners.com
- **Staff**: staff@amanicleaners.com
- **Admin**: admin@amanicleaners.com

## 🗄️ Database Setup (Supabase)

1. Create a Supabase project
2. Run `supabase-schema.sql` in the SQL Editor
3. Add environment variables to your deployment

## 📦 Order Status Flow

```
pending_pickup → picked_up → processing → ready → out_for_delivery → delivered
```

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4
- **State**: Zustand with persistence
- **Database**: Supabase (live) / IndexedDB (demo)
- **Maps**: Leaflet + OpenStreetMap
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **QR Codes**: QR Server API
- **SMS**: Infobip (optional)
- **Email**: EmailJS (optional)

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/              # CustomerLayout, DashboardLayout
│   ├── CheckInModal.jsx     # Staff/Driver check-in component
│   └── SMSComposerModal.jsx # SMS sending with templates
├── lib/
│   ├── db.js                # Database abstraction (demo/live)
│   └── utils.js             # SMS, Email, QR, Invoice utilities
├── pages/
│   ├── admin/               # Admin dashboard (9 pages)
│   ├── auth/                # Login, Register, RoleSelect
│   ├── customer/            # Homepage, Services, Order, Track (7 pages)
│   ├── driver/              # Dashboard, Routes, Delivery (3 pages)
│   └── staff/               # Dashboard, Orders, Processing (3 pages)
└── stores/index.js          # Zustand stores
docs/
└── SMS_EMAIL_SETUP.md       # SMS/Email API setup guide
```

## ✅ Staff Check-In System

Staff and drivers must check in daily before starting their shift:
1. Opens automatically when they access their portal
2. Requires GPS location permission
3. Records name, time, and precise address
4. Admin can view all check-ins with attendance tracking
5. Export check-in data to CSV

## 🧾 Invoice & Receipt Generation

- Professional invoices with business branding
- Thermal receipt format for printing
- QR codes for easy order tracking
- Download as PDF (print dialog)
- Available for guest and registered users

## 🍁 Business Info (Demo)

- **Business**: Amani's Cleaners
- **Location**: Greater Toronto Area, Ontario, Canada
- **Phone**: 437-215-6321
- **Email**: amaniscleaners@gmail.com

---

Built with ❤️ for Canadian small businesses
