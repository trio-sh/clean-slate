import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Trash2, Plus, Minus, MapPin, Clock, 
  Truck, Package, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, Sparkles, Phone, Mail,
  Home, Building, User, ArrowLeft, FileText, Receipt, Download,
  Star, Check, X, Tag, Percent, Zap
} from 'lucide-react';
import { useCartStore, useAuthStore, useOrderStore, useAppStore } from '../../stores';
import { downloadInvoice, downloadReceipt, generateOrderQRCode, formatPhone, notificationService, notificationTemplates } from '../../lib/utils';
import db from '../../lib/db';
import toast from 'react-hot-toast';

const OrderPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, laundryWeight, setLaundryWeight, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { createOrder, loading } = useOrderStore();
  const { mode } = useAppStore();

  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState('pickup'); // pickup or drop-off
  
  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  // Default to 'new' mode - will switch to 'saved' if user has saved addresses
  const [addressMode, setAddressMode] = useState('new');
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const [formData, setFormData] = useState({
    // Contact
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    // Address
    address: '',
    unit: '',
    city: '',
    postalCode: '',
    province: 'ON',
    // Scheduling
    pickupDate: '',
    pickupTime: '',
    deliveryDate: '',
    deliveryTime: '',
    // Preferences
    notes: '',
    referenceNotes: '',
    deliveryInstructions: '',
    // Payment
    paymentMethod: 'cash',
  });
  const [errors, setErrors] = useState({});
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderReference, setOrderReference] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const timeSlots = [
    { value: 'morning', label: 'Morning (7AM - 11AM)' },
    { value: 'evening', label: 'Evening (6PM - 10PM)' },
  ];

  const laundryRate = 2.39;
  const minimumLaundry = 23;
  const flatRate = 64.01;
  const sameDayFee = 25;

  // Promo codes available
  const promoCodes = {
    'FIRST15': { type: 'percent', value: 15, description: '15% off first order', firstOrderOnly: true },
    'SUMMER10': { type: 'percent', value: 10, description: '10% off summer special' },
    'SAVE5': { type: 'fixed', value: 5, description: '$5 off your order' },
  };

  // Calculate totals
  const itemsTotal = items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  const laundryTotal = laundryWeight > 0 
    ? (laundryWeight >= minimumLaundry ? laundryWeight * laundryRate : flatRate)
    : 0;
  const subtotal = itemsTotal + laundryTotal;
  
  // Apply promo discount
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percent') {
      discount = subtotal * (appliedPromo.value / 100);
    } else {
      discount = Math.min(appliedPromo.value, subtotal);
    }
  }
  
  const discountedSubtotal = subtotal - discount;
  const tax = discountedSubtotal * 0.13; // HST
  const total = discountedSubtotal + tax;

  // Fetch saved addresses
  const loadSavedAddresses = useCallback(async () => {
    if (!user || !isAuthenticated) return;
    
    setLoadingAddresses(true);
    try {
      const allAddresses = await db.getByField('addresses', 'user_id', user.id);
      setSavedAddresses(allAddresses || []);
      
      // Auto-select default address
      const defaultAddr = allAddresses?.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setAddressMode('saved');
      } else if (allAddresses?.length > 0) {
        setSelectedAddressId(allAddresses[0].id);
        setAddressMode('saved');
      } else {
        setAddressMode('new');
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    loadSavedAddresses();
  }, [loadSavedAddresses]);

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.first_name || prev.firstName,
        lastName: user.last_name || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Get selected address object
  const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId);

  // Handle address selection
  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    setAddressMode('saved');
    setErrors(prev => ({ ...prev, address: null, city: null, postalCode: null }));
  };

  // Apply promo code
  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoCode.toUpperCase().trim();
    
    if (!code) {
      setPromoError('Please enter a promo code');
      return;
    }
    
    const promo = promoCodes[code];
    if (!promo) {
      setPromoError('Invalid promo code');
      return;
    }
    
    if (promo.firstOrderOnly && user?.first_order_discount_used) {
      setPromoError('This code is for first orders only');
      return;
    }
    
    setAppliedPromo({ ...promo, code });
    toast.success(`Promo code applied: ${promo.description}`);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 2) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.phone) newErrors.phone = 'Phone is required';
      
      if (orderType === 'pickup') {
        // Check if user has a valid address (either saved selection OR manual entry)
        const hasManualAddress = formData.address && formData.city && formData.postalCode;
        const hasSavedAddress = addressMode === 'saved' && selectedAddressId;
        
        if (!hasManualAddress && !hasSavedAddress) {
          // Neither manual nor saved address is valid
          if (isAuthenticated && savedAddresses.length > 0 && addressMode === 'saved') {
            newErrors.address = 'Please select an address';
          } else {
            // Guest or no saved addresses - require manual entry
            if (!formData.address) newErrors.address = 'Street address is required';
            if (!formData.city) newErrors.city = 'City is required';
            if (!formData.postalCode) newErrors.postalCode = 'Postal code is required';
          }
        }
      }
    }
    
    if (currentStep === 3) {
      if (orderType === 'pickup') {
        if (!formData.pickupDate) newErrors.pickupDate = 'Pickup date is required';
        if (!formData.pickupTime) newErrors.pickupTime = 'Pickup time is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Build address string from selected or new address
  // Prefer manual entry if all required fields are filled
  const getAddressString = () => {
    const hasManualAddress = formData.address && formData.city && formData.postalCode;
    
    // Use manual address if filled in, otherwise use saved address
    if (hasManualAddress) {
      const parts = [formData.address];
      if (formData.unit) parts[0] += `, ${formData.unit}`;
      parts.push(formData.city);
      parts.push(formData.province || 'ON');
      parts.push(formData.postalCode);
      return parts.join(', ');
    } else if (addressMode === 'saved' && selectedAddress) {
      const parts = [selectedAddress.street];
      if (selectedAddress.unit) parts[0] += `, ${selectedAddress.unit}`;
      parts.push(selectedAddress.city);
      parts.push(selectedAddress.province || 'ON');
      parts.push(selectedAddress.postal_code);
      return parts.join(', ');
    }
    return '';
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    try {
      // Check for same day service addon
      const sameDayAddon = items.find(item => item.isAddon && item.addonType === 'same-day');
      
      // Build customer notes with same day service info if applicable
      let customerNotes = formData.notes || '';
      if (sameDayAddon) {
        const sameDayNote = `\n\n⚡ SAME DAY SERVICE REQUESTED ⚡\nService: ${sameDayAddon.name}\nTurnaround: ${sameDayAddon.turnaround || 'Same day'}\nFee: $${sameDayAddon.price}\n\nCustomer acknowledges: Same day service requires order placed before 10 AM. Subject to item type and availability. Rush processing may not include all services.`;
        customerNotes = customerNotes ? customerNotes + sameDayNote : sameDayNote.trim();
      }

      // Determine if using manual address entry
      const hasManualAddress = formData.address && formData.city && formData.postalCode;
      const usingSavedAddress = !hasManualAddress && addressMode === 'saved' && selectedAddressId;
      
      // Save new address if requested (only for auth users with manual entry)
      let addressId = null;
      if (hasManualAddress && saveNewAddress && isAuthenticated) {
        try {
          const newAddr = await db.create('addresses', {
            user_id: user.id,
            label: newAddressLabel,
            street: formData.address,
            unit: formData.unit,
            city: formData.city,
            province: formData.province || 'ON',
            postal_code: formData.postalCode,
            is_default: savedAddresses.length === 0,
            delivery_instructions: formData.deliveryInstructions,
          });
          addressId = newAddr.id;
          toast.success('Address saved to your account!');
        } catch (err) {
          console.error('Failed to save address:', err);
        }
      } else if (usingSavedAddress) {
        addressId = selectedAddressId;
      }

      const customerName = `${formData.firstName} ${formData.lastName}`.trim();
      const addressString = getAddressString();
      
      const orderData = {
        customer_id: user?.id || null,
        customer_name: customerName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        order_type: orderType,
        is_guest_order: !isAuthenticated,
        status: 'pending_pickup',
        pickup_address_id: addressId,
        delivery_address_id: addressId,
        pickup_address: orderType === 'pickup' ? addressString : null,
        delivery_address: orderType === 'pickup' ? addressString : null,
        pickup_date: formData.pickupDate || null,
        pickup_time_slot: formData.pickupTime || null,
        delivery_date: formData.deliveryDate || null,
        delivery_time_slot: formData.deliveryTime || null,
        customer_notes: customerNotes,
        reference_notes: formData.referenceNotes,
        delivery_instructions: formData.deliveryInstructions,
        subtotal,
        discount_amount: discount,
        discount_code: appliedPromo?.code || null,
        tax,
        total,
        payment_method: formData.paymentMethod,
        items: [
          ...items.map(item => ({
            service_id: item.id,
            service_name: item.name,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.price || 0,
            total_price: (item.price || 0) * item.quantity
          })),
          ...(laundryWeight > 0 ? [{
            service_id: 'laundry',
            service_name: 'Wash & Fold',
            name: 'Wash & Fold',
            quantity: laundryWeight,
            unit_price: laundryRate,
            total_price: laundryTotal
          }] : [])
        ],
      };

      const result = await createOrder(orderData);
      
      if (result.success) {
        // Mark first order discount as used
        if (appliedPromo?.firstOrderOnly && user) {
          try {
            await db.update('users', user.id, { first_order_discount_used: true });
          } catch (e) {
            console.error('Failed to update first order flag:', e);
          }
        }
        
        // Send notification to customer (if logged in)
        if (user?.id) {
          try {
            const notification = notificationTemplates.orderConfirmed(result.order);
            await notificationService.sendToUser(user.id, notification);
          } catch (e) {
            console.error('Failed to send notification:', e);
          }
        }
        
        // Notify staff about new order (find all staff)
        try {
          const notification = notificationTemplates.orderNeedsProcessing(result.order);
          await notificationService.broadcastToRole('staff', notification);
          await notificationService.broadcastToRole('admin', notification);
        } catch (e) {
          console.error('Failed to notify staff:', e);
        }
        
        setOrderReference(result.order.reference_code);
        setCompletedOrder(result.order);
        setOrderComplete(true);
        clearCart();
        
        // Generate QR code
        try {
          const qrUrl = await generateOrderQRCode(result.order.reference_code);
          setQrCodeUrl(qrUrl);
        } catch (qrError) {
          console.error('Failed to generate QR code:', qrError);
        }
        
        toast.success('Order placed successfully!');
      }
    } catch (error) {
      console.error('Order failed:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    }
  };

  // Get available dates (next 7 days excluding Sundays)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 10 && dates.length < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0) { // Exclude Sundays
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          isToday: i === 0,
        });
      }
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // Order Complete View
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
              <h1 className="text-3xl font-display font-bold mb-2">Order Confirmed!</h1>
              <p className="text-green-100">Thank you for choosing Amani's Cleaners</p>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-gray-600 mb-2">Your Reference Code:</p>
                <div className="inline-block bg-navy-900 text-white text-3xl font-mono px-6 py-3 rounded-xl tracking-wider">
                  {orderReference}
                </div>
                <p className="text-sm text-gray-500 mt-2">Save this code to track your order</p>
              </div>

              {qrCodeUrl && (
                <div className="text-center mb-8">
                  <p className="text-gray-600 mb-2">Scan to track:</p>
                  <img src={qrCodeUrl} alt="Order QR Code" className="mx-auto w-32 h-32" />
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-navy-900 mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items</span>
                    <span className="font-medium">{completedOrder?.items?.length || 0} services</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${(completedOrder?.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {(completedOrder?.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount {completedOrder?.discount_code ? `(${completedOrder.discount_code})` : ''}</span>
                      <span>-${(completedOrder?.discount_amount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (HST 13%)</span>
                    <span className="font-medium">${(completedOrder?.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-amani-600">${(completedOrder?.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {completedOrder?.pickup_date && (
                <div className="bg-amani-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-navy-900 mb-2">Pickup Scheduled</h3>
                  <p className="text-gray-700">
                    📅 {new Date(completedOrder.pickup_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-gray-600 text-sm">
                    ⏰ {completedOrder.pickup_time_slot === 'morning' ? '7AM - 11AM' : '6PM - 10PM'}
                  </p>
                </div>
              )}

              {/* Download buttons */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => downloadInvoice(completedOrder)}
                  className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-navy-200 rounded-xl hover:bg-navy-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-navy-600" />
                  <span className="font-medium text-navy-900">Invoice</span>
                </button>
                <button
                  onClick={() => downloadReceipt(completedOrder)}
                  className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-navy-200 rounded-xl hover:bg-navy-50 transition-colors"
                >
                  <Receipt className="w-5 h-5 text-navy-600" />
                  <span className="font-medium text-navy-900">Receipt</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate(`/track/${orderReference}`)}
                  className="flex-1 btn-primary"
                >
                  Track Order
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 btn-secondary"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Empty cart view
  if (items.length === 0 && laundryWeight === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm p-12"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-navy-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some items to get started with your laundry order.</p>
            <button
              onClick={() => navigate('/services')}
              className="btn-primary"
            >
              Browse Services
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-navy-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-display font-bold text-navy-900">Checkout</h1>
          <div className="w-20" />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {['Cart', 'Details', 'Schedule', 'Payment'].map((label, index) => (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-2 ${index + 1 <= step ? 'text-amani-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index + 1 < step ? 'bg-amani-500 text-white' :
                  index + 1 === step ? 'bg-amani-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1 < step ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className="hidden sm:inline font-medium">{label}</span>
              </div>
              {index < 3 && (
                <div className={`w-12 sm:w-20 h-1 mx-2 rounded ${
                  index + 1 < step ? 'bg-amani-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Cart Review */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Order Type Selection */}
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-4">How would you like to order?</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setOrderType('pickup')}
                        className={`p-6 rounded-2xl border-2 transition-all text-left ${
                          orderType === 'pickup'
                            ? 'border-amani-500 bg-amani-50'
                            : 'border-gray-200 hover:border-amani-200'
                        }`}
                      >
                        <Truck className={`w-8 h-8 mb-3 ${orderType === 'pickup' ? 'text-amani-600' : 'text-gray-400'}`} />
                        <h3 className="font-semibold text-navy-900 mb-1">Pickup & Delivery</h3>
                        <p className="text-sm text-gray-600">We'll pick up and deliver to your address</p>
                      </button>
                      <button
                        onClick={() => setOrderType('drop-off')}
                        className={`p-6 rounded-2xl border-2 transition-all text-left ${
                          orderType === 'drop-off'
                            ? 'border-amani-500 bg-amani-50'
                            : 'border-gray-200 hover:border-amani-200'
                        }`}
                      >
                        <Building className={`w-8 h-8 mb-3 ${orderType === 'drop-off' ? 'text-amani-600' : 'text-gray-400'}`} />
                        <h3 className="font-semibold text-navy-900 mb-1">Drop Off</h3>
                        <p className="text-sm text-gray-600">Bring items to one of our locations</p>
                      </button>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-6 h-6" />
                      Your Items ({items.length})
                    </h2>
                    
                    {items.length > 0 && (
                      <div className="divide-y divide-gray-100">
                        {items.map((item) => (
                          <div key={item.id} className={`py-4 flex items-center justify-between ${item.isAddon ? 'bg-amber-50 -mx-6 px-6 border-l-4 border-amber-400' : ''}`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-navy-900">{item.name}</h3>
                                {item.isAddon && (
                                  <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Add-on
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                ${(item.price || 0).toFixed(2)} {item.isAddon ? 'fee' : 'each'}
                              </p>
                              {item.turnaround && (
                                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {item.turnaround} turnaround
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              {!item.isAddon && (
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              <span className="w-20 text-right font-medium">
                                ${((item.price || 0) * item.quantity).toFixed(2)}
                              </span>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Laundry Weight */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-navy-900">Wash & Fold Laundry</h3>
                          <p className="text-sm text-gray-500">
                            ${laundryRate}/lb (Min {minimumLaundry} lbs or ${flatRate.toFixed(2)} flat rate)
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={laundryWeight || ''}
                            onChange={(e) => setLaundryWeight(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-20 input text-center"
                            placeholder="0"
                            min="0"
                          />
                          <span className="text-gray-600">lbs</span>
                        </div>
                      </div>
                      {laundryWeight > 0 && (
                        <div className="text-right text-sm text-gray-600">
                          Laundry total: <span className="font-medium text-navy-900">${laundryTotal.toFixed(2)}</span>
                          {laundryWeight < minimumLaundry && (
                            <span className="text-orange-600 ml-2">(flat rate applies)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Contact & Address */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-6 flex items-center gap-2">
                      <User className="w-6 h-6" />
                      Contact Information
                    </h2>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                          placeholder="John"
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Last Name *</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                          placeholder="Doe"
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className={`input ${errors.email ? 'border-red-500' : ''}`}
                          placeholder="john@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className={`input ${errors.phone ? 'border-red-500' : ''}`}
                          placeholder="(416) 555-0123"
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {orderType === 'pickup' && (
                    <div className="card p-6">
                      <h2 className="text-xl font-semibold text-navy-900 mb-6 flex items-center gap-2">
                        <MapPin className="w-6 h-6" />
                        Pickup Address
                      </h2>

                      {/* Saved Addresses - Only show for authenticated users with saved addresses */}
                      {isAuthenticated && savedAddresses.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-navy-700">Select a Saved Address</label>
                          </div>
                          
                          <div className="space-y-3">
                            {savedAddresses.map((address) => (
                              <div
                                key={address.id}
                                onClick={() => {
                                  handleAddressSelect(address.id);
                                  // Clear manual entry when selecting saved
                                  setFormData(prev => ({ ...prev, address: '', unit: '', city: '', postalCode: '' }));
                                }}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                  selectedAddressId === address.id && addressMode === 'saved' && !formData.address
                                    ? 'border-amani-500 bg-amani-50'
                                    : 'border-gray-200 hover:border-amani-200'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      selectedAddressId === address.id && addressMode === 'saved' && !formData.address
                                        ? 'border-amani-500 bg-amani-500'
                                        : 'border-gray-300'
                                    }`}>
                                      {selectedAddressId === address.id && addressMode === 'saved' && !formData.address && (
                                        <Check className="w-3 h-3 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-navy-900">{address.label || 'Address'}</span>
                                        {address.is_default && (
                                          <span className="text-xs bg-amani-100 text-amani-700 px-2 py-0.5 rounded-full">
                                            Default
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-gray-600 text-sm mt-0.5">
                                        {address.street}{address.unit ? `, ${address.unit}` : ''}
                                      </p>
                                      <p className="text-gray-500 text-sm">
                                        {address.city}, {address.province || 'ON'} {address.postal_code}
                                      </p>
                                    </div>
                                  </div>
                                  {address.label === 'Home' && <Home className="w-5 h-5 text-gray-400" />}
                                  {address.label === 'Work' && <Building className="w-5 h-5 text-gray-400" />}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 flex items-center gap-2">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-sm text-gray-500">or enter address manually</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>
                        </div>
                      )}

                      {/* Manual Address Entry - Always show */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-1">
                            Street Address {!isAuthenticated || savedAddresses.length === 0 ? '*' : ''}
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, address: e.target.value }));
                              // Clear saved selection when typing manual address
                              if (e.target.value) {
                                setSelectedAddressId(null);
                                setAddressMode('new');
                              }
                            }}
                            className={`input ${errors.address ? 'border-red-500' : ''}`}
                            placeholder="123 Main Street"
                          />
                          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Unit/Apt</label>
                            <input
                              type="text"
                              value={formData.unit}
                              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                              className="input"
                              placeholder="Unit 5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">
                              City {!isAuthenticated || savedAddresses.length === 0 ? '*' : ''}
                            </label>
                            <input
                              type="text"
                              value={formData.city}
                              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                              className={`input ${errors.city ? 'border-red-500' : ''}`}
                              placeholder="Toronto"
                            />
                            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">
                              Postal Code {!isAuthenticated || savedAddresses.length === 0 ? '*' : ''}
                            </label>
                            <input
                              type="text"
                              value={formData.postalCode}
                              onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value.toUpperCase() }))}
                              className={`input ${errors.postalCode ? 'border-red-500' : ''}`}
                              placeholder="M5V 1A1"
                              maxLength={7}
                            />
                            {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                            </div>
                          </div>

                          {/* Delivery Instructions */}
                          <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Delivery Instructions (Optional)</label>
                            <textarea
                              value={formData.deliveryInstructions}
                              onChange={(e) => setFormData(prev => ({ ...prev, deliveryInstructions: e.target.value }))}
                              className="input"
                              rows={2}
                              placeholder="e.g., Ring doorbell, leave at concierge, gate code..."
                            />
                          </div>

                          {/* Save address option for logged in users - only show when manually entering */}
                          {isAuthenticated && formData.address && (
                            <div className="pt-4 border-t border-gray-100">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={saveNewAddress}
                                  onChange={(e) => setSaveNewAddress(e.target.checked)}
                                  className="w-5 h-5 rounded border-gray-300 text-amani-500 focus:ring-amani-500"
                                />
                                <span className="text-navy-900">Save this address for future orders</span>
                              </label>
                              
                              {saveNewAddress && (
                                <div className="mt-3 ml-8">
                                  <label className="block text-sm text-gray-600 mb-1">Address Label</label>
                                  <select
                                    value={newAddressLabel}
                                    onChange={(e) => setNewAddressLabel(e.target.value)}
                                    className="input w-auto"
                                  >
                                    <option value="Home">Home</option>
                                    <option value="Work">Work</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                    </div>
                  )}

                  {orderType === 'drop-off' && (
                    <div className="card p-6 bg-blue-50 border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-4">Our Locations</h3>
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4">
                          <h4 className="font-semibold text-navy-900">Toronto - Weston Road</h4>
                          <p className="text-gray-600">325 Weston Road, Unit 5D, M6N 3P1</p>
                          <p className="text-sm text-gray-500 mt-1">437-215-6321</p>
                        </div>
                        <div className="bg-white rounded-xl p-4">
                          <h4 className="font-semibold text-navy-900">North York - Weston Road</h4>
                          <p className="text-gray-600">3455 Weston Road, M9M 0G4</p>
                          <p className="text-sm text-gray-500 mt-1">647-764-5658</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Schedule */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-6 flex items-center gap-2">
                      <Calendar className="w-6 h-6" />
                      {orderType === 'pickup' ? 'Schedule Pickup' : 'Order Notes'}
                    </h2>
                    
                    {orderType === 'pickup' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-3">Pickup Date *</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {availableDates.map((date) => (
                              <button
                                key={date.value}
                                onClick={() => setFormData(prev => ({ ...prev, pickupDate: date.value }))}
                                className={`p-4 rounded-xl border-2 transition-all text-center ${
                                  formData.pickupDate === date.value
                                    ? 'border-amani-500 bg-amani-50'
                                    : 'border-gray-200 hover:border-amani-200'
                                }`}
                              >
                                <p className="font-medium text-navy-900">{date.label}</p>
                                {date.isToday && <p className="text-xs text-amani-600">Today</p>}
                              </button>
                            ))}
                          </div>
                          {errors.pickupDate && <p className="text-red-500 text-sm mt-2">{errors.pickupDate}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-3">Pickup Time *</label>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {timeSlots.map((slot) => (
                              <button
                                key={slot.value}
                                onClick={() => setFormData(prev => ({ ...prev, pickupTime: slot.value }))}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                  formData.pickupTime === slot.value
                                    ? 'border-amani-500 bg-amani-50'
                                    : 'border-gray-200 hover:border-amani-200'
                                }`}
                              >
                                <Clock className={`w-6 h-6 ${formData.pickupTime === slot.value ? 'text-amani-600' : 'text-gray-400'}`} />
                                <span className="font-medium text-navy-900">{slot.label}</span>
                              </button>
                            ))}
                          </div>
                          {errors.pickupTime && <p className="text-red-500 text-sm mt-2">{errors.pickupTime}</p>}
                        </div>
                      </div>
                    )}
                    
                    <div className={orderType === 'pickup' ? 'mt-6 pt-6 border-t border-gray-100' : ''}>
                      <label className="block text-sm font-medium text-navy-700 mb-2">Special Instructions (Optional)</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="input"
                        rows={3}
                        placeholder="Any special requests for your order..."
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-navy-700 mb-2">Reference Notes (Optional)</label>
                      <input
                        type="text"
                        value={formData.referenceNotes}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceNotes: e.target.value }))}
                        className="input"
                        placeholder="Your internal reference number or notes"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Payment */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-6">Payment Method</h2>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { value: 'cash', label: 'Cash on Delivery', icon: '💵' },
                        { value: 'card', label: 'Card on Delivery', icon: '💳' },
                      ].map((method) => (
                        <button
                          key={method.value}
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                          className={`p-6 rounded-xl border-2 transition-all text-left ${
                            formData.paymentMethod === method.value
                              ? 'border-amani-500 bg-amani-50'
                              : 'border-gray-200 hover:border-amani-200'
                          }`}
                        >
                          <span className="text-3xl mb-2 block">{method.icon}</span>
                          <span className="font-medium text-navy-900">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
                      <Tag className="w-6 h-6" />
                      Promo Code
                    </h2>
                    
                    {appliedPromo ? (
                      <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Percent className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">{appliedPromo.code}</p>
                            <p className="text-sm text-green-700">{appliedPromo.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={removePromo}
                          className="p-2 hover:bg-green-100 rounded-lg"
                        >
                          <X className="w-5 h-5 text-green-700" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value.toUpperCase());
                              setPromoError('');
                            }}
                            className="input flex-1"
                            placeholder="Enter promo code"
                          />
                          <button
                            onClick={handleApplyPromo}
                            className="btn-primary px-6"
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
                        {!user?.first_order_discount_used && (
                          <p className="text-sm text-gray-500 mt-2">
                            💡 First time? Try <span className="font-mono bg-gray-100 px-1 rounded">FIRST15</span> for 15% off!
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Review */}
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-4">Order Review</h2>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <User className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-navy-900">{formData.firstName} {formData.lastName}</p>
                          <p className="text-sm text-gray-600">{formData.email}</p>
                          <p className="text-sm text-gray-600">{formData.phone}</p>
                        </div>
                      </div>

                      {orderType === 'pickup' && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-navy-900">Pickup Address</p>
                            <p className="text-sm text-gray-600">{getAddressString()}</p>
                          </div>
                        </div>
                      )}

                      {formData.pickupDate && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-navy-900">Scheduled Pickup</p>
                            <p className="text-sm text-gray-600">
                              {new Date(formData.pickupDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                              {' • '}
                              {formData.pickupTime === 'morning' ? '7AM - 11AM' : '6PM - 10PM'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full btn-primary py-4 text-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        `Place Order • $${total.toFixed(2)}`
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button onClick={prevStep} className="btn-secondary">
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              ) : (
                <div />
              )}
              {step < 4 && (
                <button onClick={nextStep} className="btn-primary">
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-navy-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className={`flex justify-between text-sm ${item.isAddon ? 'bg-amber-50 -mx-2 px-2 py-1 rounded border-l-2 border-amber-400' : ''}`}>
                    <span className={item.isAddon ? 'text-amber-800 flex items-center gap-1' : 'text-gray-600'}>
                      {item.isAddon && <Zap className="w-3 h-3" />}
                      {item.name} {!item.isAddon && `× ${item.quantity}`}
                    </span>
                    <span className={`font-medium ${item.isAddon ? 'text-amber-700' : ''}`}>${((item.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {laundryWeight > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Wash & Fold ({laundryWeight} lbs)</span>
                    <span className="font-medium">${laundryTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedPromo?.code})</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">HST (13%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-amani-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Free pickup & delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>48-hour turnaround</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>100% satisfaction guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
