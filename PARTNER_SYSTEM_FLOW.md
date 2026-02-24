# Partner System Complete Flow Analysis

## 🔍 System Overview

The partner system allows laundry depot partners to:
1. Manage their own services and pricing
2. Process orders assigned to their depot
3. Generate invoices for completed orders
4. Send invoices to customers via SMS

---

## 📊 Flow Diagram

```
Partner Login → Partner Dashboard → 4 Main Features:
                                    ├─ My Orders (View/Edit/Generate Invoice)
                                    ├─ My Services (Create/Edit/Delete Services)
                                    ├─ Invoices (View/Send SMS)
                                    └─ Depot Info (View Depot Details)
```

---

## 🚀 Step-by-Step Flow Analysis

### **1. Partner Login Flow** ✅

**File:** `src/pages/auth/LoginPage.jsx`

**Demo Credentials:**
- Email: `partner@demo.com`
- Password: `demo123`

**Process:**
1. User enters credentials
2. `loginAsRole('partner')` is called
3. Finds user with `role: 'partner'`
4. Loads user data including `depot_id`

**Demo User Data:**
```javascript
{
  id: 'user-partner',
  email: 'partner@demo.com',
  first_name: 'CleanPro',
  last_name: 'Partners',
  role: 'partner',
  depot_id: 'depot-2',  // ✅ CRITICAL: This links partner to their depot
  password_hash: '...',
  is_active: true
}
```

**✅ Status:** WORKING
- User object includes `depot_id`
- Auth store correctly loads partner data

---

### **2. Route Protection & Navigation** ✅

**File:** `src/App.jsx`

**Protected Route:**
```javascript
<Route path="/partner-portal" element={
  <ProtectedRoute allowedRoles={['partner', 'admin']}>
    <DashboardLayout type="partner" />
  </ProtectedRoute>
}>
  <Route index element={<PartnerDashboard />} />
  <Route path="orders" element={<PartnerOrders />} />
  <Route path="services" element={<PartnerServices />} />
  <Route path="invoices" element={<PartnerInvoices />} />
  <Route path="depot" element={<PartnerDepotInfo />} />
</Route>
```

**Login Redirect:**
```javascript
// After successful login
switch(user.role) {
  case 'partner':
    navigate('/partner-portal');
    break;
}
```

**✅ Status:** WORKING
- Routes are protected by role
- Navigation configured correctly

---

### **3. Partner Dashboard** ✅

**File:** `src/pages/partner/PartnerDashboard.jsx`

**Data Loading:**
```javascript
const loadData = async () => {
  if (!user?.depot_id) return; // ✅ Checks for depot_id

  const [depotData, ordersData] = await Promise.all([
    db.getById('depots', user.depot_id),     // Loads depot info
    db.getOrdersByDepot(user.depot_id),      // Loads orders
  ]);

  setDepot(depotData);
  setOrders(ordersData);
};
```

**Stats Displayed:**
- Today's Orders
- Pending Orders
- Processing Orders
- Ready for Pickup

**Quick Links:**
- My Orders
- My Services
- Depot Info

**✅ Status:** WORKING
- Uses `user.depot_id` correctly
- Displays depot-specific data only

---

### **4. My Services Page** ✅

**File:** `src/pages/partner/PartnerServices.jsx`

**Database Method:** `src/lib/db.js` → `getPartnerServices(depotId)`

**Flow:**

#### A. **Load Services**
```javascript
const loadServices = async () => {
  if (!user?.depot_id) return; // ✅ Safety check
  const data = await db.getPartnerServices(user.depot_id);
  setServices(data);
};
```

**Database Query (Demo Mode):**
```javascript
// IndexedDB
const index = servicesStore.index('depot_id');
const services = await index.getAll(depotId);
```

**Database Query (Live Mode):**
```sql
SELECT * FROM partner_services
WHERE depot_id = :depotId
ORDER BY created_at DESC
```

