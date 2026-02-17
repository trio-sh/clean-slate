# API Setup Guide - Amani's Cleaners Platform

This guide explains how to set up external API integrations for SMS notifications, Email notifications, and QR code functionality.

## Table of Contents
1. [SMS Notifications (Twilio)](#1-sms-notifications-twilio)
2. [Email Notifications (EmailJS)](#2-email-notifications-emailjs)
3. [QR Code Generation](#3-qr-code-generation)
4. [Environment Variables](#4-environment-variables)
5. [Testing Your Setup](#5-testing-your-setup)

---

## 1. SMS Notifications (Twilio)

Twilio is the recommended SMS provider for its reliability and competitive pricing (~$0.0075/SMS in Canada).

### Getting Twilio API Keys

1. **Create a Twilio Account**
   - Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Sign up for a free account (includes $15 trial credit)
   - Verify your email and phone number

2. **Get Your API Credentials**
   - Log into the [Twilio Console](https://console.twilio.com)
   - On the dashboard, you'll see:
     - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
     - **Auth Token**: Click to reveal (keep this secret!)

3. **Get a Phone Number**
   - Go to Phone Numbers → Manage → Buy a Number
   - Search for a Canadian number (for local sending)
   - Purchase a number (starts at $1.15/month)
   - Note your Twilio phone number: `+1XXXXXXXXXX`

4. **Configure Environment Variables**
   ```env
   VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
   VITE_TWILIO_FROM_NUMBER=+1XXXXXXXXXX
   ```

### Pricing
- **SMS (Canada)**: ~$0.0075/outbound message
- **Phone Number**: $1.15/month
- **No contracts** - pay as you go

### Alternative: Vonage (Nexmo)
If you prefer Vonage:
- Sign up at [https://dashboard.nexmo.com/sign-up](https://dashboard.nexmo.com/sign-up)
- Pricing is similar (~$0.0068/SMS in Canada)
- Update the `sendSMS` function in `src/lib/utils.js` to use Vonage API

---

## 2. Email Notifications (EmailJS)

EmailJS allows sending emails directly from the browser without a backend server. Perfect for client-side applications.

### Getting EmailJS API Keys

1. **Create an EmailJS Account**
   - Go to [https://www.emailjs.com/](https://www.emailjs.com/)
   - Sign up for a free account (200 emails/month free)

2. **Create an Email Service**
   - Go to Email Services → Add New Service
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the authentication steps
   - Note your **Service ID**: `service_xxxxxxx`

3. **Create an Email Template**
   - Go to Email Templates → Create New Template
   - Design your template with variables:
     ```
     Subject: {{subject}}
     
     To: {{to_email}}
     
     {{message}}
     ```
   - Save and note your **Template ID**: `template_xxxxxxx`

4. **Get Your Public Key**
   - Go to Account → General
   - Copy your **Public Key**: `xxxxxxxxxxxxxxxx`

5. **Configure Environment Variables**
   ```env
   VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
   VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
   ```

### Pricing
- **Free Tier**: 200 emails/month
- **Personal**: $10/month for 1,000 emails
- **Professional**: $25/month for 5,000 emails

### Alternative: SendGrid
For higher volume:
- Sign up at [https://sendgrid.com/](https://sendgrid.com/)
- Free tier: 100 emails/day
- Requires backend integration (API calls should be proxied through a server)

---

## 3. QR Code Generation

The platform uses the free [QR Server API](https://goqr.me/api/) for QR code generation. **No API key required!**

### How It Works

QR codes are generated automatically for:
- **Invoices** - Links to order tracking page
- **Receipts** - Quick scan for customer reference
- **Order Labels** - For staff processing

### API URL Format
```javascript
const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
```

### Usage in Code
```javascript
import { generateOrderQRCode } from './lib/utils';

// Generate QR code for order tracking
const qrCodeUrl = await generateOrderQRCode('1234567');
// Returns: URL to QR code image that links to /track/1234567
```

### Customization Options
- **size**: `100x100` to `1000x1000`
- **color**: `&color=000000` (hex without #)
- **bgcolor**: `&bgcolor=ffffff`
- **format**: `&format=png` (or svg, eps, pdf)

---

## 4. Environment Variables

Create a `.env` file in your project root with these variables:

```env
# ============================================
# SUPABASE (for live mode)
# ============================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# ============================================
# TWILIO SMS
# Get from: https://console.twilio.com
# ============================================
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_FROM_NUMBER=+1XXXXXXXXXX

# ============================================
# EMAILJS
# Get from: https://www.emailjs.com/
# ============================================
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here

# ============================================
# SMTP (Alternative to EmailJS - requires backend)
# ============================================
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your_email@gmail.com
VITE_SMTP_PASSWORD=your_app_password
VITE_SMTP_FROM_EMAIL=amaniscleaners@gmail.com
VITE_SMTP_FROM_NAME=Amani's Cleaners
```

---

## 5. Testing Your Setup

### Test in Demo Mode
By default, the platform runs in **Demo Mode** which:
- Logs SMS/Email content to console instead of sending
- Uses IndexedDB for data storage
- Requires no API keys

```javascript
// Console output example:
📱 [DEMO SMS] To: +16475550003
   Message: Amani's Cleaners: Your order #1234567 is confirmed!

📧 [DEMO EMAIL] To: customer@example.com
   Subject: Order Confirmed - #1234567
   Body: <html>...
```

### Test in Live Mode
1. Set up all environment variables
2. Toggle to "Live Mode" in the admin settings
3. Send a test notification

### Verify SMS Setup
```javascript
import { sendSMS, smsTemplates } from './lib/utils';

// Test SMS
const result = await sendSMS(
  '+1XXXXXXXXXX', // Your phone number
  smsTemplates.orderConfirmation('TEST123', '2025-02-02', 'Morning')
);
console.log(result);
```

### Verify Email Setup
```javascript
import { sendEmail, emailTemplates } from './lib/utils';

// Test Email
const order = { reference_code: 'TEST123', customer_name: 'Test User', ... };
const template = emailTemplates.orderConfirmation(order);
const result = await sendEmail('your@email.com', template.subject, template.html);
console.log(result);
```

---

## Security Best Practices

### API Keys
- **Never commit API keys** to version control
- Use `.env` files and add `.env` to `.gitignore`
- Use Vercel/Netlify environment variables for deployment

### Twilio Security
- Enable **Geo Permissions** to restrict sending to specific countries
- Set **Monthly Spend Limits** in Twilio console
- Use **Twilio Verify** for 2FA if needed

### Email Security
- Use **App Passwords** for Gmail (not your main password)
- Enable **2FA** on your email account
- Consider using a dedicated sending email address

---

## Troubleshooting

### SMS Not Sending
1. Check Twilio console for errors
2. Verify phone number format includes country code
3. Check if trial account has verified the recipient number
4. Ensure sufficient account balance

### Emails Not Delivering
1. Check EmailJS dashboard for delivery status
2. Verify template variables match
3. Check spam folder
4. Ensure service is properly connected

### QR Codes Not Loading
1. Check internet connectivity
2. Verify encoded data doesn't have special characters
3. Try a different size parameter

---

## Cost Estimation

For a business sending ~1000 orders/month:

| Service | Monthly Cost |
|---------|-------------|
| Twilio SMS (2 per order) | ~$15 |
| Twilio Phone Number | $1.15 |
| EmailJS (2 per order) | $10-25 |
| QR Codes | FREE |
| **Total** | **~$26-41/month** |

---

## Support

- **Twilio**: [support.twilio.com](https://support.twilio.com)
- **EmailJS**: [emailjs.com/docs](https://www.emailjs.com/docs/)
- **QR Server**: [goqr.me/api](https://goqr.me/api/)

For platform-specific questions, contact Amani's Cleaners development team.
