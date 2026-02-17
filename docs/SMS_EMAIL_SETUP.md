# SMS & Email API Setup Guide

This guide explains how to set up SMS and Email notifications for Amani's Cleaners.

## Quick Overview

| Service | Provider | Cost | Setup Time |
|---------|----------|------|------------|
| SMS | Infobip | Pay-as-you-go | 5 min |
| Email | EmailJS | Free (200/month) | 5 min |

---

## 1. SMS Setup (Infobip)

Infobip is a global SMS provider with competitive rates and easy API integration.

### Step 1: Create Account
1. Go to [portal.infobip.com](https://portal.infobip.com)
2. Sign up with email
3. Complete account verification

### Step 2: Get API Key
1. Login to Infobip Portal
2. Go to **Developers → API Keys**
3. Click **Create API Key**
4. Give it a name (e.g., "Amani's Cleaners")
5. Copy the generated API Key

### Step 3: Get Base URL
1. In the portal, look at your account settings or the URL
2. Your base URL looks like: `https://xxxxx.api.infobip.com`
3. The `xxxxx` part is your unique subdomain

### Step 4: Add to .env
```bash
VITE_INFOBIP_BASE_URL=https://k93mj3.api.infobip.com
VITE_INFOBIP_API_KEY=your_api_key_here
VITE_INFOBIP_SENDER=AmaniClean
```

### Sender Name
- Alphanumeric sender: Up to 11 characters (e.g., "AmaniClean")
- Some countries require sender registration
- Check Infobip documentation for country-specific rules

### Pricing
- Pay-as-you-go model
- Canada: ~$0.01-0.02/SMS
- US: ~$0.01/SMS
- Free trial credits available

### API Response Codes
| Status | Meaning |
|--------|---------|
| PENDING | Message queued |
| DELIVERED | Successfully delivered |
| UNDELIVERABLE | Failed to deliver |
| REJECTED | Number blocked/invalid |

---

## 2. Email Setup (EmailJS)

EmailJS allows sending emails directly from the browser without a backend.

### Step 1: Create Account
1. Go to [emailjs.com](https://www.emailjs.com)
2. Sign up (free tier: 200 emails/month)

### Step 2: Connect Email Service
1. Go to **Email Services > Add New Service**
2. Choose **Gmail** (or your provider)
3. Click **Connect Account** and authorize

### Step 3: Create Template
1. Go to **Email Templates > Create New Template**
2. Use these template variables:
```
To: {{to_email}}
Subject: {{subject}}
Body: {{{message}}}
```

### Step 4: Get Credentials
1. **Service ID**: From Email Services page
2. **Template ID**: From Email Templates page
3. **Public Key**: From Account > General

### Step 5: Add to .env
```bash
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=XXXXXXXXXXXXXX
```

### Free Tier Limits
- 200 emails/month
- 2 email templates
- EmailJS branding in emails

### Paid Plans
- Personal: $10/month - 1,000 emails
- Professional: $25/month - 5,000 emails

---

## 3. Usage in Code

### Sending Single SMS
```javascript
import { sendSMS, smsTemplates } from './lib/utils';

// Order confirmation
await sendSMS(
  '+14165551234',
  smsTemplates.orderConfirmation('1234567', '2024-01-15', '7am-11am')
);

// Ready notification
await sendSMS(
  customer.phone,
  smsTemplates.ready(order.reference_code, '2024-01-16', '6pm-10pm')
);

// Custom message from staff
await sendSMS(
  customer.phone,
  smsTemplates.customMessage('John', 'Your special item requires extra care. We'll call you shortly.')
);
```

### Sending Bulk SMS
```javascript
import { sendBulkSMS, smsTemplates } from './lib/utils';

// Send promotional offer to multiple customers
const customerPhones = ['+14165551234', '+14165555678', '+14165559012'];
const message = smsTemplates.seasonalPromo('Winter Sale', '20% off', 'Dec 31');

const result = await sendBulkSMS(customerPhones, message);
console.log(`Sent to ${result.sent} recipients`);
```

### Sending Email
```javascript
import { sendEmail, emailTemplates } from './lib/utils';

// Order confirmation
const template = emailTemplates.orderConfirmation(order);
await sendEmail(order.customer_email, template.subject, template.html);

// Login credentials
const template = emailTemplates.loginCredentials(user, tempPassword);
await sendEmail(user.email, template.subject, template.html);
```

### Available SMS Templates

**Order Lifecycle:**
- `orderConfirmation(referenceCode, pickupDate, pickupTime)`
- `pickupReminder(referenceCode, pickupTime)`
- `pickedUp(referenceCode)`
- `processing(referenceCode)`
- `ready(referenceCode, deliveryDate, deliveryTime)`
- `outForDelivery(referenceCode, driverName)`
- `delivered(referenceCode)`

**Account & Auth:**
- `loginCredentials(email, tempPassword)`
- `quickSignIn(loginLink)`
- `passwordReset(resetLink)`
- `verifyPhone(code)`

**Invoices & Payments:**
- `invoiceReminder(referenceCode, amount, dueDate)`
- `paymentReceived(referenceCode, amount)`
- `paymentFailed(referenceCode)`
- `orderSummary(referenceCode, items, total)`

**Promotions:**
- `welcomeOffer(customerName, discountCode, discountAmount)`
- `loyaltyReward(customerName, points, reward)`
- `seasonalPromo(promoName, discount, validUntil)`
- `referralBonus(customerName, referralCode, bonus)`
- `flashSale(discount, hours)`

**Custom/Staff Messages:**
- `customMessage(customerName, message)`
- `appointmentReminder(customerName, date, time, service)`
- `feedbackRequest(customerName, referenceCode)`

**Staff/Driver:**
- `newOrderAlert(referenceCode, pickupAddress, pickupTime)`
- `driverAssignment(driverName, referenceCode, pickupAddress)`
- `shiftReminder(staffName, shiftTime, location)`

### Available Email Templates
- `orderConfirmation(order)`
- `loginCredentials(user, tempPassword)`
- `invoiceEmail(order, invoiceUrl)`

---

## 4. Demo Mode

In demo mode, all SMS and Email functions log to the console instead of sending real messages. This allows testing without incurring costs.

```javascript
// Console output in demo mode:
📱 [DEMO SMS] To: +14165551234
   Message: Amani's Cleaners: Your order #1234567 is confirmed!

📧 [DEMO EMAIL] To: customer@example.com
   Subject: Order Confirmed - #1234567 | Amani's Cleaners
   Body: <div>...</div>
```

To force live mode for testing:
```javascript
await sendSMS(phone, message, true); // Third param forces live
```

---

## 5. Production Checklist

- [ ] Infobip account created and verified
- [ ] API Key generated
- [ ] Sender name configured
- [ ] EmailJS service connected
- [ ] Email template created
- [ ] Environment variables set in .env
- [ ] Test SMS/Email in demo mode
- [ ] Test SMS/Email in live mode (with real number)
- [ ] Monitor delivery rates in Infobip dashboard

---

## 6. Troubleshooting

### SMS Not Sending
1. Check Infobip account has credits/balance
2. Verify phone number format (include country code)
3. Check API Key is correct
4. Review Infobip delivery reports for specific errors
5. Ensure sender name is valid for destination country

### Email Not Sending
1. Check EmailJS monthly limit
2. Verify email service is connected
3. Check template variables match
4. Review browser console for errors

### Common Infobip Errors

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check API Key is correct |
| BAD_REQUEST | Check phone number format |
| UNDELIVERABLE | Number may be blocked or invalid |
| REJECTED | Sender not allowed for this country |

---

## 7. Cost Estimation

### Small Business (100 orders/month)
- SMS: ~$3/month (3 messages per order)
- Email: Free (within 200 limit)
- **Total: ~$3/month**

### Medium Business (500 orders/month)
- SMS: ~$15/month
- Email: $10/month (EmailJS Personal)
- **Total: ~$25/month**

### Large Business (2000 orders/month)
- SMS: ~$60/month
- Email: $25/month (EmailJS Professional)
- **Total: ~$85/month**

---

## 8. Infobip Dashboard Features

- **Delivery Reports**: Track SMS delivery in real-time
- **Analytics**: Message volume, delivery rates, costs
- **Logs**: Full message history with statuses
- **Alerts**: Set up notifications for failures
- **Number Lookup**: Validate phone numbers before sending

---

For questions or issues, contact support@amanicleaners.com