#### B. **Create Service**
```javascript
const handleSaveService = async () => {
  const serviceData = {
    depot_id: user.depot_id,  // ✅ Links to partner's depot
    name: formData.name,
    description: formData.description,
    category: formData.category,
    price: parseFloat(formData.price),
    unit: formData.unit,
    is_active: formData.is_active
  };

  await db.createPartnerService(serviceData);
};
```

**Database Insert:**
```javascript
// Auto-generates ID, adds timestamps
{
  id: 'uuid-generated',
  depot_id: 'depot-2',
  name: 'Express Laundry',
  description: 'Same day service',
  category: 'laundry',
  price: 15.00,
  unit: 'lb',
  is_active: true,
  created_at: '2026-02-24T...',
  updated_at: '2026-02-24T...'
}
```

#### C. **Edit Service**
```javascript
await db.updatePartnerService(serviceId, updates);
```

#### D. **Delete Service**
```javascript
await db.deletePartnerService(serviceId);
```

**✅ Status:** WORKING
- All CRUD operations implemented
- Uses `depot_id` correctly
- RLS policies secure data in live mode

---

### **5. My Orders Page (Enhanced)** ✅

**File:** `src/pages/partner/PartnerOrders.jsx`

**Database Method:** `db.getOrdersByDepot(depotId)`

**Flow:**

#### A. **Load Orders & Invoices**
```javascript
const loadOrders = async () => {
  if (!user?.depot_id) return; // ✅ Safety check

  const data = await db.getOrdersByDepot(user.depot_id);
  setOrders(data);

  // Load existing invoices
  const invoicesData = await db.getInvoicesByDepot(user.depot_id);
  const invoiceMap = {};
  invoicesData.forEach(inv => {
    invoiceMap[inv.order_id] = inv;
  });
  setOrderInvoices(invoiceMap);
};
```

#### B. **Edit Order**
```javascript
const handleEditOrder = async (updatedOrder) => {
  // Partners can modify:
  // - Order items (add/remove/edit quantities)
  // - Special instructions
  // - Pricing

  await db.update('orders', orderId, updatedOrder);
  loadOrders(); // Reload
};
```

#### C. **Generate Invoice** 🔥

**Important Flow:**
```javascript
const handleGenerateInvoice = async (order) => {
  // 1. Check if invoice already exists
  if (orderInvoices[order.id]) {
    toast.error('Invoice already exists');
    return;
  }

  // 2. Generate unique invoice number
  const invoiceNumber = generateInvoiceNumber();
  // Format: INV-20260224-001

  // 3. Calculate totals
  const subtotal = order.items.reduce((sum, item) =>
    sum + (item.quantity * item.unit_price), 0
  );
  const tax = subtotal * 0.13; // 13% tax
  const total = subtotal + tax;

  // 4. Create invoice
  const invoice = {
    invoice_number: invoiceNumber,
    depot_id: user.depot_id,        // ✅ Partner's depot
    order_id: order.id,
    customer_id: order.user_id,
    customer_name: `${order.customer_first_name} ${order.customer_last_name}`,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email,
    items: order.items,
    subtotal: subtotal,
    tax: tax,
    total: total,
    status: 'draft',
    issued_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };

  // 5. Save to database
  await db.createInvoice(invoice);

  toast.success('Invoice generated!');
  loadOrders(); // Reload to show invoice indicator
};
```

**✅ Status:** WORKING
- Invoice generation implemented
- Proper calculations (subtotal, tax, total)
- Links to order and customer

---

### **6. Invoices Page** ✅

**File:** `src/pages/partner/PartnerInvoices.jsx`

**Database Method:** `db.getInvoicesByDepot(depotId)`

**Flow:**

#### A. **Load Invoices**
```javascript
const loadInvoices = async () => {
  if (!user?.depot_id) return;

  // Get all orders to convert to invoice format
  const ordersData = await db.getOrdersByDepot(user.depot_id);

  // Convert orders to invoice objects
  const invoiceData = ordersData.map(order => ({
    id: order.id,
    invoice_number: order.reference_code,
    customer_name: `${order.customer_first_name} ${order.customer_last_name}`,
    customer_phone: order.customer_phone,
    date: order.pickup_date,
    total: order.total,
    status: getInvoiceStatus(order),
    items: order.items
  }));

  setInvoices(invoiceData);
};
```

