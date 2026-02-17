import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Mail, Bell, Send, Search, Users, Truck,
  UserCheck, X, Plus, FileText, Receipt, Download, Eye,
  Phone, ChevronRight, RefreshCw, CheckCircle, AlertCircle,
  Clock, Loader2, User, Filter, Copy, Gift
} from 'lucide-react';
import db from '../lib/db';
import { 
  sendSMS, smsTemplates, sendEmail, emailTemplates,
  generateInvoiceHTML, generateReceiptHTML, 
  notificationService, notificationTemplates, formatPhone
} from '../lib/utils';
import toast from 'react-hot-toast';

export default function MessagingCenter({ userRole = 'admin' }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('sms'); // sms, email, notification
  const [sending, setSending] = useState(false);
  
  // Recipient selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [recipientFilter, setRecipientFilter] = useState('all'); // all, customer, driver, staff
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  
  // Message form
  const [messageForm, setMessageForm] = useState({
    // SMS fields
    smsMessage: '',
    // Email fields
    emailSubject: '',
    emailBody: '',
    // Notification fields
    notifTitle: '',
    notifMessage: '',
    notifType: 'info',
    notifLink: '',
    // Attachment
    attachInvoice: false,
    attachReceipt: false,
    selectedOrderId: '',
  });
  
  // Templates
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [showTemplates, setShowTemplates] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allOrders] = await Promise.all([
        db.getAll('users'),
        db.getAll('orders'),
      ]);
      
      // Filter based on user role
      let filteredUsers = allUsers?.filter(u => u.is_active) || [];
      if (userRole === 'staff') {
        // Staff can only message customers and drivers
        filteredUsers = filteredUsers.filter(u => u.role === 'customer' || u.role === 'driver');
      }
      
      setUsers(filteredUsers);
      setOrders((allOrders || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100));
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    
    const matchesRole = recipientFilter === 'all' || user.role === recipientFilter;
    
    return matchesSearch && matchesRole;
  });

  // Get user by ID
  const getUserById = (id) => users.find(u => u.id === id);
  const getOrderById = (id) => orders.find(o => o.id === id);

  // Toggle recipient selection
  const toggleRecipient = (userId) => {
    setSelectedRecipients(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all filtered users
  const selectAllFiltered = () => {
    const filteredIds = filteredUsers.map(u => u.id);
    setSelectedRecipients(prev => {
      const newSet = new Set([...prev, ...filteredIds]);
      return Array.from(newSet);
    });
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedRecipients([]);
  };

  // SMS Templates
  const smsTemplateOptions = [
    { id: 'custom', name: 'Custom Message' },
    { id: 'orderConfirmation', name: 'Order Confirmation', category: 'order' },
    { id: 'pickedUp', name: 'Items Picked Up', category: 'order' },
    { id: 'ready', name: 'Ready for Delivery', category: 'order' },
    { id: 'outForDelivery', name: 'Out for Delivery', category: 'order' },
    { id: 'delivered', name: 'Delivered', category: 'order' },
    { id: 'invoiceReminder', name: 'Invoice Reminder', category: 'payment' },
    { id: 'paymentReceived', name: 'Payment Received', category: 'payment' },
    { id: 'welcomeOffer', name: 'Welcome Offer', category: 'promo' },
    { id: 'loyaltyReward', name: 'Loyalty Reward', category: 'promo' },
  ];

  // Email Templates
  const emailTemplateOptions = [
    { id: 'custom', name: 'Custom Email' },
    { id: 'orderConfirmation', name: 'Order Confirmation' },
    { id: 'loginCredentials', name: 'Login Credentials' },
    { id: 'invoiceEmail', name: 'Invoice Email' },
    { id: 'receiptEmail', name: 'Receipt Email' },
    { id: 'promotionalEmail', name: 'Promotional' },
  ];

  // Apply SMS template
  const applySmsTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    if (templateId === 'custom') {
      setMessageForm(prev => ({ ...prev, smsMessage: '' }));
      return;
    }
    
    // Get template message
    const order = messageForm.selectedOrderId ? getOrderById(messageForm.selectedOrderId) : null;
    let message = '';
    
    switch (templateId) {
      case 'orderConfirmation':
        message = order ? smsTemplates.orderConfirmation(order.reference_code, order.pickup_date, order.pickup_time_slot) : 
          'Your order has been confirmed! Reference: [REF]. Pickup: [DATE] [TIME]';
        break;
      case 'pickedUp':
        message = order ? smsTemplates.pickedUp(order.reference_code) : 
          'Your items have been picked up! Order #[REF] is being processed.';
        break;
      case 'ready':
        message = order ? smsTemplates.ready(order.reference_code, order.delivery_date, order.delivery_time_slot) : 
          'Great news! Order #[REF] is ready. Delivery: [DATE] [TIME]';
        break;
      case 'outForDelivery':
        message = order ? smsTemplates.outForDelivery(order.reference_code, 'Your driver') : 
          'Your order #[REF] is out for delivery! Driver: [NAME]';
        break;
      case 'delivered':
        message = order ? smsTemplates.delivered(order.reference_code) : 
          'Order #[REF] has been delivered! Thank you for choosing Amani\'s Cleaners.';
        break;
      case 'invoiceReminder':
        message = order ? smsTemplates.invoiceReminder(order.reference_code, order.total?.toFixed(2) || '0.00', 'due soon') : 
          'Reminder: Invoice #[REF] for $[AMOUNT] is due [DATE].';
        break;
      case 'paymentReceived':
        message = order ? smsTemplates.paymentReceived(order.reference_code, order.total?.toFixed(2) || '0.00') : 
          'Payment of $[AMOUNT] received for order #[REF]. Thank you!';
        break;
      case 'welcomeOffer':
        message = 'Welcome to Amani\'s Cleaners! Use code WELCOME15 for 15% off your first order.';
        break;
      case 'loyaltyReward':
        message = 'You\'ve earned loyalty points! Redeem them on your next order.';
        break;
      default:
        message = '';
    }
    
    setMessageForm(prev => ({ ...prev, smsMessage: message }));
  };

  // Apply Email template
  const applyEmailTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    if (templateId === 'custom') {
      setMessageForm(prev => ({ ...prev, emailSubject: '', emailBody: '' }));
      return;
    }
    
    const order = messageForm.selectedOrderId ? getOrderById(messageForm.selectedOrderId) : null;
    let subject = '';
    let body = '';
    
    switch (templateId) {
      case 'orderConfirmation':
        subject = order ? `Order Confirmed - #${order.reference_code}` : 'Order Confirmed - #[REF]';
        body = order ? 
          `Hi ${order.customer_name},\n\nThank you for your order! Your order #${order.reference_code} has been confirmed.\n\nPickup: ${order.pickup_date}\nDelivery: ${order.delivery_date}\nTotal: $${order.total?.toFixed(2)}\n\nTrack your order at: ${window.location.origin}/track/${order.reference_code}\n\nThank you for choosing Amani's Cleaners!` :
          'Hi [NAME],\n\nThank you for your order! Your order #[REF] has been confirmed.\n\nPickup: [DATE]\nDelivery: [DATE]\nTotal: $[AMOUNT]\n\nThank you for choosing Amani\'s Cleaners!';
        break;
      case 'invoiceEmail':
        subject = order ? `Invoice #${order.reference_code}` : 'Invoice #[REF]';
        body = order ?
          `Hi ${order.customer_name},\n\nPlease find your invoice for order #${order.reference_code}.\n\nTotal Amount: $${order.total?.toFixed(2)}\nPayment Status: ${order.payment_status}\n\nThank you for your business!` :
          'Hi [NAME],\n\nPlease find your invoice attached.\n\nThank you for your business!';
        setMessageForm(prev => ({ ...prev, attachInvoice: true }));
        break;
      case 'receiptEmail':
        subject = order ? `Receipt #${order.reference_code}` : 'Receipt #[REF]';
        body = order ?
          `Hi ${order.customer_name},\n\nThank you for your payment! Please find your receipt for order #${order.reference_code}.\n\nAmount Paid: $${order.total?.toFixed(2)}\n\nWe appreciate your business!` :
          'Hi [NAME],\n\nThank you for your payment! Please find your receipt attached.\n\nWe appreciate your business!';
        setMessageForm(prev => ({ ...prev, attachReceipt: true }));
        break;
      case 'promotionalEmail':
        subject = 'Special Offer from Amani\'s Cleaners! 🍁';
        body = 'Hi there!\n\nWe have a special offer just for you!\n\n[Add your promotional content here]\n\nDon\'t miss out - visit us today!\n\nAmani\'s Cleaners';
        break;
      default:
        subject = '';
        body = '';
    }
    
    setMessageForm(prev => ({ ...prev, emailSubject: subject, emailBody: body }));
  };

  // Send SMS
  const handleSendSMS = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!messageForm.smsMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const userId of selectedRecipients) {
      const user = getUserById(userId);
      if (!user?.phone) {
        failCount++;
        continue;
      }
      
      try {
        await sendSMS(user.phone, messageForm.smsMessage);
        successCount++;
      } catch (error) {
        console.error(`Failed to send SMS to ${user.phone}:`, error);
        failCount++;
      }
    }

    setSending(false);
    
    if (successCount > 0) {
      toast.success(`SMS sent to ${successCount} recipient(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to send to ${failCount} recipient(s)`);
    }
    
    // Clear form
    setMessageForm(prev => ({ ...prev, smsMessage: '' }));
    setSelectedTemplate('custom');
  };

  // Send Email
  const handleSendEmail = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!messageForm.emailSubject.trim() || !messageForm.emailBody.trim()) {
      toast.error('Please enter subject and message');
      return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    const order = messageForm.selectedOrderId ? getOrderById(messageForm.selectedOrderId) : null;

    for (const userId of selectedRecipients) {
      const user = getUserById(userId);
      if (!user?.email) {
        failCount++;
        continue;
      }
      
      try {
        // Build HTML body
        let htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2D9CDB, #C9379D); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Amani's Cleaners 🍁</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              ${messageForm.emailBody.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
        `;
        
        // Add invoice/receipt if attached
        if (messageForm.attachInvoice && order) {
          htmlBody += `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <h3>Invoice</h3>
              ${generateInvoiceHTML(order)}
            </div>
          `;
        }
        
        if (messageForm.attachReceipt && order) {
          htmlBody += `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <h3>Receipt</h3>
              ${generateReceiptHTML(order)}
            </div>
          `;
        }
        
        htmlBody += `
            </div>
            <div style="background: #1a2055; color: white; padding: 20px; text-align: center; font-size: 14px;">
              <p style="margin: 0;">Amani's Cleaners - Proudly Canadian Since 2013</p>
            </div>
          </div>
        `;
        
        await sendEmail(user.email, messageForm.emailSubject, htmlBody);
        successCount++;
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
        failCount++;
      }
    }

    setSending(false);
    
    if (successCount > 0) {
      toast.success(`Email sent to ${successCount} recipient(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to send to ${failCount} recipient(s)`);
    }
    
    // Clear form
    setMessageForm(prev => ({ ...prev, emailSubject: '', emailBody: '', attachInvoice: false, attachReceipt: false }));
    setSelectedTemplate('custom');
  };

  // Send Notification
  const handleSendNotification = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!messageForm.notifTitle.trim() || !messageForm.notifMessage.trim()) {
      toast.error('Please enter title and message');
      return;
    }

    setSending(true);
    
    try {
      const notification = {
        title: messageForm.notifTitle,
        message: messageForm.notifMessage,
        type: messageForm.notifType,
        link: messageForm.notifLink || null,
      };
      
      await notificationService.sendToUsers(selectedRecipients, notification);
      toast.success(`Notification sent to ${selectedRecipients.length} recipient(s)`);
      
      // Clear form
      setMessageForm(prev => ({ 
        ...prev, 
        notifTitle: '', 
        notifMessage: '', 
        notifType: 'info', 
        notifLink: '' 
      }));
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  // Use notification template
  const applyNotifTemplate = (templateName) => {
    const order = messageForm.selectedOrderId ? getOrderById(messageForm.selectedOrderId) : null;
    const mockOrder = { reference_code: 'EXAMPLE', items: [] };
    const mockUser = { first_name: 'Customer' };
    
    let template;
    switch (templateName) {
      case 'orderConfirmed':
        template = notificationTemplates.orderConfirmed(order || mockOrder);
        break;
      case 'orderPickedUp':
        template = notificationTemplates.orderPickedUp(order || mockOrder);
        break;
      case 'orderReady':
        template = notificationTemplates.orderReady(order || mockOrder);
        break;
      case 'orderOutForDelivery':
        template = notificationTemplates.orderOutForDelivery(order || mockOrder);
        break;
      case 'orderDelivered':
        template = notificationTemplates.orderDelivered(order || mockOrder);
        break;
      case 'newPickupAssigned':
        template = notificationTemplates.newPickupAssigned(order || mockOrder);
        break;
      case 'newDeliveryAssigned':
        template = notificationTemplates.newDeliveryAssigned(order || mockOrder);
        break;
      case 'welcomeCustomer':
        template = notificationTemplates.welcomeCustomer(mockUser);
        break;
      case 'loyaltyReward':
        template = notificationTemplates.loyaltyReward(100);
        break;
      default:
        return;
    }
    
    setMessageForm(prev => ({
      ...prev,
      notifTitle: template.title,
      notifMessage: template.message,
      notifType: template.type,
      notifLink: template.link || '',
    }));
    
    toast.success('Template loaded');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'customer': return Users;
      case 'driver': return Truck;
      case 'staff': return UserCheck;
      default: return User;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'customer': return 'bg-blue-100 text-blue-700';
      case 'driver': return 'bg-purple-100 text-purple-700';
      case 'staff': return 'bg-green-100 text-green-700';
      case 'admin': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amani-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-amani-green" />
            Messaging Center
          </h1>
          <p className="text-gray-500 mt-1">Send SMS, emails, and notifications to users</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recipient Selection */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recipients</h2>
            <p className="text-sm text-gray-500">{selectedRecipients.length} selected</p>
          </div>
          
          {/* Search and Filter */}
          <div className="p-4 space-y-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Search users..."
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {['all', 'customer', 'driver', ...(userRole === 'admin' ? ['staff'] : [])].map(role => (
                <button
                  key={role}
                  onClick={() => setRecipientFilter(role)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    recipientFilter === role
                      ? 'bg-amani-green text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={selectAllFiltered}
                className="flex-1 text-xs text-amani-green hover:text-amani-green-dark"
              >
                Select All ({filteredUsers.length})
              </button>
              <button
                onClick={clearSelection}
                className="flex-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
          
          {/* User List */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              filteredUsers.map(user => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(user.id)}
                      onChange={() => toggleRecipient(user.id)}
                      className="w-4 h-4 text-amani-green rounded"
                    />
                    <div className="w-10 h-10 bg-gradient-to-br from-amani-green to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Message Composer */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('sms')}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'sms'
                    ? 'border-amani-green text-amani-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Phone className="w-4 h-4" />
                SMS
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'email'
                    ? 'border-amani-green text-amani-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => setActiveTab('notification')}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'notification'
                    ? 'border-amani-green text-amani-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notification
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Order Selection for Templates */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Order (optional)
              </label>
              <select
                value={messageForm.selectedOrderId}
                onChange={(e) => setMessageForm(prev => ({ ...prev, selectedOrderId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">No order selected</option>
                {orders.slice(0, 50).map(order => (
                  <option key={order.id} value={order.id}>
                    #{order.reference_code} - {order.customer_name} (${order.total?.toFixed(2) || '0.00'})
                  </option>
                ))}
              </select>
            </div>

            {/* SMS Tab */}
            {activeTab === 'sms' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => applySmsTemplate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {smsTemplateOptions.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-gray-400">({messageForm.smsMessage.length}/160)</span>
                  </label>
                  <textarea
                    value={messageForm.smsMessage}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, smsMessage: e.target.value }))}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Type your SMS message..."
                  />
                </div>

                <button
                  onClick={handleSendSMS}
                  disabled={sending || selectedRecipients.length === 0 || !messageForm.smsMessage.trim()}
                  className="w-full py-3 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send SMS to {selectedRecipients.length} recipient(s)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => applyEmailTemplate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {emailTemplateOptions.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    value={messageForm.emailSubject}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, emailSubject: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Email subject..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea
                    value={messageForm.emailBody}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, emailBody: e.target.value }))}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Type your email message..."
                  />
                </div>

                {/* Attachments */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Attach:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={messageForm.attachInvoice}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, attachInvoice: e.target.checked }))}
                      className="w-4 h-4 text-amani-green rounded"
                      disabled={!messageForm.selectedOrderId}
                    />
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Invoice</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={messageForm.attachReceipt}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, attachReceipt: e.target.checked }))}
                      className="w-4 h-4 text-amani-green rounded"
                      disabled={!messageForm.selectedOrderId}
                    />
                    <Receipt className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Receipt</span>
                  </label>
                  {!messageForm.selectedOrderId && (
                    <span className="text-xs text-gray-400">(Select an order first)</span>
                  )}
                </div>

                <button
                  onClick={handleSendEmail}
                  disabled={sending || selectedRecipients.length === 0 || !messageForm.emailSubject.trim() || !messageForm.emailBody.trim()}
                  className="w-full py-3 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send Email to {selectedRecipients.length} recipient(s)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Notification Tab */}
            {activeTab === 'notification' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'orderConfirmed', name: 'Order Confirmed' },
                      { id: 'orderPickedUp', name: 'Picked Up' },
                      { id: 'orderReady', name: 'Ready' },
                      { id: 'orderOutForDelivery', name: 'Out for Delivery' },
                      { id: 'orderDelivered', name: 'Delivered' },
                      ...(userRole === 'admin' ? [
                        { id: 'newPickupAssigned', name: 'Driver: Pickup' },
                        { id: 'newDeliveryAssigned', name: 'Driver: Delivery' },
                        { id: 'welcomeCustomer', name: 'Welcome' },
                        { id: 'loyaltyReward', name: 'Loyalty' },
                      ] : [
                        { id: 'newPickupAssigned', name: 'Driver: Pickup' },
                        { id: 'newDeliveryAssigned', name: 'Driver: Delivery' },
                      ]),
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => applyNotifTemplate(t.id)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={messageForm.notifTitle}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, notifTitle: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="Notification title..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={messageForm.notifType}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, notifType: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="info">Info</option>
                      <option value="order">Order</option>
                      <option value="alert">Alert</option>
                      <option value="promo">Promo</option>
                      <option value="reminder">Reminder</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link (optional)</label>
                    <input
                      type="text"
                      value={messageForm.notifLink}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, notifLink: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="/account, /track/..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea
                    value={messageForm.notifMessage}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, notifMessage: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Notification message..."
                  />
                </div>

                <button
                  onClick={handleSendNotification}
                  disabled={sending || selectedRecipients.length === 0 || !messageForm.notifTitle.trim() || !messageForm.notifMessage.trim()}
                  className="w-full py-3 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Send Notification to {selectedRecipients.length} recipient(s)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
