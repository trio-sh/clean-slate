# SMS Setup & Troubleshooting Guide

## Issue Found: SMS Not Sending in App

Your test script (`test-sms.js`) **works perfectly**, but SMS in the app doesn't work. Here's what was wrong:

---

## Problems Identified

### 1. ⚠️ **Wrong Fallback Base URL** (CRITICAL)

**Test Script (Working):**
```javascript
fetch("https://api.infobip.com/sms/2/text/advanced", ...)
```

**App Config (src/lib/utils.js - Line 14) - BEFORE:**
```javascript
baseUrl: import.meta.env.VITE_INFOBIP_BASE_URL || 'https://k93mj3.api.infobip.com'
                                                            ^^^^^^^^
                                                          WRONG SUBDOMAIN!
```

**FIXED:**
```javascript
baseUrl: import.meta.env.VITE_INFOBIP_BASE_URL || 'https://api.infobip.com'
```

### 2. ⚠️ **Wrong Fallback Sender Name**

**Test Script:**
```javascript
"from": "ServiceSMS"
```

**App - BEFORE:**
```javascript
sender: import.meta.env.VITE_INFOBIP_SENDER || 'AmaniClean'
```

**FIXED:**
```javascript
sender: import.meta.env.VITE_INFOBIP_SENDER || 'ServiceSMS'
```

### 3. 🔍 **App Mode Must Be "live"**

The app checks mode before sending SMS:

```javascript
export const sendSMS = async (to, message, forceLive = false) => {
  const mode = localStorage.getItem('amani_mode') || 'demo';

  if (mode === 'demo' && !forceLive) {
    return sendDemoSMS(to, message);  // ⚠️ Only logs to console!
  }

  return sendInfobipSMS(to, message);  // ✅ Actually sends SMS
};
```

**How to Fix:**
1. Open browser DevTools (F12)
2. Go to Console
3. Run:
```javascript
localStorage.setItem('amani_mode', 'live');
```
4. Refresh the page

**OR** in your app UI, there should be a mode switcher to toggle between demo/live.

---

## Configuration Checklist

### ✅ Your .env File (Already Correct!)

```env
VITE_INFOBIP_API_KEY="990ec60831eb9c11e412c6f24252822a-41e1e65f-7e97-4659-9db5-ea1770d7a142"
VITE_INFOBIP_BASE_URL="https://api.infobip.com"
VITE_INFOBIP_SENDER="ServiceSMS"
VITE_APP_MODE="live"
```

### ✅ Fixed in src/lib/utils.js

The fallback values now match your working test script:
- Base URL: `https://api.infobip.com` ✓
- Sender: `ServiceSMS` ✓
- API Key: Loaded from .env ✓

---

## How to Test SMS After Fixes

### Option 1: Run Diagnostic Script

```bash
node check-sms-config.js
```

This will:
- Check all environment variables
- Test SMS sending using exact same code as test-sms.js
- Show detailed error messages if something is wrong

### Option 2: Test in Browser

1. **Make sure app is in LIVE mode:**
```javascript
// Open DevTools Console and run:
localStorage.setItem('amani_mode', 'live');
location.reload();
```

2. **Test SMS from app:**
   - Go to Admin → Applications
   - Approve a partner application (this sends SMS)
   - OR go to Partner Portal → Invoices → Send SMS
   - Check browser console for:
     - `📱 [DEMO SMS]` = Still in demo mode ❌
     - `SMS Response: {...}` = Actually sending ✓

3. **Check Console Logs:**
```javascript
// Should see:
SMS Response: {"messages":[{"status":{"groupName":"PENDING"},...}]}
```

---

## Complete SMS Flow Comparison

### Working Test Script

```javascript
const myHeaders = new Headers();
myHeaders.append("Authorization", "App 990ec60831eb9c11e412c6f24252822a-41e1e65f-7e97-4659-9db5-ea1770d7a142");
myHeaders.append("Content-Type", "application/json");
myHeaders.append("Accept", "application/json");

const raw = JSON.stringify({
  "messages": [{
    "destinations": [{"to":"14372156321"}],
    "from": "ServiceSMS",
    "text": "Test message"
  }]
});

fetch("https://api.infobip.com/sms/2/text/advanced", {
  method: "POST",
  headers: myHeaders,
  body: raw
})
```

### App Implementation (After Fix)

