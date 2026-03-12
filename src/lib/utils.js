// Utilities Library for Amani's Cleaners
// Includes: SMS (Infobip), Email, QR Code, PDF/Invoice Generation

// ============================================
// CONFIGURATION - Set these in .env file
// ============================================

const config = {
  // SMS Configuration (Infobip)
  // Get API keys from: https://portal.infobip.com
  // Pricing varies by country, competitive rates
  sms: {
    provider: 'infobip',
    baseUrl: import.meta.env.VITE_INFOBIP_BASE_URL || 'https://api.infobip.com',
    apiKey: import.meta.env.VITE_INFOBIP_API_KEY || '',
    sender: import.meta.env.VITE_INFOBIP_SENDER || 'ServiceSMS',
  },
  
  // Email Configuration (SMTP)
  // Can use: Gmail, SendGrid, Mailgun, or any SMTP server
  email: {
    host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
    port: import.meta.env.VITE_SMTP_PORT || 587,
    user: import.meta.env.VITE_SMTP_USER || '',
    password: import.meta.env.VITE_SMTP_PASSWORD || '',
    fromEmail: import.meta.env.VITE_SMTP_FROM_EMAIL || 'amaniscleaners@gmail.com',
    fromName: import.meta.env.VITE_SMTP_FROM_NAME || "Amani's Cleaners",
  },
  
  // Business Info
  business: {
    name: "Amani's Cleaners",
    address: "Toronto, ON, Canada",
    phone: "437-215-6321",
    email: "amaniscleaners@gmail.com",
    website: "amanicleaners.com",
    taxNumber: "HST #123456789",
  }
};

// ============================================
// APP ORIGIN HELPER
// Always resolves to the current deployment's base URL
// ============================================
const getOrigin = () => typeof window !== 'undefined' ? window.location.origin : '';

// ============================================
// QR CODE GENERATION
// Uses qrcode library or generates via API
// ============================================

export const generateQRCode = async (data, size = 200) => {
  // Method 1: Use free QR Code API (no library needed)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  
  // Return the URL directly - can be used in <img src={url} />
  return qrApiUrl;
};

export const generateOrderQRCode = async (referenceCode) => {
  // Generate QR code that links to order tracking
  const trackingUrl = `${window.location.origin}/track/${referenceCode}`;
  return generateQRCode(trackingUrl, 150);
};

// ============================================
// SMS SENDING (INFOBIP)
// ============================================

// Demo mode SMS (just logs to console)
const sendDemoSMS = async (to, message) => {
  console.log(`📱 [DEMO SMS] To: ${to}`);
  console.log(`   Message: ${message}`);
  return { success: true, demo: true, messageId: `demo-${Date.now()}` };
};

// Infobip SMS sending (for live mode) - Updated to match working test script
const sendInfobipSMS = async (to, message, sender = null) => {
  const { baseUrl, apiKey, sender: defaultSender } = config.sms;
  
  if (!apiKey) {
    console.warn('Infobip API key not configured');
    return { success: false, error: 'SMS not configured. Please set VITE_INFOBIP_API_KEY in .env' };
  }

  // Format phone number (ensure it has country code)
  let formattedPhone = to.replace(/\D/g, ''); // Remove non-digits
  if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
    formattedPhone = '1' + formattedPhone; // Add Canada/US country code
  }

  try {
    const response = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to: formattedPhone }],
            from: sender || defaultSender,
            text: message
          }
        ]
      }),
    });

    const data = await response.text();
    console.log('SMS Response:', data);
    
    if (response.ok) {
      return { 
        success: true, 
        messageId: `msg-${Date.now()}`,
        status: 'SENT',
        to: formattedPhone,
        response: data
      };
    } else {
      console.error('Infobip Error:', data);
      return { 
        success: false, 
        error: data || 'SMS sending failed'
      };
    }
  } catch (error) {
    console.error('SMS Error:', error);
    return { success: false, error: error.message };
  }
};

