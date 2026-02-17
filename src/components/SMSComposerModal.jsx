import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, X, Phone, Users, Loader2,
  CheckCircle, AlertCircle, FileText, Gift, Bell,
  Clock, CreditCard, User, Sparkles
} from 'lucide-react';
import { sendSMS, sendBulkSMS, smsTemplates, formatAddress } from '../lib/utils';
import toast from 'react-hot-toast';

const SMSComposerModal = ({ 
  isOpen, 
  onClose, 
  recipients = [], // Array of { phone, name, email } or single recipient
  order = null, // Optional order context
  defaultTemplate = null 
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate || 'custom');
  const [customMessage, setCustomMessage] = useState('');
  const [recipientList, setRecipientList] = useState([]);
  const [singleRecipient, setSingleRecipient] = useState('');
  const [sendResult, setSendResult] = useState(null);

  // Template categories
  const templateCategories = [
    {
      id: 'order',
      name: 'Order Updates',
      icon: FileText,
      templates: [
        { id: 'orderConfirmation', name: 'Order Confirmed', params: ['referenceCode', 'pickupDate', 'pickupTime'] },
        { id: 'pickupReminder', name: 'Pickup Reminder', params: ['referenceCode', 'pickupTime'] },
        { id: 'pickedUp', name: 'Items Picked Up', params: ['referenceCode'] },
        { id: 'processing', name: 'Processing', params: ['referenceCode'] },
        { id: 'ready', name: 'Ready for Delivery', params: ['referenceCode', 'deliveryDate', 'deliveryTime'] },
        { id: 'outForDelivery', name: 'Out for Delivery', params: ['referenceCode', 'driverName'] },
        { id: 'delivered', name: 'Delivered', params: ['referenceCode'] },
      ]
    },
    {
      id: 'payment',
      name: 'Payments',
      icon: CreditCard,
      templates: [
        { id: 'invoiceReminder', name: 'Invoice Reminder', params: ['referenceCode', 'amount', 'dueDate'] },
        { id: 'paymentReceived', name: 'Payment Received', params: ['referenceCode', 'amount'] },
        { id: 'paymentFailed', name: 'Payment Failed', params: ['referenceCode'] },
      ]
    },
    {
      id: 'promo',
      name: 'Promotions',
      icon: Gift,
      templates: [
        { id: 'welcomeOffer', name: 'Welcome Offer', params: ['customerName', 'discountCode', 'discountAmount'] },
        { id: 'loyaltyReward', name: 'Loyalty Reward', params: ['customerName', 'points', 'reward'] },
        { id: 'seasonalPromo', name: 'Seasonal Promo', params: ['promoName', 'discount', 'validUntil'] },
        { id: 'referralBonus', name: 'Referral Bonus', params: ['customerName', 'referralCode', 'bonus'] },
        { id: 'flashSale', name: 'Flash Sale', params: ['discount', 'hours'] },
      ]
    },
    {
      id: 'account',
      name: 'Account',
      icon: User,
      templates: [
        { id: 'loginCredentials', name: 'Login Credentials', params: ['email', 'tempPassword'] },
        { id: 'quickSignIn', name: 'Quick Sign-In Link', params: ['loginLink'] },
        { id: 'passwordReset', name: 'Password Reset', params: ['resetLink'] },
        { id: 'verifyPhone', name: 'Verify Phone', params: ['code'] },
      ]
    },
    {
      id: 'staff',
      name: 'Staff/Driver',
      icon: Bell,
      templates: [
        { id: 'newOrderAlert', name: 'New Order Alert', params: ['referenceCode', 'pickupAddress', 'pickupTime'] },
        { id: 'driverAssignment', name: 'Driver Assignment', params: ['driverName', 'referenceCode', 'pickupAddress'] },
        { id: 'shiftReminder', name: 'Shift Reminder', params: ['staffName', 'shiftTime', 'location'] },
      ]
    },
    {
      id: 'custom',
      name: 'Custom',
      icon: Sparkles,
      templates: [
        { id: 'customMessage', name: 'Custom Message', params: ['customerName', 'message'] },
        { id: 'appointmentReminder', name: 'Appointment Reminder', params: ['customerName', 'date', 'time', 'service'] },
        { id: 'feedbackRequest', name: 'Feedback Request', params: ['customerName', 'referenceCode'] },
      ]
    },
  ];

  // Template parameter values
  const [templateParams, setTemplateParams] = useState({
    referenceCode: order?.reference_code || '',
    pickupDate: order?.pickup_date || '',
    pickupTime: order?.pickup_time_slot || '',
    deliveryDate: order?.delivery_date || '',
    deliveryTime: order?.delivery_time_slot || '',
    driverName: '',
    customerName: recipients[0]?.name || '',
    amount: order?.total?.toFixed(2) || '',
    dueDate: '',
    discountCode: 'WELCOME15',
    discountAmount: '15% off',
    points: '100',
    reward: 'Free pickup',
    promoName: 'Spring Sale',
    discount: '20% off',
    validUntil: '',
    referralCode: 'REFER50',
    bonus: '$10',
    hours: '24',
    email: recipients[0]?.email || '',
    tempPassword: '',
    loginLink: '',
    resetLink: '',
    code: '',
    message: '',
    date: '',
    time: '',
    service: '',
    pickupAddress: formatAddress(order?.pickup_address) || '',
    staffName: '',
    shiftTime: '',
    location: '',
  });

  useEffect(() => {
    if (recipients && recipients.length > 0) {
      setRecipientList(recipients.map(r => typeof r === 'string' ? { phone: r } : r));
      if (recipients.length === 1) {
        setSingleRecipient(typeof recipients[0] === 'string' ? recipients[0] : recipients[0].phone);
      }
    }
    
    // Update params with order info if available
    if (order) {
      setTemplateParams(prev => ({
        ...prev,
        referenceCode: order.reference_code || prev.referenceCode,
        pickupDate: order.pickup_date || prev.pickupDate,
        pickupTime: order.pickup_time_slot || prev.pickupTime,
        deliveryDate: order.delivery_date || prev.deliveryDate,
        deliveryTime: order.delivery_time_slot || prev.deliveryTime,
        amount: order.total?.toFixed(2) || prev.amount,
        pickupAddress: formatAddress(order.pickup_address) || prev.pickupAddress,
        customerName: order.customer_name || prev.customerName,
      }));
    }
    
    // Update customer name from recipients
    if (recipients[0]?.name) {
      setTemplateParams(prev => ({
        ...prev,
        customerName: recipients[0].name,
      }));
    }
  }, [recipients, order]);

  // Generate message preview
  const getMessagePreview = () => {
    if (selectedTemplate === 'custom') {
      return customMessage || 'Type your custom message...';
    }
    
    const template = templateCategories
      .flatMap(cat => cat.templates)
      .find(t => t.id === selectedTemplate);
    
    if (!template || !smsTemplates[selectedTemplate]) {
      return 'Select a template...';
    }
    
    try {
      const params = template.params.map(p => templateParams[p] || `[${p}]`);
      return smsTemplates[selectedTemplate](...params);
    } catch (e) {
      return 'Error generating preview';
    }
  };

  const handleSend = async () => {
    const message = selectedTemplate === 'custom' 
      ? customMessage 
      : getMessagePreview();
    
    if (!message || message.includes('[') && message.includes(']')) {
      toast.error('Please fill in all template parameters');
      return;
    }

    const phones = recipientList.length > 0 
      ? recipientList.map(r => r.phone).filter(Boolean)
      : [singleRecipient].filter(Boolean);

    if (phones.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    setLoading(true);
    setSendResult(null);

    try {
      let result;
      if (phones.length === 1) {
        result = await sendSMS(phones[0], message);
      } else {
        result = await sendBulkSMS(phones, message);
      }

      if (result.success) {
        setSendResult({ success: true, count: phones.length });
        toast.success(`SMS sent to ${phones.length} recipient${phones.length > 1 ? 's' : ''}!`);
        
        // Auto-close after 2 seconds on success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSendResult({ success: false, error: result.error });
        toast.error(result.error || 'Failed to send SMS');
      }
    } catch (err) {
      setSendResult({ success: false, error: err.message });
      toast.error('Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  const characterCount = (selectedTemplate === 'custom' ? customMessage : getMessagePreview()).length;
  const smsCount = Math.ceil(characterCount / 160) || 1;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Send SMS</h2>
                  <p className="text-white/80 text-sm">
                    {recipientList.length > 1 
                      ? `${recipientList.length} recipients` 
                      : recipientList[0]?.name || singleRecipient || 'Enter recipient'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Recipient{recipientList.length > 1 ? 's' : ''}
              </label>
              {recipientList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recipientList.slice(0, 5).map((r, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {r.name || r.phone}
                    </span>
                  ))}
                  {recipientList.length > 5 && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      +{recipientList.length - 5} more
                    </span>
                  )}
                </div>
              ) : (
                <input
                  type="tel"
                  placeholder="+1 (416) 555-1234"
                  value={singleRecipient}
                  onChange={(e) => setSingleRecipient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              )}
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {templateCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = cat.templates.some(t => t.id === selectedTemplate) || 
                    (cat.id === 'custom' && selectedTemplate === 'custom');
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedTemplate(cat.templates[0].id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' 
                          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
              
              {/* Template Dropdown */}
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {templateCategories.map((cat) => (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Template Parameters */}
            {selectedTemplate !== 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Parameters
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {templateCategories
                    .flatMap(cat => cat.templates)
                    .find(t => t.id === selectedTemplate)?.params
                    .map(param => (
                      <div key={param}>
                        <label className="text-xs text-gray-500 capitalize">
                          {param.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <input
                          type="text"
                          value={templateParams[param] || ''}
                          onChange={(e) => setTemplateParams(prev => ({
                            ...prev,
                            [param]: e.target.value
                          }))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Custom Message */}
            {selectedTemplate === 'customMessage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your custom message here..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
              </div>
            )}

            {/* Message Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Preview
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {getMessagePreview()}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    {characterCount} characters • {smsCount} SMS segment{smsCount > 1 ? 's' : ''}
                  </span>
                  {characterCount > 160 && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Long message
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Send Result */}
            {sendResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-4 rounded-xl ${
                  sendResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {sendResult.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">
                      Successfully sent to {sendResult.count} recipient{sendResult.count > 1 ? 's' : ''}!
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800">{sendResult.error}</span>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {recipientList.length > 1 
                  ? `Sending to ${recipientList.length} recipients`
                  : 'Standard SMS rates apply'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send SMS
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SMSComposerModal;
