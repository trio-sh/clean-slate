# Partner Onboarding Flow - Complete Documentation

## Overview

This document traces the complete journey of how a laundry partner gets into the system, from initial application through to portal access.

---

## Flow Diagram

```
User Visits Site
    ↓
Clicks "Become a Laundry Partner" in Footer
    ↓
Fills Partner Application Form (/partner)
    ↓
Application Saved to Database (status: 'pending')
    ↓
[OPTIONAL] Staff Reviews & Updates Status
    ↓
Admin Approves & Creates Depot
    ↓
System Creates:
  • Depot Record
  • Partner User Account (role: 'partner')
  • Sends SMS with Login Credentials
    ↓
Partner Receives SMS
    ↓
Partner Logs In at /login
    ↓
Redirected to /partner-portal
    ↓
Partner Can Now:
  • Manage Services
  • View/Edit Orders
  • Generate Invoices
  • Send Invoices via SMS
```

---

## Step 1: Application Submission

### Entry Point

**File:** `src/components/layout/CustomerLayout.jsx` (Line 389)

The footer contains a link to become a partner:

```javascript
<Link to="/partner">
  {t('footer.becomePartner')}
</Link>
```

### Application Form

**File:** `src/pages/PartnerApplicationPage.jsx`

**Route:** `/partner`

**Form Fields:**
- `business_name` * (required)
- `contact_person_first_name` * (required)
- `contact_person_last_name` * (required)
- `email` * (required)
- `phone` * (required)
- `business_address` * (required)
- `business_license` (optional)
- `hst_number` (optional) - HST registration number
- `years_operating` (optional)
- `capacity_per_day` (optional) - in lbs/day
- `services_offered` (optional)
- `business_documents_url` (optional) - URL to uploaded docs
- `message` (optional)

### Submission Process