// Send SMS to multiple recipients
export const sendBulkSMS = async (recipients, message, forceLive = false) => {
  const mode = localStorage.getItem('amani_mode') || 'demo';
  
  if (mode === 'demo' && !forceLive) {
    console.log(`📱 [DEMO BULK SMS] To: ${recipients.length} recipients`);
    console.log(`   Message: ${message}`);
    return { success: true, demo: true, sent: recipients.length };
  }

  const { baseUrl, apiKey, sender } = config.sms;
  
  if (!apiKey) {
    return { success: false, error: 'SMS not configured' };
  }

  const destinations = recipients.map(phone => {
    let formatted = phone.replace(/\D/g, '');
    if (!formatted.startsWith('1') && formatted.length === 10) {
      formatted = '1' + formatted;
    }
    return { to: formatted };
  });

  try {
    const response = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          from: sender,
          destinations,
          text: message
        }]
      }),
    });

    const data = await response.text();
    console.log('Bulk SMS Response:', data);
    
    if (response.ok) {
      return { 
        success: true, 
        sent: recipients.length,
        response: data
      };
    } else {
      return { success: false, error: data };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendSMS = async (to, message, forceLive = false) => {
  const mode = localStorage.getItem('amani_mode') || 'demo';
  
  if (mode === 'demo' && !forceLive) {
    return sendDemoSMS(to, message);
  }
  
  return sendInfobipSMS(to, message);
};

// Pre-built SMS templates
export const smsTemplates = {
  // Order Lifecycle
  orderConfirmation: (referenceCode, pickupDate, pickupTime) =>
    `Amani's Cleaners: Your order #${referenceCode} is confirmed! Pickup: ${pickupDate} (${pickupTime}). Track: ${getOrigin()}/track/${referenceCode}`,

  // Full order summary with item breakdown (sent automatically on order placement)
  orderSummary: (order) => {
    const lines = [];
    lines.push(`Amani's Cleaners - Order Confirmed! 🍁`);
    lines.push(`Order #${order.reference_code}`);
    lines.push(`---`);

    // Items
    const items = order.items || [];
    items.forEach(item => {
      const qty   = item.quantity || 1;
      const price = (item.total_price || item.unit_price * qty || 0).toFixed(2);
      const name  = item.service_name || item.name || 'Item';
      lines.push(`• ${name} x${qty} — $${price}`);
    });

    lines.push(`---`);
    if (order.discount_amount > 0) {
      lines.push(`Subtotal: $${(order.subtotal || 0).toFixed(2)}`);
      lines.push(`Discount: -$${(order.discount_amount).toFixed(2)}${order.discount_code ? ` (${order.discount_code})` : ''}`);
    }
    if (order.tax > 0) {
      lines.push(`Tax: $${(order.tax || 0).toFixed(2)}`);
    }
    lines.push(`Total: $${(order.total || 0).toFixed(2)}`);
    lines.push(`---`);

    // Pickup info
    if (order.pickup_date) {
      lines.push(`Pickup: ${order.pickup_date}${order.pickup_time_slot ? ` (${order.pickup_time_slot})` : ''}`);
    }
    if (order.delivery_date) {
      lines.push(`Delivery: ${order.delivery_date}${order.delivery_time_slot ? ` (${order.delivery_time_slot})` : ''}`);
    }

    lines.push(`Payment: ${order.payment_method || 'TBD'}`);
    lines.push(`Track: ${getOrigin()}/track/${order.reference_code}`);
    lines.push(`Questions? Call us anytime.`);

    return lines.join('\n');
  },
  
  pickupReminder: (referenceCode, pickupTime) =>
    `Amani's Cleaners: Reminder - Your laundry pickup is today (${pickupTime}). Order #${referenceCode}. We'll be there soon!`,
  
  pickedUp: (referenceCode) =>
    `Amani's Cleaners: We've picked up your items! Order #${referenceCode}. We'll notify you when ready. Track: ${getOrigin()}/track/${referenceCode}`,
  
  processing: (referenceCode) =>
    `Amani's Cleaners: Your order #${referenceCode} is being cleaned and processed. We'll let you know when it's ready!`,
  
  ready: (referenceCode, deliveryDate, deliveryTime) =>
    `Amani's Cleaners: Great news! Your order #${referenceCode} is ready! Delivery: ${deliveryDate} (${deliveryTime}). Track: ${getOrigin()}/track/${referenceCode}`,
  
  outForDelivery: (referenceCode, driverName) =>
    `Amani's Cleaners: ${driverName} is on the way with your order #${referenceCode}! You'll receive it shortly. 🚗`,
  
  delivered: (referenceCode) =>
    `Amani's Cleaners: Your order #${referenceCode} has been delivered! Thank you for choosing us. 🍁 We appreciate your business!`,

  // Account & Auth
  loginCredentials: (email, tempPassword) =>
    `Amani's Cleaners: Your account is ready!\nEmail: ${email}\nTemp Password: ${tempPassword}\nLogin: ${getOrigin()}/login\nPlease change your password after login.`,
  
  quickSignIn: (loginLink) =>
    `Amani's Cleaners: Click to sign in securely: ${loginLink}\nThis link expires in 15 minutes.`,
  
  passwordReset: (resetLink) =>
    `Amani's Cleaners: Reset your password here: ${resetLink}\nLink expires in 1 hour. Ignore if you didn't request this.`,
  
  verifyPhone: (code) =>
    `Amani's Cleaners: Your verification code is ${code}. Valid for 10 minutes.`,

  // Invoices & Payments
  invoiceReminder: (referenceCode, amount, dueDate) =>
    `Amani's Cleaners: Invoice reminder for order #${referenceCode}. Amount: $${amount}. Due: ${dueDate}. Pay online or at pickup.`,
  
  paymentReceived: (referenceCode, amount) =>
    `Amani's Cleaners: Payment of $${amount} received for order #${referenceCode}. Thank you! 🙏`,
  
  paymentFailed: (referenceCode) =>
    `Amani's Cleaners: Payment failed for order #${referenceCode}. Please update your payment method or contact us at 437-215-6321.`,

  // Order Summary
  orderSummaryShort: (referenceCode, items, total) =>
    `Amani's Cleaners Order #${referenceCode}\n${items}\nTotal: $${total}\nTrack: ${getOrigin()}/track/${referenceCode}`,

  // Subscription Confirmation
  subscriptionConfirmation: (customerName, plan, startDate, endDate, paymentLink) => {
    const lines = [];
    lines.push(`Amani's Cleaners - Subscription Confirmed! 🍁`);
    lines.push(`Hi ${customerName},`);
    lines.push(`---`);
    lines.push(`Plan: ${plan.name}`);
    lines.push(`• ${plan.pounds_included} lbs included`);
    lines.push(`• Valid for ${plan.validity_days} days`);
    lines.push(`• ${startDate} → ${endDate}`);
    lines.push(`---`);
    lines.push(`Total: $${Number(plan.price).toFixed(2)}`);
    lines.push(`---`);
    lines.push(`Pay now: ${paymentLink}`);
    lines.push(`Manage: ${getOrigin()}/account/subscriptions`);
    lines.push(`Questions? Call us anytime.`);
    return lines.join('\n');
  },

  // Promotions
  welcomeOffer: (customerName, discountCode, discountAmount) =>
    `Hi ${customerName}! Welcome to Amani's Cleaners! 🍁 Use code ${discountCode} for ${discountAmount} off your first order. Book now: ${getOrigin()}`,
  
  loyaltyReward: (customerName, points, reward) =>
    `${customerName}, you've earned ${points} loyalty points! 🎉 You've unlocked: ${reward}. Use on your next order!`,
  
  seasonalPromo: (promoName, discount, validUntil) =>
    `Amani's Cleaners ${promoName}! ${discount} on all services. Valid until ${validUntil}. Book now: ${getOrigin()}`,
  
  referralBonus: (customerName, referralCode, bonus) =>
    `${customerName}, share the love! Give friends ${bonus} off with code ${referralCode}. You'll earn ${bonus} too when they order!`,
  
  flashSale: (discount, hours) =>
    `⚡ FLASH SALE! ${discount} off all orders for the next ${hours} hours! Use code FLASH. Book now: ${getOrigin()}`,

  // Custom/Staff Messages
  customMessage: (customerName, message) =>
    `Hi ${customerName}, ${message} - Amani's Cleaners 🍁`,
  
  appointmentReminder: (customerName, date, time, service) =>
    `Hi ${customerName}! Reminder: ${service} scheduled for ${date} at ${time}. See you soon! - Amani's Cleaners`,
  
  feedbackRequest: (customerName, referenceCode) =>
    `Hi ${customerName}! How was your experience with order #${referenceCode}? We'd love your feedback: ${getOrigin()}/feedback/${referenceCode}`,

  // Staff/Driver
  newOrderAlert: (referenceCode, pickupAddress, pickupTime) =>
    `New pickup assigned: Order #${referenceCode}\nAddress: ${pickupAddress}\nTime: ${pickupTime}`,
  
  driverAssignment: (driverName, referenceCode, pickupAddress) =>
    `${driverName}, you've been assigned order #${referenceCode}.\nPickup: ${pickupAddress}\nCheck app for details.`,
  
  shiftReminder: (staffName, shiftTime, location) =>
    `Hi ${staffName}! Reminder: Your shift starts at ${shiftTime} at ${location}. Don't forget to check in!`,
};

// ============================================
// EMAIL SENDING
// ============================================

// Demo mode email (just logs to console)
const sendDemoEmail = async (to, subject, htmlBody) => {
  console.log(`📧 [DEMO EMAIL] To: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body: ${htmlBody.substring(0, 200)}...`);
  return { success: true, demo: true, messageId: `demo-${Date.now()}` };
};

// EmailJS (free tier available) - client-side email
// Get API keys from: https://www.emailjs.com/
const sendEmailJS = async (to, subject, htmlBody, templateParams = {}) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS not configured');
    return sendDemoEmail(to, subject, htmlBody);
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: to,
          subject: subject,
          message: htmlBody,
          ...templateParams,
        },
      }),
    });

    if (response.ok) {
      return { success: true, messageId: `emailjs-${Date.now()}` };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    console.error('Email Error:', error);
    return { success: false, error: error.message };
  }
};