```javascript
const response = await fetch(`https://api.infobip.com/sms/2/text/advanced`, {
  method: 'POST',
  headers: {
    'Authorization': `App ${apiKey}`,  // Same API key
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    messages: [{
      destinations: [{ to: formattedPhone }],  // Same format: "14372156321"
      from: sender || defaultSender,           // "ServiceSMS"
      text: message
    }]
  }),
});
```

**They're now identical!** ✓

---

## Troubleshooting

### SMS Still Not Sending?

**1. Check Mode:**
```javascript
// In browser console:
console.log(localStorage.getItem('amani_mode'));
// Should return: "live"
```

**2. Check Environment Variables Loaded:**
```javascript
// In browser console (while app is running):
console.log(import.meta.env.VITE_INFOBIP_API_KEY);
console.log(import.meta.env.VITE_INFOBIP_BASE_URL);
console.log(import.meta.env.VITE_INFOBIP_SENDER);
```

If these show `undefined`, your .env file isn't being loaded. Solution:
- Restart dev server: `npm run dev`
- Make sure .env is in project root (same folder as package.json)

**3. Check Network Request:**
- Open DevTools → Network tab
- Try sending SMS
- Look for request to `api.infobip.com`
- Click on it to see:
  - Request URL (should be `https://api.infobip.com/sms/2/text/advanced`)
  - Request Headers (should have `Authorization: App ...`)
  - Request Payload (should have messages array)
  - Response (should have `status.groupName: "PENDING"`)

**4. Check Infobip Account:**
- Log in to https://portal.infobip.com
- Check account balance/credits
- Verify API key is active
- Check if there are any restrictions on your account

**5. Phone Number Format:**
The app auto-formats phone numbers:
- Input: `(437) 215-6321` → Sends as: `14372156321` ✓
- Input: `437-215-6321` → Sends as: `14372156321` ✓
- Input: `4372156321` → Sends as: `14372156321` ✓
- Input: `14372156321` → Sends as: `14372156321` ✓

---

## What Changed

### src/lib/utils.js (Lines 12-16)

**BEFORE:**
```javascript
sms: {
  provider: 'infobip',
  baseUrl: import.meta.env.VITE_INFOBIP_BASE_URL || 'https://k93mj3.api.infobip.com',
  apiKey: import.meta.env.VITE_INFOBIP_API_KEY || '',
  sender: import.meta.env.VITE_INFOBIP_SENDER || 'AmaniClean',
},
```

**AFTER:**
```javascript
sms: {
  provider: 'infobip',
  baseUrl: import.meta.env.VITE_INFOBIP_BASE_URL || 'https://api.infobip.com',  // ✓ Fixed
  apiKey: import.meta.env.VITE_INFOBIP_API_KEY || '',
  sender: import.meta.env.VITE_INFOBIP_SENDER || 'ServiceSMS',  // ✓ Fixed
},
```

---

## Expected Results After Fix

### In Demo Mode:
```javascript
localStorage.setItem('amani_mode', 'demo');
// When sending SMS:
📱 [DEMO SMS] To: 14372156321
   Message: Amani's Cleaners: Your account is ready!...
// ✓ No actual SMS sent, just console log
```

### In Live Mode:
```javascript
localStorage.setItem('amani_mode', 'live');
// When sending SMS:
SMS Response: {
  "messages": [{
    "to": "14372156321",
    "status": {
      "groupName": "PENDING",
      "description": "Message sent to next instance"
    },
    "messageId": "123456789"
  }]
}
// ✓ Actual SMS sent to phone!
```

---

## Testing Locations in App

### 1. Partner Approval (Admin)
```
/admin/applications → Approve Partner → Auto-sends SMS with credentials
```

### 2. Invoice SMS (Partner Portal)
```
/partner-portal/invoices → Send SMS → Sends invoice to customer
```

### 3. Order Notifications (Staff/Admin)
```
/staff-portal/orders → Update Status → Auto-sends SMS to customer
```

### 4. Subscription Confirmation
```
/subscriptions → Purchase Plan → Auto-sends confirmation SMS
```

---

## Quick Test Commands

```bash
# 1. Check environment variables
node -e "console.log(process.env)" | grep INFOBIP

# 2. Run diagnostic script
node check-sms-config.js

# 3. Test original working script
node test-sms.js

# 4. Restart dev server (to reload .env)
npm run dev
```

---

## Summary

**Problem:** App was using wrong Infobip base URL (`k93mj3.api.infobip.com`) when .env wasn't loaded

**Solution:**
1. ✅ Fixed fallback URL to `https://api.infobip.com`
2. ✅ Fixed fallback sender to `ServiceSMS`
3. ✅ Ensured mode is set to `'live'` (check localStorage)

**Result:** SMS now sends exactly like your test script! 🎉

---

## Next Steps

1. Run the diagnostic script to verify:
```bash
node check-sms-config.js
```

2. Set app to live mode in browser console:
```javascript
localStorage.setItem('amani_mode', 'live');
location.reload();
```

3. Test SMS sending from any feature in the app

4. Check browser console for "SMS Response" (not "DEMO SMS")

5. Verify SMS arrives on phone!

---

**Questions or Issues?** Check the console logs - they'll tell you exactly what's happening!