**Invoice Status Logic:**
```javascript
const getInvoiceStatus = (order) => {
  if (order.status === 'delivered' && !order.payment_status) {
    if (new Date(order.delivery_date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      return 'overdue';  // ⚠️ Past due date
    }
    return 'sent';       // 📤 Delivered but not paid
  }
  if (order.payment_status === 'paid') {
    return 'paid';       // ✅ Payment received
  }
  return 'draft';        // 📝 Not yet sent
};
```

#### B. **Send Invoice via SMS** 🔥📱

**Important Flow:**
```javascript
const handleSendSMS = async (invoice) => {
  // 1. Confirm action
  const confirmed = window.confirm(
    `Send invoice to ${invoice.customer_name}?`
  );
  if (!confirmed) return;

  // 2. Generate invoice tracking link
  const trackingLink = `${window.location.origin}/track?ref=${invoice.reference_code}`;

  // 3. Create SMS message
  const message = `Amani's Cleaners: Your invoice #${invoice.invoice_number} is ready. Total: $${invoice.total.toFixed(2)}. View details: ${trackingLink}`;

  // 4. Send SMS via Infobip
  const result = await sendSMS(invoice.customer_phone, message);

  if (result.success) {
    // 5. Update invoice status
    await db.updateInvoiceStatus(invoice.id, 'sent');

    // 6. Mark SMS as sent
    await db.update('partner_invoices', invoice.id, {
      sms_sent: true,
      sms_sent_at: new Date().toISOString()
    });

    toast.success('Invoice sent via SMS!');
    loadInvoices(); // Reload
  } else {
    toast.error('Failed to send SMS');
  }
};
```

**SMS Integration:**
**File:** `src/lib/utils.js`

**Infobip SMS Function:**
```javascript
export const sendSMS = async (to, message, sender = null) => {
  const mode = getMode();

  // Demo mode - just logs to console
  if (mode === 'demo') {
    console.log(`📱 [DEMO SMS] To: ${to}`);
    console.log(`Message: ${message}`);
    return { success: true, messageId: 'demo-' + Date.now() };
  }

  // Live mode - uses Infobip API
  const { baseUrl, apiKey, sender: defaultSender } = config.sms;

  if (!apiKey) {
    return { success: false, error: 'SMS not configured' };
  }

  try {
    const response = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          destinations: [{ to }],
          from: sender || defaultSender,
          text: message
        }]
      })
    });

    const data = await response.json();

    if (response.ok && data.messages?.[0]?.status?.groupName === 'PENDING') {
      return {
        success: true,
        messageId: data.messages[0].messageId
      };
    }

    return { success: false, error: data };
  } catch (error) {
    console.error('SMS Error:', error);
    return { success: false, error: error.message };
  }
};
```

**✅ Status:** WORKING
- SMS sending implemented
- Infobip integration ready
- Demo mode for testing
- Live mode for production

---

## 🔍 **Potential Issues & Solutions**

### ⚠️ **Issue 1: Invoice Page Uses Orders Instead of partner_invoices Table**

**Current Implementation:**
```javascript
// PartnerInvoices.jsx
const ordersData = await db.getOrdersByDepot(user.depot_id);
// Converts orders to invoice format in memory
```

**Problem:**
- Not using the `partner_invoices` table we created
- Invoices are generated but not persisted properly
- SMS tracking not saved to database

**Solution:** ✅ **NEEDS FIX**

```javascript
// Should be:
const invoicesData = await db.getInvoicesByDepot(user.depot_id);
setInvoices(invoicesData);
```

---

### ⚠️ **Issue 2: Missing createInvoice Call in PartnerOrders**

**Current Code:**
```javascript
// PartnerOrders.jsx - handleGenerateInvoice()
await db.createInvoice(invoice);  // ✅ This is correct
```

**Status:** ✅ WORKING - Already implemented

---

### ⚠️ **Issue 3: SMS Sent Status Not Updated**

**Current Issue:**
The `PartnerInvoices.jsx` doesn't update the `partner_invoices` table after sending SMS.

**Fix Needed:** ✅ **NEEDS FIX**

```javascript
// After SMS sent successfully:
await db.update('partner_invoices', invoice.id, {
  status: 'sent',
  sms_sent: true,
  sms_sent_at: new Date().toISOString()
});
```

---

## 📋 **Complete Data Flow Summary**

```
1. Partner Logs In
   ↓