**Lines 41-68:**

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // Prepare data for submission
    const applicationData = {
      ...formData,
      years_operating: parseInt(formData.years_operating) || 0,
      capacity_per_day: parseInt(formData.capacity_per_day) || 0
    };

    // Submit to database
    await db.create('laundry_partner_applications', applicationData);

    // Show success message
    toast.success(t('partnerApplication.submitSuccess'));
    setIsSubmitted(true);
  } catch (error) {
    console.error('Error submitting application:', error);
    toast.error(t('partnerApplication.submitError'));
  } finally {
    setIsSubmitting(false);
  }
};
```

**What Happens:**
1. Form data is validated (required fields checked by browser)
2. Application is saved to `laundry_partner_applications` table
3. Status is automatically set to `'pending'`
4. Success message shown to user
5. User sees confirmation screen

**Success Screen (Lines 70-97):**
- Green checkmark icon
- "Application Submitted" message
- Thank you message
- "Back to Home" button

---

## Step 2: Staff Review (Optional)

### Staff Applications Page

**File:** `src/pages/staff/StaffApplications.jsx`

**Route:** `/staff-portal/applications`

**Access:** Staff members can view all applications

### What Staff Can Do

**Lines 57-66:**

```javascript
const updateApplicationStatus = async (applicationId, type, newStatus) => {
  try {
    await db.update(getTableName(type), applicationId, { status: newStatus });
    toast.success('Application status updated successfully');
    loadApplications();
  } catch (error) {
    console.error('Failed to update application status:', error);
    toast.error('Failed to update application status');
  }
};
```

**Staff Capabilities:**
- View all partner applications
- See business details
- Update status to:
  - `pending`
  - `reviewed`
  - `approved` (basic approval, doesn't create depot)
  - `rejected`

**Important Note:**
Staff approval is **simple status update only**. It does NOT create a depot or partner account. Only Admin can do full approval with depot creation.

### Application Details Modal (Lines 382-538)

Shows complete partner information:
- Contact Information
- Business Name
- Business License
- HST Number
- Years Operating
- Capacity per day
- Services Offered
- Business Address
- Documents URL

---

## Step 3: Admin Approval & Depot Creation

### Admin Applications Page

**File:** `src/pages/admin/AdminApplications.jsx`

**Route:** `/admin/applications`

**Access:** Admin users only

### Special Partner Approval Flow

Unlike driver or career applications, partner applications have a **special approval process** that creates a complete depot and partner account.

**Button (Lines 300-307):**

```javascript
{app.type === 'partner' ? (
  <button
    onClick={() => openPartnerApproval(app)}
    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
  >
    <Building2 className="w-4 h-4" />
    Approve & Create Depot
  </button>
) : (
  // Regular approve button for other types
)}
```

### Depot Creation Modal

**Lines 469-597:**

When admin clicks "Approve & Create Depot", a modal opens with two sections:

#### Section 1: Depot Information

**Pre-filled from Application:**
- Depot Name (from `business_name`)
- Street Address (from `business_address`)
- Phone (from `phone`)
- Capacity per day (from `capacity_per_day`)

**Admin Must Fill:**
- **Depot Code** * (required) - Unique identifier (e.g., "AMN-LW01")
- **City** * (required)
- **Postal Code** (optional)

#### Section 2: Partner Portal Login

**Pre-filled from Application:**
- First Name (from `contact_person_first_name`)
- Last Name (from `contact_person_last_name`)
- Login Email (from `email`)
- Phone (from `phone`)

**Admin Can Edit:**
- **Temp Password** * (default: "partner123")

**Warning Message:**
"Share these credentials with the partner. They should change their password on first login."

### Approval Execution

**Lines 85-106:**

```javascript
const handleApprovePartner = async (e) => {
  e.preventDefault();
  setApproveLoading(true);
  try {
    // Call database function to create depot and partner account
    await db.approvePartnerApplication(
      approvingPartner.id,
      depotForm,
      depotForm.temp_password
    );

    toast.success(`Partner approved! Credentials sent via SMS if phone was provided.`);
    setApprovingPartner(null);

    // Show credentials panel
    setApprovedCredentials({
      depotName: depotForm.name,
      email: depotForm.partner_email,
      password: depotForm.temp_password,
      phone: depotForm.partner_phone,
      loginUrl: `${window.location.origin}/login`,
    });

    loadApplications();
  } catch (err) {
    console.error('Partner approval error:', err);
    toast.error('Failed to approve partner: ' + (err.message || 'Unknown error'));
  } finally {
    setApproveLoading(false);
  }
};
```

---

## Step 4: Database Operations

### approvePartnerApplication Function

**File:** `src/lib/db.js` (Lines 840-887)

This function performs all the magic:

```javascript
async approvePartnerApplication(applicationId, depotData, partnerPassword) {
  try {
    // 1. Create Depot
    const depot = await this.create('depots', {
      name: depotData.name,
      code: depotData.code,
      street_address: depotData.street_address,
      city: depotData.city,
      postal_code: depotData.postal_code,
      phone: depotData.phone,
      capacity_per_day: parseInt(depotData.capacity_per_day) || 300,
      status: 'active'
    });

    // 2. Hash Password
    const passwordHash = await hashPassword(partnerPassword);

    // 3. Create Partner User
    const partnerUser = await this.create('users', {
      email: depotData.partner_email,
      password_hash: passwordHash,
      first_name: depotData.partner_first_name,
      last_name: depotData.partner_last_name,
      phone: depotData.partner_phone,
      role: 'partner',          // ✅ CRITICAL: Sets role
      depot_id: depot.id,       // ✅ CRITICAL: Links to depot
      is_active: true
    });

    // 4. Update Application Status
    await this.update('laundry_partner_applications', applicationId, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      depot_id: depot.id
    });

    // 5. Send SMS with Credentials (if phone provided)
    if (depotData.partner_phone) {
      const message = smsTemplates.loginCredentials(
        depotData.partner_email,
        partnerPassword
      );
      await sendSMS(depotData.partner_phone, message);
    }

    return { depot, partnerUser };
  } catch (error) {
    console.error('Error approving partner application:', error);
    throw error;
  }
}
```

### What Gets Created:

#### 1. Depot Record (`depots` table)

```javascript
{
  id: 'uuid-generated',
  name: 'CleanPro Laundry',
  code: 'AMN-LW01',
  street_address: '123 Main Street',
  city: 'Toronto',
  postal_code: 'M1A 1A1',
  phone: '+14165551234',
  capacity_per_day: 500,
  status: 'active',
  created_at: '2026-02-24T...',
  updated_at: '2026-02-24T...'
}
```

#### 2. Partner User Account (`users` table)

```javascript
{
  id: 'uuid-generated',
  email: 'partner@cleanpro.com',
  password_hash: 'bcrypt-hashed-password',
  first_name: 'John',
  last_name: 'Smith',
  phone: '+14165551234',
  role: 'partner',              // ✅ Gives access to partner portal
  depot_id: 'depot-uuid',       // ✅ Links to depot
  is_active: true,
  created_at: '2026-02-24T...',
  updated_at: '2026-02-24T...'
}
```

#### 3. Application Updated

```javascript
{
  // ... original application data
  status: 'approved',
  approved_at: '2026-02-24T12:00:00Z',
  depot_id: 'depot-uuid'
}
```

---

## Step 5: SMS Credential Delivery

### SMS Template

**File:** `src/lib/utils.js` (Lines 270-271)

```javascript
loginCredentials: (email, tempPassword) =>
  `Amani's Cleaners: Your account is ready!
Email: ${email}
Temp Password: ${tempPassword}
Login: ${getOrigin()}/login
Please change your password after login.`
```

### Example SMS

```
Amani's Cleaners: Your account is ready!
Email: partner@cleanpro.com
Temp Password: partner123
Login: https://amanis-cleaners.com/login
Please change your password after login.
```

### SMS Sending Logic

**Lines 399-446 in utils.js:**

#### Demo Mode:
```javascript
if (mode === 'demo') {
  console.log(`📱 [DEMO SMS] To: ${to}`);
  console.log(`Message: ${message}`);
  return { success: true, messageId: 'demo-' + Date.now() };
}
```

#### Live Mode (Infobip):
```javascript
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
```

---

## Step 6: Credentials Panel (Admin View)

### Success Modal

**File:** `src/pages/admin/AdminApplications.jsx` (Lines 599-675)

After successful approval, admin sees a modal with:

**Header:**
- Green checkmark icon
- "Partner Approved!" title
- Depot name display

**Credentials Section:**
- Login URL (with copy button)
- Email (with copy button)
- Password (with copy button)

**SMS Status:**
- **If phone provided:** "SMS with login credentials was sent to +1234567890"
- **If no phone:** "No phone number provided — please share these credentials manually"

**Actions:**
- "Open Login Page" button (opens /login in new tab)
- "Done" button (closes modal)

### Copy to Clipboard

Each credential has a copy button that allows admin to easily copy and share credentials if needed.

---

## Step 7: Partner Login

### Login Page

**File:** `src/pages/auth/LoginPage.jsx`

**Route:** `/login`

### Login Process

Partner enters:
- Email: `partner@cleanpro.com`
- Password: `partner123`

**Authentication:**

```javascript
const loginAsRole = async (role) => {
  // Find user by email and role
  const user = await db.getUserByEmail(email);

  if (user.role !== role) {
    throw new Error('Invalid credentials');
  }

  if (!user.is_active) {
    throw new Error('Account is inactive');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Load complete user data including depot_id
  return user;
};
```

### Post-Login Redirect

**File:** `src/pages/auth/LoginPage.jsx` (Lines 80-90)

```javascript
// After successful login
switch(user.role) {
  case 'admin':
    navigate('/admin');
    break;
  case 'staff':
    navigate('/staff-portal');
    break;
  case 'partner':
    navigate('/partner-portal');  // ✅ Partners go here
    break;
  case 'driver':
    navigate('/driver-portal');
    break;
  default:
    navigate('/');
    break;
}
```

**Result:** Partner is redirected to `/partner-portal`

---

## Step 8: Partner Portal Access

### Protected Route

**File:** `src/App.jsx`

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

### Partner Navigation

**File:** `src/components/layout/DashboardLayout.jsx`

Partner menu includes:
- **Dashboard** - Overview stats
- **My Orders** - View/edit orders, generate invoices
- **My Services** - Manage services and pricing
- **Invoices** - View invoices, send via SMS
- **Depot Info** - View depot details

### Data Filtering by depot_id

**Every query in partner portal filters by `user.depot_id`:**

```javascript
// Example from PartnerDashboard.jsx
const loadData = async () => {
  if (!user?.depot_id) return;

  const ordersData = await db.getOrdersByDepot(user.depot_id);
  const servicesData = await db.getPartnerServices(user.depot_id);
  const invoicesData = await db.getInvoicesByDepot(user.depot_id);

  setOrders(ordersData);
  setServices(servicesData);
  setInvoices(invoicesData);
};
```

**This ensures partners can ONLY see data for their own depot.**

---

## Complete Flow Summary

### Timeline

1. **Day 1 - Application**
   - User visits site
   - Clicks "Become a Laundry Partner" in footer
   - Fills application form
   - Application submitted (status: 'pending')

2. **Day 2-7 - Review (Optional)**
   - Staff reviews application
   - May update status to 'reviewed'
   - Waits for admin approval

3. **Day 7 - Admin Approval**
   - Admin opens application
   - Clicks "Approve & Create Depot"
   - Fills depot details and sets temp password
   - Clicks "Approve & Create Depot"
   - System creates:
     - Depot record
     - Partner user account
     - Sends SMS with credentials
   - Admin sees credentials panel

4. **Day 7 - Partner Receives Access**
   - Partner receives SMS: "Your account is ready!"
   - SMS contains: email, password, login URL
   - Partner clicks login URL or visits site

5. **Day 7 - First Login**
   - Partner enters email and temp password
   - Successfully logs in
   - Redirected to `/partner-portal`
   - Sees dashboard with depot stats

6. **Day 7+ - Portal Usage**
   - Partner creates custom services
   - Views orders assigned to depot
   - Edits order details
   - Generates invoices
   - Sends invoices to customers via SMS

---

## Security & Data Isolation

### Row Level Security (RLS)

**Migration:** `migrations/002_add_partner_services_and_invoices.sql`

#### Partner Services

```sql
-- Partners can only view their depot's services
CREATE POLICY partner_services_select_policy ON partner_services
  FOR SELECT
  USING (
    depot_id IN (
      SELECT depot_id FROM users WHERE id = auth.uid()
    )
  );

-- Partners can only insert for their depot
CREATE POLICY partner_services_insert_policy ON partner_services
  FOR INSERT
  WITH CHECK (
    depot_id IN (
      SELECT depot_id FROM users WHERE id = auth.uid() AND role = 'partner'
    )
  );
```

#### Partner Invoices

```sql
-- Partners can view their depot's invoices OR customers can view their own
CREATE POLICY partner_invoices_select_policy ON partner_invoices
  FOR SELECT
  USING (
    depot_id IN (
      SELECT depot_id FROM users WHERE id = auth.uid()
    )
    OR
    customer_id = auth.uid()
  );
```

### Application-Level Filtering

**Every query includes depot_id check:**

```javascript
// Always check depot_id
if (!user?.depot_id) {
  console.error('User has no depot assigned');
  return;
}

// Filter by depot
const data = await db.getOrdersByDepot(user.depot_id);
```

---

## Testing Guide

### Demo Mode Testing

#### 1. Test Application Submission

```bash
# Navigate to site
http://localhost:3000

# Click "Become a Laundry Partner" in footer
# Fill form with test data:
Business Name: Test Laundry Co
Contact Person: John Smith
Email: test@laundry.com
Phone: +14165551234
Address: 123 Test St, Toronto, ON

# Submit and verify success message
```

#### 2. Test Admin Approval

```bash
# Login as admin
Email: admin@demo.com
Password: demo123

# Navigate to Applications
/admin/applications

# Find the test application
# Click "Approve & Create Depot"

# Fill depot form:
Depot Code: AMN-TEST
City: Toronto
Temp Password: test123

# Submit
# Check console for SMS log (demo mode)
# Verify credentials panel shows
```

#### 3. Test Partner Login

```bash
# Use credentials from approval:
Email: test@laundry.com
Password: test123

# Should redirect to /partner-portal
# Verify dashboard loads
# Check depot name appears in header
```

#### 4. Test Portal Features

```bash
# Create a service
My Services → Create Service
Name: Test Wash
Price: $10.00
Category: Laundry

# Check order list
My Orders → View orders for your depot only

# Generate invoice
My Orders → Select order → Generate Invoice

# Send invoice via SMS
Invoices → Select invoice → Send SMS
Check console for demo SMS log
```

### Live Mode Testing

#### Prerequisites

1. Run Supabase migration
2. Set environment variables for Infobip
3. Switch to live mode in config

#### Steps

1. Apply migration:
```sql
-- Run migrations/002_add_partner_services_and_invoices.sql
-- Verify tables created
-- Check RLS policies enabled
```

2. Configure SMS:
```javascript
// Set in environment or config
INFOBIP_API_KEY=your-key
INFOBIP_BASE_URL=https://api.infobip.com
INFOBIP_SENDER=AmanisCleaners
```

3. Test same flow as demo mode
4. Verify actual SMS arrives
5. Check Supabase database for records

---

## Troubleshooting

### Issue 1: Application Not Appearing

**Symptom:** After submitting application, it doesn't show in admin panel

**Check:**
- Browser console for errors
- Database for record creation
- Table name is `laundry_partner_applications` (not `partner_applications`)

**Fix:**
```javascript
// Verify table name in code
await db.create('laundry_partner_applications', applicationData);
```

### Issue 2: Depot Creation Fails

**Symptom:** Error during approval: "Failed to approve partner"

**Common Causes:**
- Duplicate depot code
- Missing required fields
- Database constraint violation

**Fix:**
- Use unique depot codes (e.g., AMN-LW01, AMN-LW02)
- Check all required fields are filled
- Verify depots table exists

### Issue 3: SMS Not Sent

**Symptom:** No SMS received after approval

**Check:**
- Phone number format (must include country code)
- Infobip API key configured
- Mode is set to 'live' not 'demo'
- Console logs for error messages

**Demo Mode:**
```javascript
// Check console output
📱 [DEMO SMS] To: +14165551234
Message: Amani's Cleaners: Your account is ready!...
```

**Live Mode:**
```javascript
// Check Infobip response
{ success: true, messageId: '...' }
```

### Issue 4: Partner Can't Access Portal

**Symptom:** After login, partner gets "Unauthorized" or redirected to home

**Check:**
1. User role is 'partner'
```sql
SELECT id, email, role, depot_id FROM users WHERE email = 'partner@email.com';
```

2. depot_id is set
```javascript
// Should NOT be null
user.depot_id: 'depot-uuid'
```

3. is_active is true
```sql
SELECT is_active FROM users WHERE email = 'partner@email.com';
-- Should return: true
```

**Fix:**
```sql
-- Update user if needed
UPDATE users
SET role = 'partner', depot_id = 'depot-uuid', is_active = true
WHERE email = 'partner@email.com';
```

### Issue 5: Partner Sees No Data

**Symptom:** Partner portal is empty, no orders or services

**Check:**
- depot_id is correctly set on user
- Orders have depot_id assigned
- RLS policies allow access

**Debug:**
```javascript
// Add logging
console.log('User depot_id:', user.depot_id);
console.log('Orders query:', ordersData);

// Check if orders exist for depot
SELECT * FROM orders WHERE depot_id = 'depot-uuid';
```

---

## Database Schema Reference

### laundry_partner_applications

```sql
CREATE TABLE laundry_partner_applications (
  id UUID PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  contact_person_first_name VARCHAR(100) NOT NULL,
  contact_person_last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  business_address TEXT NOT NULL,
  business_license VARCHAR(100),
  hst_number VARCHAR(50),
  years_operating INTEGER,
  capacity_per_day INTEGER,
  services_offered TEXT,
  business_documents_url TEXT,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  depot_id UUID REFERENCES depots(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### depots

```sql
CREATE TABLE depots (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  street_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  phone VARCHAR(20),
  capacity_per_day INTEGER DEFAULT 300,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### users (partner role)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL, -- 'partner'
  depot_id UUID REFERENCES depots(id), -- Links to depot
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## File Reference

### Application Flow Files

- `src/components/layout/CustomerLayout.jsx` - Footer link
- `src/pages/PartnerApplicationPage.jsx` - Application form
- `src/pages/staff/StaffApplications.jsx` - Staff review
- `src/pages/admin/AdminApplications.jsx` - Admin approval
- `src/lib/db.js` - `approvePartnerApplication()` function
- `src/lib/utils.js` - SMS templates and sending
- `src/pages/auth/LoginPage.jsx` - Partner login
- `src/App.jsx` - Routes and redirects

### Partner Portal Files

- `src/pages/partner/PartnerDashboard.jsx` - Dashboard
- `src/pages/partner/PartnerOrders.jsx` - Order management
- `src/pages/partner/PartnerServices.jsx` - Service management
- `src/pages/partner/PartnerInvoices.jsx` - Invoice management
- `src/pages/partner/PartnerDepotInfo.jsx` - Depot info
- `src/components/layout/DashboardLayout.jsx` - Layout with navigation

### Database Files

- `migrations/002_add_partner_services_and_invoices.sql` - Tables and RLS
- `src/lib/db.js` - Database abstraction layer

---

## Summary

The partner onboarding flow is a **complete multi-step process** that:

1. ✅ Captures partner application through public form
2. ✅ Allows staff to review (optional step)
3. ✅ Requires admin approval with depot creation
4. ✅ Automatically creates depot record and partner user account
5. ✅ Sends SMS with login credentials
6. ✅ Provides secure portal access filtered by depot
7. ✅ Enables partners to manage their own services, orders, and invoices
8. ✅ Isolates data using RLS policies and application-level filtering

**The system is production-ready and fully functional!** 🎉