export const sendEmail = async (to, subject, htmlBody, templateParams = {}) => {
  const mode = localStorage.getItem('amani_mode') || 'demo';
  
  if (mode === 'demo') {
    return sendDemoEmail(to, subject, htmlBody);
  }
  
  return sendEmailJS(to, subject, htmlBody, templateParams);
};

// Email templates
export const emailTemplates = {
  orderConfirmation: (order) => ({
    subject: `Order Confirmed - #${order.reference_code} | Amani's Cleaners`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2D9CDB, #C9379D); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Confirmed! 🍁</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hi ${order.customer_name},</p>
          <p>Thank you for your order! Here are your details:</p>
          
          <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order #${order.reference_code}</h3>
            <p><strong>Pickup:</strong> ${order.pickup_date} (${order.pickup_time_slot})</p>
            <p><strong>Delivery:</strong> ${order.delivery_date} (${order.delivery_time_slot})</p>
            <p><strong>Total:</strong> $${(order.total || 0).toFixed(2)}</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${window.location.origin}/track/${order.reference_code}" 
               style="background: #2D9CDB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Track Your Order
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Questions? Call us at ${config.business.phone} or reply to this email.
          </p>
        </div>
        <div style="background: #1a2055; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">Amani's Cleaners - Proudly Canadian Since 2013</p>
        </div>
      </div>
    `,
  }),

  loginCredentials: (user, tempPassword) => ({
    subject: `Your Amani's Cleaners Account is Ready`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2D9CDB, #C9379D); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Amani's! 🍁</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hi ${user.first_name},</p>
          <p>Your account has been created. Here are your login details:</p>
          
          <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          
          <p style="color: #c00; font-size: 14px;">Please change your password after logging in.</p>
          
          <p style="text-align: center;">
            <a href="${window.location.origin}/login" 
               style="background: #2D9CDB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Login Now
            </a>
          </p>
        </div>
        <div style="background: #1a2055; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">Amani's Cleaners - Proudly Canadian Since 2013</p>
        </div>
      </div>
    `,
  }),

  invoiceEmail: (order, invoiceUrl) => ({
    subject: `Invoice #${order.reference_code} | Amani's Cleaners`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2D9CDB, #C9379D); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Your Invoice 📄</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hi ${order.customer_name},</p>
          <p>Your invoice for order #${order.reference_code} is attached.</p>
          
          <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p><strong>Total Amount:</strong> $${(order.total || 0).toFixed(2)}</p>
            <p><strong>Status:</strong> ${order.payment_status === 'paid' ? 'Paid ✓' : 'Pending'}</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${invoiceUrl}" 
               style="background: #2D9CDB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Download Invoice
            </a>
          </p>
        </div>
        <div style="background: #1a2055; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">Amani's Cleaners - ${config.business.phone}</p>
        </div>
      </div>
    `,
  }),
};

// ============================================
// INVOICE / RECEIPT GENERATION
// ============================================

export const generateInvoiceHTML = async (order, includeQR = true) => {
  const qrCodeUrl = includeQR ? await generateOrderQRCode(order.reference_code) : null;
  const invoiceDate = new Date().toLocaleDateString('en-CA');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.reference_code}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a2055, #2D9CDB); color: white; padding: 30px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 28px; font-weight: bold; }
    .logo span { color: #2D9CDB; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; margin-bottom: 5px; }
    .content { padding: 30px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-box h3 { color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
    .info-box p { color: #333; line-height: 1.6; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; color: #333; border-bottom: 2px solid #e0e0e0; }
    .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .items-table .qty { text-align: center; }
    .items-table .price { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .totals .total { font-size: 18px; font-weight: bold; color: #2D9CDB; border-bottom: none; padding-top: 12px; }
    .qr-section { display: flex; align-items: center; gap: 20px; background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px; }
    .qr-section img { width: 100px; height: 100px; }
    .qr-section p { color: #666; font-size: 14px; }
    .footer { background: #1a2055; color: white; padding: 20px; text-align: center; font-size: 14px; }
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-paid { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    @media print {
      body { background: white; padding: 0; }
      .invoice { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo" style="display: flex; align-items: center; gap: 15px;">
        <img src="${window.location.origin}/logo.png" alt="Amani's Cleaners" style="height: 50px; width: auto; border-radius: 8px;">
        <div>
          <span style="font-size: 24px; font-weight: bold;">Amani's Cleaners</span>
          <span style="font-size: 16px; opacity: 0.9;">🍁</span>
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p>#${order.reference_code}</p>
      </div>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="info-box">
          ${order.partner_name ? `
          <h3>From</h3>
          <p>
            <strong>${order.partner_name}</strong><br>
            ${order.partner_email || ''}<br>
            ${order.partner_phone || ''}
          </p>
          <h3 style="margin-top: 16px;">Bill To</h3>
          ` : `
          <h3>Bill To</h3>
          `}
          <p>
            <strong>${order.customer_name || 'Guest Customer'}</strong><br>
            ${order.customer_email || ''}<br>
            ${order.customer_phone || ''}<br>
            ${order.delivery_address || order.pickup_address || ''}
          </p>
        </div>
        <div class="info-box" style="text-align: right;">
          <h3>Invoice Details</h3>
          <p>
            <strong>Invoice Date:</strong> ${invoiceDate}<br>
            <strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-CA')}<br>
            <strong>Status:</strong> <span class="status-badge ${order.payment_status === 'paid' ? 'status-paid' : 'status-pending'}">${order.payment_status === 'paid' ? 'PAID' : 'PENDING'}</span>
          </p>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Service</th>
            <th class="qty">Qty</th>
            <th class="price">Unit Price</th>
            <th class="price">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(order.items || []).map(item => `
            <tr>
              <td>${item.name || item.service_name || 'Service'}</td>
              <td class="qty">${item.quantity || 1}</td>
              <td class="price">$${(Number(item.unit_price) || 0).toFixed(2)}</td>
              <td class="price">$${(Number(item.total_price) || (item.unit_price * item.quantity) || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="row">
          <span>Subtotal</span>
          <span>$${(Number(order.subtotal) || 0).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>HST (13%)</span>
          <span>$${(Number(order.tax) || 0).toFixed(2)}</span>
        </div>
        ${order.discount_amount > 0 ? `
        <div class="row">
          <span>Discount</span>
          <span>-$${(Number(order.discount_amount) || 0).toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="row total">
          <span>Total</span>
          <span>$${(Number(order.total) || 0).toFixed(2)}</span>
        </div>
      </div>
      
      ${qrCodeUrl ? `
      <div class="qr-section">
        <img src="${qrCodeUrl}" alt="QR Code">
        <div>
          <p><strong>Scan to Track Order</strong></p>
          <p>Scan this QR code to view your order status online or visit ${getOrigin()}/track/${order.reference_code}</p>
        </div>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p><strong>Amani's Cleaners</strong> - Proudly Canadian Since 2013</p>
      <p>${config.business.phone} | ${config.business.email} | ${config.business.website}</p>
      <p style="margin-top: 10px; font-size: 12px;">${config.business.taxNumber}</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Generate and download invoice as PDF (using browser print)
export const downloadInvoice = async (order) => {
  const invoiceHTML = await generateInvoiceHTML(order, true);
  
  // Create a new window and print as PDF
  const printWindow = window.open('', '_blank');
  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  
  // Wait for images (QR code) to load
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// Generate receipt (compact version - fits on single page)
export const generateReceiptHTML = async (order) => {
  const qrCodeUrl = await generateOrderQRCode(order.reference_code);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt #${order.reference_code}</title>
  <style>
    body { font-family: 'Arial', sans-serif; width: 280px; margin: 0 auto; padding: 10px; background: white; }
    .header { text-align: center; border-bottom: 1px dashed #333; padding-bottom: 8px; margin-bottom: 8px; }
    .header img { height: 30px; width: auto; margin-bottom: 4px; }
    .header h1 { font-size: 14px; margin: 0 0 3px 0; }
    .header p { margin: 2px 0; font-size: 9px; color: #666; }
    .info { font-size: 9px; color: #555; margin: 6px 0; text-align: center; }
    .items { margin: 8px 0; font-size: 10px; }
    .item { display: flex; justify-content: space-between; margin: 3px 0; }
    .item-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    .divider { border-top: 1px dashed #ccc; margin: 6px 0; }
    .totals { margin: 6px 0; }
    .total-row { display: flex; justify-content: space-between; font-size: 10px; margin: 2px 0; }
    .total-row.final { font-weight: bold; font-size: 12px; border-top: 2px solid #333; padding-top: 4px; margin-top: 4px; }
    .qr { text-align: center; margin: 8px 0; }
    .qr img { width: 60px; height: 60px; }
    .qr p { font-size: 8px; color: #666; margin: 2px 0 0 0; }
    .footer { text-align: center; font-size: 8px; color: #666; border-top: 1px dashed #333; padding-top: 6px; margin-top: 6px; }
    .payment-status { font-weight: bold; font-size: 10px; padding: 3px 6px; border-radius: 3px; display: inline-block; margin-top: 4px; }
    .paid { background: #d1fae5; color: #059669; }
    .pending { background: #fef3c7; color: #d97706; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${window.location.origin}/logo.png" alt="Amani's Cleaners">
    <h1>AMANI'S CLEANERS</h1>
    <p>🍁 Proudly Canadian Since 2013</p>
    <p>${config.business.phone}</p>
  </div>

  <div class="info">
    <p>Order #${order.reference_code}</p>
    <p>${new Date(order.created_at).toLocaleDateString('en-CA')} ${new Date(order.created_at).toLocaleTimeString('en-CA', {hour: '2-digit', minute:'2-digit'})}</p>
    <p>${order.customer_name || 'Guest'}</p>
  </div>

  <div class="items">
    ${(order.items || []).map(item => `
      <div class="item">
        <span class="item-name">${item.quantity}x ${(item.name || item.service_name || 'Item').substring(0, 25)}</span>
        <span>$${(Number(item.total_price) || 0).toFixed(2)}</span>
      </div>
    `).join('')}
  </div>

  <div class="divider"></div>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>$${(Number(order.subtotal) || 0).toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>HST (13%)</span>
      <span>$${(Number(order.tax) || 0).toFixed(2)}</span>
    </div>
    <div class="total-row final">
      <span>TOTAL</span>
      <span>$${(Number(order.total) || 0).toFixed(2)}</span>
    </div>
  </div>

  <div class="qr">
    <img src="${qrCodeUrl}" alt="QR Code">
    <p>Scan to track order</p>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p class="payment-status ${order.payment_status === 'paid' ? 'paid' : 'pending'}">
      ${order.payment_status === 'paid' ? '✓ PAID' : '○ PAYMENT PENDING'}
    </p>
  </div>
</body>
</html>
  `;
};

export const downloadReceipt = async (order) => {
  const receiptHTML = await generateReceiptHTML(order);
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(receiptHTML);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// ============================================
// GEOLOCATION UTILITIES
// ============================================

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'AmaniCleaners/1.0' } }
          );
          const data = await response.json();
          
          resolve({
            latitude,
            longitude,
            accuracy,
            address: data.display_name || 'Address not found',
            addressDetails: data.address || {},
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          // Return coords even if geocoding fails
          resolve({
            latitude,
            longitude,
            accuracy,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            timestamp: new Date().toISOString(),
          });
        }
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

// ============================================
// PASSWORD GENERATION
// ============================================

export const generateTempPassword = (length = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Simple hash for demo mode (not secure for production)
export const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// ============================================
// DATE/TIME UTILITIES
// ============================================

export const formatPhone = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export const formatTimeSlot = (slot) => {
  const slots = {
    'morning': '7:00 AM - 11:00 AM',
    '7am-11am': '7:00 AM - 11:00 AM',
    'evening': '6:00 PM - 10:00 PM',
    '6pm-10pm': '6:00 PM - 10:00 PM',
  };
  return slots[slot] || slot;
};

export const getNextBusinessDay = (date = new Date()) => {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  
  // Skip weekends
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  
  return next.toISOString().split('T')[0];
};

// ============================================
// IN-APP NOTIFICATION SERVICE
// ============================================

import db from './db';

/**
 * Notification types:
 * - order: Order status updates
 * - promo: Promotional messages
 * - alert: System alerts
 * - message: Direct messages from admin
 * - reminder: Reminders (pickup, delivery, etc.)
 */

export const notificationService = {
  /**
   * Send notification to a specific user
   * @param {string} userId - Target user ID
   * @param {object} notification - { title, message, type, link }
   */
  async sendToUser(userId, notification) {
    try {
      const notif = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        link: notification.link || null,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      
      await db.create('notifications', notif);
      return notif;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  },

  /**
   * Broadcast notification to multiple users
   * @param {string[]} userIds - Array of user IDs
   * @param {object} notification - { title, message, type, link }
   */
  async sendToUsers(userIds, notification) {
    const results = [];
    for (const userId of userIds) {
      try {
        const result = await this.sendToUser(userId, notification);
        results.push(result);
      } catch (error) {
        console.error(`Failed to notify user ${userId}:`, error);
      }
    }
    return results;
  },

  /**
   * Broadcast notification to all users of a specific role
   * @param {string} role - 'customer' | 'driver' | 'staff' | 'admin'
   * @param {object} notification - { title, message, type, link }
   */
  async broadcastToRole(role, notification) {
    try {
      const allUsers = await db.getAll('users');
      const targetUsers = allUsers.filter(u => u.role === role && u.is_active);
      const userIds = targetUsers.map(u => u.id);
      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('Failed to broadcast to role:', error);
      throw error;
    }
  },

  /**
   * Broadcast notification to all active users
   * @param {object} notification - { title, message, type, link }
   */
  async broadcastToAll(notification) {
    try {
      const allUsers = await db.getAll('users');
      const activeUsers = allUsers.filter(u => u.is_active);
      const userIds = activeUsers.map(u => u.id);
      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('Failed to broadcast to all:', error);
      throw error;
    }
  },

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {number} limit - Max notifications to return
   */
  async getUserNotifications(userId, limit = 50) {
    try {
      const allNotifications = await db.getByField('notifications', 'user_id', userId);
      return (allNotifications || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  async markAsRead(notificationId) {
    try {
      await db.update('notifications', notificationId, { is_read: true });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   */
  async markAllAsRead(userId) {
    try {
      const notifications = await db.getByField('notifications', 'user_id', userId);
      for (const notif of notifications || []) {
        if (!notif.is_read) {
          await db.update('notifications', notif.id, { is_read: true });
        }
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  /**
   * Delete old notifications (cleanup)
   * @param {number} daysOld - Delete notifications older than this many days
   */
  async cleanup(daysOld = 30) {
    try {
      const allNotifications = await db.getAll('notifications');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      for (const notif of allNotifications || []) {
        if (new Date(notif.created_at) < cutoffDate) {
          await db.delete('notifications', notif.id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup notifications:', error);
    }
  },
};

// Pre-defined notification templates for common events
export const notificationTemplates = {
  // Order notifications
  orderConfirmed: (order) => ({
    title: 'Order Confirmed! 🎉',
    message: `Your order #${order.reference_code} has been confirmed. We'll pick up your items soon!`,
    type: 'order',
    link: `/track/${order.reference_code}`,
  }),
  
  orderPickedUp: (order) => ({
    title: 'Items Picked Up 📦',
    message: `Your laundry from order #${order.reference_code} has been picked up and is being processed.`,
    type: 'order',
    link: `/track/${order.reference_code}`,
  }),
  
  orderReady: (order) => ({
    title: 'Order Ready! ✨',
    message: `Great news! Order #${order.reference_code} is clean and ready for delivery.`,
    type: 'order',
    link: `/track/${order.reference_code}`,
  }),
  
  orderOutForDelivery: (order) => ({
    title: 'Out for Delivery 🚚',
    message: `Your order #${order.reference_code} is on its way! Track your delivery in real-time.`,
    type: 'order',
    link: `/track/${order.reference_code}`,
  }),
  
  orderDelivered: (order) => ({
    title: 'Delivered! 🏠',
    message: `Order #${order.reference_code} has been delivered. Thank you for choosing Amani's Cleaners!`,
    type: 'order',
    link: `/account`,
  }),
  
  // Driver notifications
  newPickupAssigned: (order) => ({
    title: 'New Pickup Assigned 📍',
    message: `You have a new pickup for order #${order.reference_code}. Check your route for details.`,
    type: 'alert',
    link: `/driver/routes`,
  }),
  
  newDeliveryAssigned: (order) => ({
    title: 'New Delivery Assigned 🚗',
    message: `Delivery for order #${order.reference_code} has been added to your route.`,
    type: 'alert',
    link: `/driver/routes`,
  }),
  
  // Staff notifications
  orderNeedsProcessing: (order) => ({
    title: 'New Order to Process 👔',
    message: `Order #${order.reference_code} is ready for processing. ${order.items?.length || 0} items.`,
    type: 'alert',
    link: `/staff/orders`,
  }),
  
  // Promotional
  welcomeCustomer: (user) => ({
    title: 'Welcome to Amani\'s Cleaners! 👋',
    message: `Hi ${user.first_name}! Use code WELCOME15 for 15% off your first order.`,
    type: 'promo',
    link: `/order`,
  }),
  
  loyaltyReward: (points) => ({
    title: 'Loyalty Reward! 🌟',
    message: `You've earned ${points} loyalty points! Redeem them on your next order.`,
    type: 'promo',
    link: `/account`,
  }),
  
  // Reminders
  pickupReminder: (order) => ({
    title: 'Pickup Today! ⏰',
    message: `Reminder: We're picking up your laundry today for order #${order.reference_code}.`,
    type: 'reminder',
    link: `/track/${order.reference_code}`,
  }),
  
  deliveryReminder: (order) => ({
    title: 'Delivery Today! 📬',
    message: `Your clean clothes will be delivered today! Order #${order.reference_code}.`,
    type: 'reminder',
    link: `/track/${order.reference_code}`,
  }),
};

// Format address - handles both string and object addresses safely
// Supabase joins may return address as objects instead of strings
export const formatAddress = (addr) => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const parts = [];
    if (addr.unit) parts.push(addr.unit);
    if (addr.street) parts.push(addr.street);
    if (addr.city) parts.push(addr.city);
    if (addr.province) parts.push(addr.province);
    if (addr.postal_code) parts.push(addr.postal_code);
    return parts.join(', ') || '';
  }
  return String(addr);
};

export default {
  generateQRCode,
  generateOrderQRCode,
  sendSMS,
  smsTemplates,
  sendEmail,
  emailTemplates,
  generateInvoiceHTML,
  downloadInvoice,
  generateReceiptHTML,
  downloadReceipt,
  getCurrentLocation,
  generateTempPassword,
  simpleHash,
  formatPhone,
  formatTimeSlot,
  getNextBusinessDay,
  notificationService,
  notificationTemplates,
  formatAddress,
  config,
};