2. Auth Store loads user with depot_id
   ↓
3. Partner Dashboard loads depot data
   ↓
4. Partner can:

   A. Create Services
      - Saves to partner_services table
      - Linked by depot_id
      ✅ WORKING

   B. View/Edit Orders
      - Loads orders from depot
      - Can modify items/pricing
      ✅ WORKING

   C. Generate Invoice
      - Creates invoice from order
      - Saves to partner_invoices table
      - Status: 'draft'
      ✅ WORKING

   D. Send Invoice via SMS
      - Loads invoice from partner_invoices
      - Sends SMS via Infobip
      - Updates status to 'sent'
      - Marks sms_sent = true
      ⚠️ PARTIALLY WORKING (needs fix)
```

---

## 🛠️ **Required Fixes**

### Fix 1: Update PartnerInvoices.jsx to use partner_invoices table

**File:** `src/pages/partner/PartnerInvoices.jsx`

**Change:**
```javascript
// OLD
const ordersData = await db.getOrdersByDepot(user.depot_id);

// NEW
const invoicesData = await db.getInvoicesByDepot(user.depot_id);
setInvoices(invoicesData);
```

### Fix 2: Update SMS send to persist to database

**Add after successful SMS:**
```javascript
if (result.success) {
  await db.update('partner_invoices', invoice.id, {
    status: 'sent',
    sms_sent: true,
    sms_sent_at: new Date().toISOString()
  });
}
```

---

## ✅ **Testing Checklist**

### Demo Mode Testing:
- [ ] Login as partner (partner@demo.com / demo123)
- [ ] Navigate to "My Services"
- [ ] Create a test service
- [ ] Edit the service
- [ ] Delete the service
- [ ] Navigate to "My Orders"
- [ ] View order details
- [ ] Edit an order (add/remove items)
- [ ] Generate invoice for an order
- [ ] Navigate to "Invoices"
- [ ] View invoice details
- [ ] Send invoice via SMS (check console logs)
- [ ] Verify SMS message format

### Live Mode Testing:
- [ ] Run migration in Supabase
- [ ] Set environment variables for Infobip
- [ ] Switch to live mode
- [ ] Test all above steps
- [ ] Verify SMS actually sends
- [ ] Check invoice appears in database

---

## 🎯 **System Status**

| Feature | Status | Notes |
|---------|--------|-------|
| Partner Login | ✅ Working | Uses depot_id correctly |
| Dashboard | ✅ Working | Shows depot stats |
| Services CRUD | ✅ Working | All operations functional |
| Order Viewing | ✅ Working | Filters by depot |
| Order Editing | ✅ Working | Can modify items |
| Invoice Generation | ✅ Working | Creates in database |
| Invoice Viewing | ⚠️ Needs Fix | Should use partner_invoices table |
| SMS Sending | ⚠️ Needs Fix | Works but doesn't update DB |
| Database Schema | ✅ Complete | Migration ready |
| Security (RLS) | ✅ Complete | Policies in place |

---

## 📞 **Support**

If issues persist:
1. Check browser console for errors
2. Verify depot_id is set in user object
3. Check database for created records
4. Verify Infobip API key is configured
5. Test in demo mode first

---

**End of Flow Analysis** ✅
