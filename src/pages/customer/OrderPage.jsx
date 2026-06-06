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
import { downloadInvoice, downloadReceipt, generateOrderQRCode, formatPhone, notificationService, notificationTemplates, sendSMS, smsTemplates } from '../../lib/utils';
import { useLanguage } from '../../i18n/LanguageContext';
import db from '../../lib/db';
import toast from 'react-hot-toast';

const OrderPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { items, updateQuantity, removeItem, laundryWeight, commercialLaundryWeight, setLaundryWeight, setCommercialLaundryWeight, clearCart, addItem: addCartItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { createOrder, loading } = useOrderStore();
  const { mode } = useAppStore();

  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState('pickup'); // pickup or drop-off

  // Add-ons state
  const [selectedAddons, setSelectedAddons] = useState({
    lowHeatDry: false,
    hypoallergenic: false,
    laundrySorting: false,
    sameDayRush: false,
    fabricSoftener: false,
    stainRemoval: false,
    scentBooster: false,
    starch: false,
  });

  // Starch quantity (per item pricing)
  const [starchQuantity, setStarchQuantity] = useState(0);

  // Draft values for manually-typed quantity inputs (keyed by item id), so a
  // user can type freely (including decimals / a temporarily empty field)
  // without the value being committed/removed on every keystroke.
  const [qtyDrafts, setQtyDrafts] = useState({});

  // Commit a manually-typed item quantity. Accepts decimals (e.g. weighted
  // items). An empty/invalid/<=0 entry reverts to the current quantity rather
  // than silently removing the line item (the trash button handles removal).
  const commitItemQuantity = (itemId, currentQty) => {
    setQtyDrafts((prev) => {
      const raw = prev[itemId];
      const next = { ...prev };
      delete next[itemId];
      if (raw !== undefined && raw !== '') {
        const parsed = parseFloat(raw);
        if (!Number.isNaN(parsed) && parsed > 0) {
          updateQuantity(itemId, parsed);
        }
      }
      return next;
    });
  };

  // Add-on prices
  const addonPrices = {
    lowHeatDry: 5.00,
    hypoallergenic: 5.00,
    laundrySorting: 15.00,
    sameDayRush: 25.00, // Average of $20-$35
    fabricSoftener: 1.00,
    stainRemoval: 3.00,
    scentBooster: 1.00,
    starch: 0.50, // Per item
  };

  // Calculate add-ons total
  const addonsTotal = Object.entries(selectedAddons).reduce((sum, [key, isSelected]) => {
    if (!isSelected) return sum;
    // Starch is per-item, multiply by quantity
    if (key === 'starch') {
      return sum + (addonPrices[key] * starchQuantity);
    }
    return sum + addonPrices[key];
  }, 0);
  
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
    { value: 'morning', label: t('order.morningSlot') },
    { value: 'evening', label: t('order.eveningSlot') },
  ];

  const laundryRate = 2.29;
  const minimumLaundry = 23;
  const flatRate = 64;
  const sameDayFee = 25;

  // Promo codes available
  const promoCodes = {
    'FIRST15': { type: 'percent', value: 15, description: t('order.promo15off'), firstOrderOnly: true },
    'SUMMER10': { type: 'percent', value: 10, description: t('order.promo10off') },
    'SAVE5': { type: 'fixed', value: 5, description: t('order.promo5off') },
  };

  // Calculate totals
  const itemsTotal = items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  const laundryTotal = laundryWeight > 0
    ? (laundryWeight >= minimumLaundry ? laundryWeight * laundryRate : flatRate)
    : 0;
  const commercialLaundryTotal = commercialLaundryWeight > 0
    ? (commercialLaundryWeight >= minimumLaundry ? commercialLaundryWeight * laundryRate : flatRate)
    : 0;
  const subtotal = itemsTotal + laundryTotal + commercialLaundryTotal + addonsTotal;
  
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
      if (!formData.firstName) newErrors.firstName = t('order.firstNameRequired');
      if (!formData.lastName) newErrors.lastName = t('order.lastNameRequired');
      if (!formData.email) newErrors.email = t('order.emailRequired');
      if (!formData.phone) newErrors.phone = t('order.phoneRequired');
      
      if (orderType === 'pickup') {
        // Check if user has a valid address (either saved selection OR manual entry)
        const hasManualAddress = formData.address && formData.city && formData.postalCode;
        const hasSavedAddress = addressMode === 'saved' && selectedAddressId;
        
        if (!hasManualAddress && !hasSavedAddress) {
          // Neither manual nor saved address is valid
          if (isAuthenticated && savedAddresses.length > 0 && addressMode === 'saved') {
            newErrors.address = t('order.selectAddressRequired');
          } else {
            // Guest or no saved addresses - require manual entry
            if (!formData.address) newErrors.address = t('order.streetAddressRequired');
            if (!formData.city) newErrors.city = t('order.cityRequired');
            if (!formData.postalCode) newErrors.postalCode = t('order.postalCodeRequired');
          }
        }
      }
    }

    if (currentStep === 3) {
      if (orderType === 'pickup') {
        if (!formData.pickupDate) newErrors.pickupDate = t('order.pickupDateRequired');
        if (!formData.pickupTime) newErrors.pickupTime = t('order.pickupTimeRequired');
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

  const minimumOrderAmount = 64;

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    if (subtotal < minimumOrderAmount) {
      setErrors({ submit: t('order.minimumOrderError', { amount: minimumOrderAmount }) });
      return;
    }

    try {
      // Build customer notes with add-on info
      let customerNotes = formData.notes || '';
      
      // Add add-ons information to notes
      const addonNotes = [];
      if (selectedAddons.lowHeatDry) {
        addonNotes.push('⚠️ LOW HEAT DRY REQUESTED - Gentle drying for delicate fabrics');
      }
      if (selectedAddons.hypoallergenic) {
        addonNotes.push('🌿 HYPOALLERGENIC WASH - Fragrance Free, Dye Free, Hypo-allergenic detergent');
      }
      if (selectedAddons.laundrySorting) {
        addonNotes.push('📋 LAUNDRY SORTING - Sort by color, empty pockets, separate dry cleaning');
      }
      if (selectedAddons.sameDayRush) {
        addonNotes.push('⚡ SAME DAY RUSH - Expedited same-day service (order before 10 AM)');
      }
      if (selectedAddons.fabricSoftener) {
        addonNotes.push('✨ FABRIC SOFTENER added');
      }
      if (selectedAddons.stainRemoval) {
        addonNotes.push('🧼 STAIN REMOVAL treatment requested (does not guarantee removal)');
      }
      if (selectedAddons.scentBooster) {
        addonNotes.push('🌸 SCENT BOOSTER added');
      }
      if (selectedAddons.starch && starchQuantity > 0) {
        addonNotes.push(`👔 STARCH - ${starchQuantity} items @ $0.50 each`);
      }

      if (addonNotes.length > 0) {
        const addonsSection = '\n\n=== ADD-ONS REQUESTED ===\n' + addonNotes.join('\n');
        customerNotes = customerNotes ? customerNotes + addonsSection : addonsSection.trim();
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
            service_name: 'Wash & Fold (Regular)',
            name: 'Wash & Fold (Regular)',
            quantity: laundryWeight,
            unit_price: laundryRate,
            total_price: laundryTotal
          }] : []),
          ...(commercialLaundryWeight > 0 ? [{
            service_id: 'laundry-commercial',
            service_name: 'Wash & Fold (Commercial)',
            name: 'Wash & Fold (Commercial)',
            quantity: commercialLaundryWeight,
            unit_price: laundryRate,
            total_price: commercialLaundryTotal
          }] : []),
          // Add-ons
          ...(selectedAddons.lowHeatDry ? [{
            service_id: 'addon-low-heat-dry',
            service_name: 'Low Heat Dry',
            name: 'Low Heat Dry',
            quantity: 1,
            unit_price: addonPrices.lowHeatDry,
            total_price: addonPrices.lowHeatDry
          }] : []),
          ...(selectedAddons.hypoallergenic ? [{
            service_id: 'addon-hypoallergenic',
            service_name: 'Hypoallergenic Wash',
            name: 'Hypoallergenic Wash',
            quantity: 1,
            unit_price: addonPrices.hypoallergenic,
            total_price: addonPrices.hypoallergenic
          }] : []),
          ...(selectedAddons.laundrySorting ? [{
            service_id: 'addon-laundry-sorting',
            service_name: 'Laundry Sorting',
            name: 'Laundry Sorting',
            quantity: 1,
            unit_price: addonPrices.laundrySorting,
            total_price: addonPrices.laundrySorting
          }] : []),
          ...(selectedAddons.sameDayRush ? [{
            service_id: 'addon-same-day-rush',
            service_name: 'Same Day Rush',
            name: 'Same Day Rush',
            quantity: 1,
            unit_price: addonPrices.sameDayRush,
            total_price: addonPrices.sameDayRush
          }] : []),
          ...(selectedAddons.fabricSoftener ? [{
            service_id: 'addon-fabric-softener',
            service_name: 'Fabric Softener',
            name: 'Fabric Softener',
            quantity: 1,
            unit_price: addonPrices.fabricSoftener,
            total_price: addonPrices.fabricSoftener
          }] : []),
          ...(selectedAddons.stainRemoval ? [{
            service_id: 'addon-stain-removal',
            service_name: 'Stain Removal',
            name: 'Stain Removal',
            quantity: 1,
            unit_price: addonPrices.stainRemoval,
            total_price: addonPrices.stainRemoval
          }] : []),
          ...(selectedAddons.scentBooster ? [{
            service_id: 'addon-scent-booster',
            service_name: 'Scent Booster',
            name: 'Scent Booster',
            quantity: 1,
            unit_price: addonPrices.scentBooster,
            total_price: addonPrices.scentBooster
          }] : []),
          ...(selectedAddons.starch && starchQuantity > 0 ? [{
            service_id: 'addon-starch',
            service_name: 'Starch',
            name: 'Starch',
            quantity: starchQuantity,
            unit_price: addonPrices.starch,
            total_price: addonPrices.starch * starchQuantity
          }] : [])
        ],
      };

      const result = await createOrder(orderData);

      if (result.success) {
        // Generate and redirect to payment link if selected
        if (formData.paymentMethod === 'payment_link') {
          try {
            toast.success('Generating secure payment link...');

            const paymentLinkResponse = await fetch('/api/create-payment-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: result.order.id,
                amount: total,
                currency: 'cad',
                customerEmail: formData.email,
                customerName: customerName,
                description: `Order ${result.order.reference_code} - Amani Cleaners`,
              }),
            });

            const paymentLinkData = await paymentLinkResponse.json();

            if (paymentLinkData.success) {
              // Redirect customer to Stripe payment page immediately
              console.log('Redirecting to payment link:', paymentLinkData.paymentLink);
              toast.success('Redirecting to secure payment...');

              // Clear cart before redirect
              clearCart();

              // Redirect to Stripe payment page
              window.location.href = paymentLinkData.paymentLink;
              return; // Exit early, don't show order confirmation yet
            } else {
              toast.error('Failed to create payment link');
            }
          } catch (e) {
            console.error('Failed to create payment link:', e);
            toast.error('Payment link generation failed, please contact support');
          }
        }

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

        // Auto-send SMS order summary to customer
        const customerPhone = result.order.customer_phone || orderData.customer_phone;
        if (customerPhone) {
          try {
            // Attach items so the template can build the breakdown
            const orderWithItems = { ...result.order, items: orderData.items };
            const smsMessage = smsTemplates.orderSummary(orderWithItems);
            await sendSMS(customerPhone, smsMessage);
            console.log('📱 Order summary SMS sent to', customerPhone);
          } catch (e) {
            console.error('Failed to send order SMS:', e);
          }
        }
        
        setOrderReference(result.order.reference_code);
        setCompletedOrder({ ...result.order, items: orderData.items });
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
              <h1 className="text-3xl font-display font-bold mb-2">{t('order.orderConfirmed')}</h1>
              <p className="text-green-100">{t('order.thankYouMessage')}</p>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-gray-600 mb-2">{t('order.yourReferenceCode')}</p>
                <div className="inline-block bg-navy-900 text-white text-3xl font-mono px-6 py-3 rounded-xl tracking-wider">
                  {orderReference}
                </div>
                <p className="text-sm text-gray-500 mt-2">{t('order.saveCodeToTrack')}</p>
              </div>

              {qrCodeUrl && (
                <div className="text-center mb-8">
                  <p className="text-gray-600 mb-2">{t('order.scanToTrack')}</p>
                  <img src={qrCodeUrl} alt="Order QR Code" className="mx-auto w-32 h-32" />
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-navy-900 mb-4">{t('order.orderSummary')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('order.items')}</span>
                    <span className="font-medium">{completedOrder?.items?.length || 0} {t('order.services')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('order.subtotal')}</span>
                    <span className="font-medium">${(completedOrder?.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {(completedOrder?.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t('order.discount')} {completedOrder?.discount_code ? `(${completedOrder.discount_code})` : ''}</span>
                      <span>-${(completedOrder?.discount_amount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('order.tax')}</span>
                    <span className="font-medium">${(completedOrder?.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                    <span className="font-semibold">{t('order.total')}</span>
                    <span className="font-bold text-amani-600">${(completedOrder?.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {completedOrder?.pickup_date && (
                <div className="bg-amani-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-navy-900 mb-2">{t('order.pickupScheduled')}</h3>
                  <p className="text-gray-700">
                    📅 {new Date(completedOrder.pickup_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-gray-600 text-sm">
                    ⏰ {completedOrder.pickup_time_slot === 'morning' ? t('order.morningTime') : t('order.eveningTime')}
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
                  <span className="font-medium text-navy-900">{t('order.invoice')}</span>
                </button>
                <button
                  onClick={() => downloadReceipt(completedOrder)}
                  className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-navy-200 rounded-xl hover:bg-navy-50 transition-colors"
                >
                  <Receipt className="w-5 h-5 text-navy-600" />
                  <span className="font-medium text-navy-900">{t('order.receipt')}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate(`/track/${orderReference}`)}
                  className="flex-1 btn-primary"
                >
                  {t('order.trackOrder')}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 btn-secondary"
                >
                  {t('order.continueShopping')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Empty cart view
  if (items.length === 0 && laundryWeight === 0 && commercialLaundryWeight === 0) {
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
            <h2 className="text-2xl font-display font-bold text-navy-900 mb-2">{t('order.emptyCart')}</h2>
            <p className="text-gray-600 mb-8">{t('order.emptyCartDesc')}</p>
            <button
              onClick={() => navigate('/services')}
              className="btn-primary"
            >
              {t('order.browseServices')}
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
            {t('common.back')}
          </button>
          <h1 className="text-2xl font-display font-bold text-navy-900">{t('order.checkout')}</h1>
          <div className="w-20" />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[t('order.cart'), t('order.details'), t('order.schedule'), t('order.payment')].map((label, index) => (
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
                    <h2 className="text-xl font-semibold text-navy-900 mb-4">{t('order.orderType')}</h2>
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
                        <h3 className="font-semibold text-navy-900 mb-1">{t('order.pickup')}</h3>
                        <p className="text-sm text-gray-600">{t('order.pickupDesc')}</p>
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
                        <h3 className="font-semibold text-navy-900 mb-1">{t('order.dropOff')}</h3>
                        <p className="text-sm text-gray-600">{t('order.dropOffDesc')}</p>
                      </button>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-6 h-6" />
                      {t('order.yourItems')} ({items.length})
                    </h2>
                    
                    {items.length > 0 && (
                      <div className="divide-y divide-gray-100">
                        {items.map((item) => (
                          <div key={item.id} className={`py-4 ${item.isAddon ? 'bg-amber-50 -mx-6 px-6 border-l-4 border-amber-400' : ''}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-medium text-navy-900">{item.name}</h3>
                                  {item.isAddon && (
                                    <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      Add-on
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  ${(item.price || 0).toFixed(2)} {item.isAddon ? t('order.fee') : t('order.each')}
                                </p>
                                {item.turnaround && (
                                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {item.turnaround} {t('order.turnaroundTime')}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                {!item.isAddon && (
                                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      step="0.1"
                                      min="0"
                                      value={qtyDrafts[item.id] ?? item.quantity}
                                      onChange={(e) => setQtyDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      onBlur={() => commitItemQuantity(item.id, item.quantity)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                      className="w-12 text-center font-medium bg-transparent rounded outline-none focus:ring-2 focus:ring-amani-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                <span className="font-medium text-navy-900 min-w-[4rem] text-right">
                                  ${((item.price || 0) * item.quantity).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Laundry Weight - Regular */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-navy-900">{t('order.laundryRegular')}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {t('order.laundryRegularDesc')} — ${laundryRate}/{t('order.perLb')} ({t('order.minOrder')} {minimumLaundry} {t('order.lbs')} or ${flatRate.toFixed(2)} {t('order.flatRate')})
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            value={laundryWeight || ''}
                            onChange={(e) => setLaundryWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-20 input text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                            min="0"
                          />
                          <span className="text-gray-600 whitespace-nowrap">{t('order.lbs')}</span>
                        </div>
                      </div>
                      {laundryWeight > 0 && (
                        <div className="text-right text-sm text-gray-600">
                          {t('order.laundryRegular')}: <span className="font-medium text-navy-900">${laundryTotal.toFixed(2)}</span>
                          {laundryWeight < minimumLaundry && (
                            <span className="text-orange-600 ml-2">({t('order.flatRate')})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Laundry Weight - Commercial */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-navy-900">{t('order.laundryCommercial')}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {t('order.laundryCommercialDesc')} — ${laundryRate}/{t('order.perLb')} ({t('order.minOrder')} {minimumLaundry} {t('order.lbs')} or ${flatRate.toFixed(2)} {t('order.flatRate')})
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            value={commercialLaundryWeight || ''}
                            onChange={(e) => setCommercialLaundryWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-20 input text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                            min="0"
                          />
                          <span className="text-gray-600 whitespace-nowrap">{t('order.lbs')}</span>
                        </div>
                      </div>
                      {commercialLaundryWeight > 0 && (
                        <div className="text-right text-sm text-gray-600">
                          {t('order.commercialLaundryTotal')}: <span className="font-medium text-navy-900">${commercialLaundryTotal.toFixed(2)}</span>
                          {commercialLaundryWeight < minimumLaundry && (
                            <span className="text-orange-600 ml-2">({t('order.flatRate')})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add-ons Section */}
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-amani-500" />
                      {t('order.addons')}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">{t('order.addonsDesc')}</p>

                    <div className="space-y-4">
                      {/* Low Heat Dry */}
                      <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddons.lowHeatDry ? 'border-amani-500 bg-amani-50' : 'border-gray-200 hover:border-amani-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedAddons.lowHeatDry}
                          onChange={(e) => setSelectedAddons(prev => ({ ...prev, lowHeatDry: e.target.checked }))}
                          className="w-5 h-5 text-amani-500 rounded mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-navy-900">{t('order.lowHeatDry')}</h3>
                            <span className="font-semibold text-amani-600">+$5.00</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{t('order.lowHeatDryDesc')}</p>
                        </div>
                      </label>

                      {/* Hypoallergenic Wash */}
                      <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddons.hypoallergenic ? 'border-amani-500 bg-amani-50' : 'border-gray-200 hover:border-amani-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedAddons.hypoallergenic}
                          onChange={(e) => setSelectedAddons(prev => ({ ...prev, hypoallergenic: e.target.checked }))}
                          className="w-5 h-5 text-amani-500 rounded mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-navy-900">{t('order.hypoallergenic')}</h3>
                            <span className="font-semibold text-amani-600">+$5.00</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{t('order.hypoallergenicDesc')}</p>
                        </div>
                      </label>

                      {/* Laundry Sorting */}
                      <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddons.laundrySorting ? 'border-amani-500 bg-amani-50' : 'border-gray-200 hover:border-amani-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedAddons.laundrySorting}
                          onChange={(e) => setSelectedAddons(prev => ({ ...prev, laundrySorting: e.target.checked }))}
                          className="w-5 h-5 text-amani-500 rounded mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-navy-900">{t('order.laundrySorting')}</h3>
                            <span className="font-semibold text-amani-600">+$15.00</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{t('order.laundrySortingDesc')}</p>
                        </div>
                      </label>

                      {/* Same Day Rush */}
                      <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddons.sameDayRush ? 'border-amani-500 bg-amani-50' : 'border-gray-200 hover:border-amani-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedAddons.sameDayRush}
                          onChange={(e) => setSelectedAddons(prev => ({ ...prev, sameDayRush: e.target.checked }))}
                          className="w-5 h-5 text-amani-500 rounded mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-navy-900 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-500" />
                              {t('order.sameDayRush')}
                            </h3>
                            <span className="font-semibold text-amani-600">+$25.00</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{t('order.sameDayRushDesc')}</p>
                        </div>
                      </label>

                      {/* Starch - Per Item Add-on */}
                      <div className="pt-4 border-t border-gray-100">
                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddons.starch && starchQuantity > 0 ? 'border-amani-500 bg-amani-50' : 'border-gray-200 hover:border-amani-200'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedAddons.starch && starchQuantity > 0}
                            onChange={(e) => {
                              setSelectedAddons(prev => ({ ...prev, starch: e.target.checked }));
                              if (!e.target.checked) setStarchQuantity(0);
                              else if (starchQuantity === 0) setStarchQuantity(1);
                            }}
                            className="w-5 h-5 text-amani-500 rounded mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-navy-900">👔 Starch</h3>
                              <span className="font-semibold text-amani-600">$0.50/item</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">Professional starch for crisp, fresh clothes</p>
                            {selectedAddons.starch && (
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Number of items:</span>
                                <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-amani-200 p-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setStarchQuantity(Math.max(0, starchQuantity - 1));
                                      if (starchQuantity <= 1) setSelectedAddons(prev => ({ ...prev, starch: false }));
                                    }}
                                    className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="1"
                                    min="0"
                                    value={starchQuantity || ''}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                                      setStarchQuantity(val);
                                      setSelectedAddons(prev => ({ ...prev, starch: val > 0 }));
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                    className="w-12 text-center font-medium bg-transparent rounded outline-none focus:ring-2 focus:ring-amani-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setStarchQuantity(starchQuantity + 1);
                                    }}
                                    className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                <span className="text-sm font-semibold text-amani-600">
                                  = ${(starchQuantity * 0.50).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>

                      {/* Additional Small Add-ons Row */}
                      <div className="grid sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                        {/* Fabric Softener */}
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddons.fabricSoftener ? 'border-amani-500 bg-amani-50' : 'border-gray-200 hover:border-amani-200'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedAddons.fabricSoftener}
                            onChange={(e) => setSelectedAddons(prev => ({ ...prev, fabricSoftener: e.target.checked }))}
                            className="w-4 h-4 text-amani-500 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-navy-900 text-sm">{t('order.fabricSoftener')}</h3>
                              <span className="font-semibold text-amani-600 text-sm">+$1.00</span>
                            </div>
                          </div>
                        </label>

                        {/* Stain Removal */}
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddons.stainRemoval ? 'border-amani-500 bg-amani-50' : 'border-gray-200 hover:border-amani-200'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedAddons.stainRemoval}
                            onChange={(e) => setSelectedAddons(prev => ({ ...prev, stainRemoval: e.target.checked }))}
                            className="w-4 h-4 text-amani-500 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-navy-900 text-sm">{t('order.stainRemoval')}</h3>
                              <span className="font-semibold text-amani-600 text-sm">+$3.00</span>
                            </div>
                          </div>
                        </label>

                        {/* Scent Booster */}
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddons.scentBooster ? 'border-amani-500 bg-amani-50' : 'border-gray-200 hover:border-amani-200'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedAddons.scentBooster}
                            onChange={(e) => setSelectedAddons(prev => ({ ...prev, scentBooster: e.target.checked }))}
                            className="w-4 h-4 text-amani-500 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-navy-900 text-sm">{t('order.scentBooster')}</h3>
                              <span className="font-semibold text-amani-600 text-sm">+$1.00</span>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Add-ons Total */}
                      {addonsTotal > 0 && (
                        <div className="bg-amani-50 rounded-xl p-4 mt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-navy-900">{t('order.addonsTotal')}</span>
                            <span className="font-bold text-amani-600 text-lg">+${addonsTotal.toFixed(2)}</span>
                          </div>
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
                      {t('order.contactInfo')}
                    </h2>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">{t('order.firstName')} *</label>
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
                        <label className="block text-sm font-medium text-navy-700 mb-1">{t('order.lastName')} *</label>
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
                        <label className="block text-sm font-medium text-navy-700 mb-1">{t('order.email')} *</label>
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
                        <label className="block text-sm font-medium text-navy-700 mb-1">{t('order.phone')} *</label>
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
                        {t('order.pickupAddress')}
                      </h2>

                      {/* Saved Addresses - Only show for authenticated users with saved addresses */}
                      {isAuthenticated && savedAddresses.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-navy-700">{t('order.savedAddress')}</label>
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
                                        <span className="font-medium text-navy-900">{address.label || t('order.address')}</span>
                                        {address.is_default && (
                                          <span className="text-xs bg-amani-100 text-amani-700 px-2 py-0.5 rounded-full">
                                            {t('order.default')}
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
                            <span className="text-sm text-gray-500">{t('order.orEnterManually')}</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>
                        </div>
                      )}

                      {/* Manual Address Entry - Always show */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-1">
                            {t('order.streetAddress')} {!isAuthenticated || savedAddresses.length === 0 ? '*' : ''}
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
                            <label className="block text-sm font-medium text-navy-700 mb-1">{t('order.unit')}</label>
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
                              {t('order.city')} {!isAuthenticated || savedAddresses.length === 0 ? '*' : ''}
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
                              {t('order.postalCode')} {!isAuthenticated || savedAddresses.length === 0 ? '*' : ''}
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
                            <label className="block text-sm font-medium text-navy-700 mb-1">{t('order.deliveryInstructions')}</label>
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
                                <span className="text-navy-900">{t('order.saveAddress')}</span>
                              </label>

                              {saveNewAddress && (
                                <div className="mt-3 ml-8">
                                  <label className="block text-sm text-gray-600 mb-1">{t('order.addressLabel')}</label>
                                  <select
                                    value={newAddressLabel}
                                    onChange={(e) => setNewAddressLabel(e.target.value)}
                                    className="input w-auto"
                                  >
                                    <option value="Home">{t('order.home')}</option>
                                    <option value="Work">{t('order.work')}</option>
                                    <option value="Other">{t('order.other')}</option>
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
                      <h3 className="font-semibold text-blue-900 mb-4">{t('order.ourLocations')}</h3>
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4">
                          <h4 className="font-semibold text-navy-900">{t('order.locationToronto')}</h4>
                          <p className="text-gray-600">325 Weston Road, Unit 5D, M6N 3P1</p>
                          <p className="text-sm text-gray-500 mt-1">437-215-6321</p>
                        </div>
                        <div className="bg-white rounded-xl p-4">
                          <h4 className="font-semibold text-navy-900">{t('order.locationNorthYork')}</h4>
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
                      {orderType === 'pickup' ? t('order.schedulePickup') : t('order.orderNotes')}
                    </h2>

                    {orderType === 'pickup' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-3">{t('order.pickupDate')} *</label>
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
                                {date.isToday && <p className="text-xs text-amani-600">{t('order.today')}</p>}
                              </button>
                            ))}
                          </div>
                          {errors.pickupDate && <p className="text-red-500 text-sm mt-2">{errors.pickupDate}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-3">{t('order.pickupTime')} *</label>
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
                      <label className="block text-sm font-medium text-navy-700 mb-2">{t('order.specialInstructions')}</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="input"
                        rows={3}
                        placeholder={t('order.specialInstructionsPlaceholder')}
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-navy-700 mb-2">{t('order.referenceNotes')}</label>
                      <input
                        type="text"
                        value={formData.referenceNotes}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceNotes: e.target.value }))}
                        className="input"
                        placeholder={t('order.referenceNotesPlaceholder')}
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
                    <h2 className="text-xl font-semibold text-navy-900 mb-6">{t('order.paymentMethod')}</h2>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { value: 'cash', label: t('order.cashOnDelivery'), icon: '💵', description: 'Pay when we deliver' },
                        { value: 'card', label: t('order.cardOnDelivery'), icon: '💳', description: 'Card payment on delivery' },
                        { value: 'interac', label: 'Interac e-Transfer', icon: '📧', description: 'Send e-transfer to complete order' },
                        { value: 'payment_link', label: 'Pay Now (Card)', icon: '🔗', description: 'Pay instantly with card via Stripe' },
                      ].map((method) => (
                        <button
                          key={method.value}
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            formData.paymentMethod === method.value
                              ? 'border-amani-500 bg-amani-50'
                              : 'border-gray-200 hover:border-amani-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{method.icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-navy-900 block text-sm">{method.label}</span>
                              <span className="text-xs text-gray-600">{method.description}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Interac Instructions */}
                    {formData.paymentMethod === 'interac' && (
                      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                          <Mail className="w-6 h-6 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 mb-2">Send Interac e-Transfer to:</h3>
                            <div className="bg-white rounded-lg p-4 mb-3">
                              <p className="text-lg font-mono font-semibold text-navy-900 break-all">
                                amaniscleaners@gmail.com
                              </p>
                            </div>
                            <div className="space-y-2 text-sm text-blue-800">
                              <p className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Amount: <strong>${total.toFixed(2)} CAD</strong></span>
                              </p>
                              <p className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Include your name and phone number in the message</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>No security question needed (auto-deposit enabled)</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Link Instructions */}
                    {formData.paymentMethod === 'payment_link' && (
                      <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                          <Receipt className="w-6 h-6 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-green-900 mb-2">Secure Payment Link</h3>
                            <div className="space-y-2 text-sm text-green-800">
                              <p className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>You'll be redirected to secure Stripe payment page</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Pay with any credit or debit card</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Complete payment to confirm your order</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Important Note about Cash/Card on Delivery */}
                    <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-amber-900 text-sm mb-1">Important Note</p>
                          <p className="text-sm text-amber-800">
                            Cash and Card payment options are only accepted <strong>in-store</strong> at our locations, not on delivery.
                            For delivery orders, please use Interac e-Transfer or Pay Now (Card) online.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
                      <Tag className="w-6 h-6" />
                      {t('order.promoCode')}
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
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value.toUpperCase());
                              setPromoError('');
                            }}
                            className="input flex-1"
                            placeholder={t('order.enterPromoCode')}
                          />
                          <button
                            onClick={handleApplyPromo}
                            className="btn-primary px-6 whitespace-nowrap"
                          >
                            {t('order.apply')}
                          </button>
                        </div>
                        {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
                        {!user?.first_order_discount_used && (
                          <p className="text-sm text-gray-500 mt-2">
                            💡 {t('order.firstTimePromoHint')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Review */}
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-navy-900 mb-4">{t('order.orderReview')}</h2>

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
                            <p className="font-medium text-navy-900">{t('order.pickupAddress')}</p>
                            <p className="text-sm text-gray-600">{getAddressString()}</p>
                          </div>
                        </div>
                      )}

                      {formData.pickupDate && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-navy-900">{t('order.scheduledPickup')}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(formData.pickupDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                              {' • '}
                              {formData.pickupTime === 'morning' ? t('order.morningTime') : t('order.eveningTime')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {errors.submit && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                        {errors.submit}
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={loading || subtotal < minimumOrderAmount}
                      className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t('common.processing') || 'Processing...'}
                        </span>
                      ) : (
                        `${t('order.placeOrder')} • $${total.toFixed(2)}`
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
                  {t('common.back')}
                </button>
              ) : (
                <div />
              )}
              {step < 4 && (
                <button onClick={nextStep} className="btn-primary">
                  {t('common.continue')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-navy-900 mb-4">{t('order.orderSummary')}</h2>

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className={`flex justify-between gap-2 text-sm ${item.isAddon ? 'bg-amber-50 -mx-2 px-2 py-1 rounded border-l-2 border-amber-400' : ''}`}>
                    <span className={`flex-1 min-w-0 ${item.isAddon ? 'text-amber-800 flex items-center gap-1' : 'text-gray-600'}`}>
                      {item.isAddon && <Zap className="w-3 h-3 flex-shrink-0" />}
                      <span className="truncate">{item.name} {!item.isAddon && `× ${item.quantity}`}</span>
                    </span>
                    <span className={`font-medium flex-shrink-0 ${item.isAddon ? 'text-amber-700' : ''}`}>${((item.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {laundryWeight > 0 && (
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="text-gray-600 flex-1 min-w-0 truncate">{t('order.laundryRegular')} ({laundryWeight} {t('order.lbs')})</span>
                    <span className="font-medium flex-shrink-0">${laundryTotal.toFixed(2)}</span>
                  </div>
                )}
                {commercialLaundryWeight > 0 && (
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="text-gray-600 flex-1 min-w-0 truncate">{t('order.laundryCommercial')} ({commercialLaundryWeight} {t('order.lbs')})</span>
                    <span className="font-medium flex-shrink-0">${commercialLaundryTotal.toFixed(2)}</span>
                  </div>
                )}
                {/* Add-ons */}
                {addonsTotal > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('order.addons')}</p>
                    {selectedAddons.lowHeatDry && (
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-gray-600 flex-1 min-w-0 truncate">{t('order.lowHeatDry')}</span>
                        <span className="font-medium flex-shrink-0">$5.00</span>
                      </div>
                    )}
                    {selectedAddons.hypoallergenic && (
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-gray-600 flex-1 min-w-0 truncate">{t('order.hypoallergenic')}</span>
                        <span className="font-medium flex-shrink-0">$5.00</span>
                      </div>
                    )}
                    {selectedAddons.laundrySorting && (
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-gray-600 flex-1 min-w-0 truncate">{t('order.laundrySorting')}</span>
                        <span className="font-medium flex-shrink-0">$15.00</span>
                      </div>
                    )}
                    {selectedAddons.sameDayRush && (
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-gray-600 flex items-center gap-1 flex-1 min-w-0">
                          <Zap className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                          <span className="truncate">{t('order.sameDayRush')}</span>
                        </span>
                        <span className="font-medium flex-shrink-0">$25.00</span>
                      </div>
                    )}
                    {selectedAddons.fabricSoftener && (
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-gray-600 flex-1 min-w-0 truncate">{t('order.fabricSoftener')}</span>
                        <span className="font-medium flex-shrink-0">$1.00</span>
                      </div>
                    )}
                    {selectedAddons.stainRemoval && (
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-gray-600 flex-1 min-w-0 truncate">{t('order.stainRemoval')}</span>
                        <span className="font-medium flex-shrink-0">$3.00</span>
                      </div>
                    )}
                    {selectedAddons.scentBooster && (
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-gray-600 flex-1 min-w-0 truncate">{t('order.scentBooster')}</span>
                        <span className="font-medium flex-shrink-0">$1.00</span>
                      </div>
                    )}
                    {selectedAddons.starch && starchQuantity > 0 && (
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-gray-600 flex-1 min-w-0 truncate">👔 Starch (×{starchQuantity})</span>
                        <span className="font-medium flex-shrink-0">${(starchQuantity * 0.50).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('order.subtotal')}</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('order.discount')} ({appliedPromo?.code})</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('order.tax')}</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                  <span>{t('order.total')}</span>
                  <span className="text-amani-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>{t('order.freePickupDelivery')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>{t('order.turnaround')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>{t('order.satisfaction')}</span>
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