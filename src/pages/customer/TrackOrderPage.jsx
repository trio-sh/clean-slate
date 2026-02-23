import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Package, Truck, CheckCircle, Clock,
  MapPin, Phone, RefreshCw, Calendar, ArrowRight,
  Shirt, Sparkles, AlertCircle, Bell, Send, X,
  CreditCard, CalendarDays, Scale
} from 'lucide-react';
import db from '../../lib/db';
import { formatAddress, notificationService } from '../../lib/utils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useLanguage } from '../../i18n/LanguageContext';

const TrackOrderPage = () => {
  const { t } = useLanguage();
  const { referenceCode: urlCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState(urlCode || '');
  const [order, setOrder] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: ''
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [viewMode, setViewMode] = useState('order'); // 'order' or 'subscription'

  // Check if we're viewing a subscription
  const subscriptionId = searchParams.get('subscription');

  const statusSteps = [
    { status: 'pending_pickup', label: t('track.statusSteps.pending_pickup.label'), icon: Package, description: t('track.statusSteps.pending_pickup.description') },
    { status: 'picked_up', label: t('track.statusSteps.picked_up.label'), icon: Truck, description: t('track.statusSteps.picked_up.description') },
    { status: 'processing', label: t('track.statusSteps.processing.label'), icon: Sparkles, description: t('track.statusSteps.processing.description') },
    { status: 'ready', label: t('track.statusSteps.ready.label'), icon: Shirt, description: t('track.statusSteps.ready.description') },
    { status: 'out_for_delivery', label: t('track.statusSteps.out_for_delivery.label'), icon: Truck, description: t('track.statusSteps.out_for_delivery.description') },
    { status: 'delivered', label: t('track.statusSteps.delivered.label'), icon: CheckCircle, description: t('track.statusSteps.delivered.description') },
  ];

  useEffect(() => {
    if (urlCode) {
      setViewMode('order');
      handleSearch();
    } else if (subscriptionId) {
      setViewMode('subscription');
      loadSubscription();
    }
  }, [urlCode, subscriptionId]);

  const loadSubscription = async () => {
    if (!subscriptionId) return;
    
    setLoading(true);
    setError('');
    setSubscription(null);
    
    try {
      // Load subscription details
      const sub = await db.getById('customer_subscriptions', subscriptionId);
      if (!sub) {
        setError(t('track.subscriptionNotFoundDesc'));
        return;
      }
      
      // Load plan details
      const plan = await db.getById('subscription_plans', sub.plan_id);
      if (plan) {
        sub.plan_details = plan;
      }
      
      // Load user details
      const user = await db.getById('users', sub.user_id);
      if (user) {
        sub.user_details = user;
      }
      
      setSubscription(sub);
    } catch (err) {
      setError(t('track.fetchSubscriptionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchCode.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const result = await db.getOrderByReference(searchCode.trim().toUpperCase());
      if (result) {
        setOrder(result);
        if (!urlCode) {
          navigate(`/track/${searchCode.trim().toUpperCase()}`);
        }
      } else {
        setError(t('track.orderNotFoundDesc'));
      }
    } catch (err) {
      setError(t('track.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status) => {
    return statusSteps.findIndex(s => s.status === status);
  };

  const currentIndex = order ? getStatusIndex(order.status) : -1;

  const handleNotificationChange = (field, value) => {
    setNotificationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      toast.error(t('track.notificationTitleRequired'));
      return;
    }

    setSendingNotification(true);
    try {
      // Create notification for internal teams
      const notification = {
        title: `Customer Alert - Order ${order.reference_code}`,
        message: `${notificationForm.message}\n\nOrder: ${order.reference_code}\nCustomer: ${order.customer_name || 'N/A'}\nContact: ${order.customer_phone || 'N/A'}`,
        type: 'alert',
        link: `/admin/orders?search=${order.reference_code}`
      };

      // Send to all drivers, staff, and admins
      const results = [];
      
      // Send to drivers
      const driverResults = await notificationService.broadcastToRole('driver', notification);
      results.push(...driverResults);
      
      // Send to staff
      const staffResults = await notificationService.broadcastToRole('staff', notification);
      results.push(...staffResults);
      
      // Send to admins
      const adminResults = await notificationService.broadcastToRole('admin', notification);
      results.push(...adminResults);

      toast.success(t('track.notificationSentSuccess').replace('{count}', results.length));

      // Reset form and close modal
      setNotificationForm({ title: '', message: '' });
      setShowNotificationModal(false);

    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error(t('track.notificationSentError'));
    } finally {
      setSendingNotification(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://api.a0.dev/assets/image?text=delivery driver scanning package, laundry pickup tracking real time, friendly driver at customer door, Toronto neighborhood sunny&aspect=16:9&seed=801"
            alt=""
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900/80 via-navy-800/80 to-navy-900/80" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amani-500/20 rounded-2xl mb-6">
              {viewMode === 'subscription' ? (
                <CreditCard className="w-8 h-8 text-amani-400" />
              ) : (
                <Package className="w-8 h-8 text-amani-400" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              {t('track.title')}
            </h1>
            <p className="text-gray-400 mb-8">
              {t('track.enterReference')}
            </p>

            {viewMode === 'order' && (
              <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  placeholder={t('track.placeholder')}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl pl-14 pr-4 py-4 text-white text-lg font-mono placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20 tracking-wider"
                  maxLength={7}
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <button
                  type="submit"
                  disabled={loading || !searchCode.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-amani-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-amani-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    t('track.track')
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4"
            >
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">
                  {viewMode === 'subscription' ? t('track.subscriptionNotFound') : t('track.orderNotFound')}
                </h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Order View */}
          {viewMode === 'order' && order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Order Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('track.referenceCode')}</p>
                    <p className="text-2xl font-mono font-bold text-navy-900 tracking-wider">
                      {order.reference_code}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl font-medium text-sm ${
                      order.status === 'delivered' 
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amani-100 text-amani-700'
                    }`}>
                      {statusSteps[currentIndex]?.label || order.status}
                    </div>
                    <button
                      onClick={() => setShowNotificationModal(true)}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('track.notifyTeam')}</span>
                      <span className="sm:hidden">{t('track.notify')}</span>
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('track.orderDate')}</p>
                    <p className="font-medium text-navy-900">
                      {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('track.orderType')}</p>
                    <p className="font-medium text-navy-900 capitalize">{order.order_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('track.total')}</p>
                    <p className="font-bold text-navy-900 text-lg">${order.total?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="font-display font-bold text-navy-900 mb-6">{t('track.orderProgress')}</h3>
                
                <div className="relative">
                  {statusSteps.slice(0, order.status === 'cancelled' ? currentIndex + 1 : undefined).map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    
                    return (
                      <div key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Line */}
                        {index < statusSteps.length - 1 && (
                          <div className={`absolute left-5 top-10 w-0.5 h-full -ml-px ${
                            isCompleted ? 'bg-amani-500' : 'bg-gray-200'
                          }`} />
                        )}
                        
                        {/* Icon */}
                        <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          isCurrent 
                            ? 'bg-amani-500 shadow-lg shadow-amani-500/30' 
                            : isCompleted 
                            ? 'bg-amani-500' 
                            : 'bg-gray-200'
                        }`}>
                          <Icon className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <p className={`font-medium ${isCompleted ? 'text-navy-900' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                          <p className={`text-sm ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                            {step.description}
                          </p>
                          {isCurrent && order.status_updated_at && (
                            <p className="text-xs text-amani-600 mt-1">
                              {t('track.updated')}: {format(new Date(order.status_updated_at), 'MMM d, h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Info */}
              {(order.delivery_address || order.pickup_address) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h3 className="font-display font-bold text-navy-900 mb-4">{t('track.deliveryAddress')}</h3>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amani-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-navy-900">{formatAddress(order.delivery_address) || formatAddress(order.pickup_address)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-display font-bold text-navy-900 mb-4">{t('track.orderItems')}</h3>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => {
                      const price = Number(item.unit_price) || Number(item.price) || 0;
                      const qty = Number(item.quantity) || 1;
                      return (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="font-medium text-navy-900">{item.service_name || item.name || t('track.serviceItem')}</p>
                            <p className="text-sm text-gray-500">{t('track.qty')}: {qty}</p>
                          </div>
                          <p className="font-medium text-navy-900">${(price * qty).toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact Support */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-3">{t('track.needHelp')}</p>
                <a
                  href="tel:437-215-6321"
                  className="inline-flex items-center gap-2 text-amani-600 font-medium hover:text-amani-700"
                >
                  <Phone className="w-4 h-4" />
                  {t('track.callPhone')}
                </a>
              </div>
            </motion.div>
          )}

          {/* Subscription View */}
          {viewMode === 'subscription' && subscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Subscription Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('track.subscriptionId')}</p>
                    <p className="text-2xl font-mono font-bold text-navy-900 tracking-wider">
                      {subscription.id?.slice(0, 8)}...
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl font-medium text-sm ${
                    subscription.status === 'active'
                      ? 'bg-purple-100 text-purple-700'
                      : subscription.status === 'pending_payment'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {subscription.status?.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('track.plan')}</p>
                    <p className="font-medium text-navy-900">
                      {subscription.plan_details?.name || t('track.unknownPlan')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('track.price')}</p>
                    <p className="font-bold text-navy-900 text-lg">
                      ${subscription.plan_details?.price || 0}{t('track.perMonth')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('track.poundsIncluded')}</p>
                    <p className="font-medium text-navy-900">
                      {subscription.plan_details?.pounds_included || 0} {t('track.lbs')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Period Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-amani-500" />
                    {t('track.subscriptionPeriod')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">{t('track.startDate')}</p>
                      <p className="font-medium text-navy-900">
                        {format(new Date(subscription.start_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('track.endDate')}</p>
                      <p className="font-medium text-navy-900">
                        {format(new Date(subscription.end_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('track.daysRemaining')}</p>
                      <p className="font-medium text-navy-900">
                        {Math.max(0, Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24)))} {t('track.days')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Usage Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amani-500" />
                    {t('track.usageDetails')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">{t('track.poundsRemaining')}</p>
                      <p className="font-medium text-navy-900">
                        {subscription.pounds_remaining || 0} {t('track.lbs')}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-amani-500 h-2 rounded-full"
                          style={{
                            width: `${((subscription.pounds_remaining || 0) / (subscription.plan_details?.pounds_included || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('track.autoRenew')}</p>
                      <p className="font-medium text-navy-900">
                        {subscription.auto_renew ? t('track.enabled') : t('track.disabled')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('track.created')}</p>
                      <p className="font-medium text-navy-900">
                        {format(new Date(subscription.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              {subscription.user_details && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h3 className="font-display font-bold text-navy-900 mb-4">{t('track.customerInformation')}</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">{t('track.name')}</p>
                      <p className="font-medium text-navy-900">
                        {subscription.user_details.first_name} {subscription.user_details.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('common.email')}</p>
                      <p className="font-medium text-navy-900">{subscription.user_details.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Support */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-3">{t('track.needHelpSubscription')}</p>
                <a
                  href="tel:437-215-6321"
                  className="inline-flex items-center gap-2 text-amani-600 font-medium hover:text-amani-700"
                >
                  <Phone className="w-4 h-4" />
                  {t('track.callPhone')}
                </a>
              </div>
            </motion.div>
          )}

          {!order && !subscription && !error && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                {viewMode === 'subscription' ? (
                  <CreditCard className="w-10 h-10 text-gray-400" />
                ) : (
                  <Package className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-display font-bold text-navy-900 mb-2">
                {viewMode === 'subscription' ? t('track.enterSubscriptionId') : t('track.enterReferenceCode')}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {viewMode === 'subscription'
                  ? t('track.subscriptionIdDescription')
                  : t('track.referenceCodeDescription')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowNotificationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-display font-bold text-navy-900 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-amber-500" />
                  {t('track.notifyDeliveryTeam')}
                </h3>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                {t('track.notifyDescription')}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('track.subject')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={notificationForm.title}
                    onChange={(e) => handleNotificationChange('title', e.target.value)}
                    placeholder={t('track.subjectPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-amani-500"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('track.message')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => handleNotificationChange('message', e.target.value)}
                    placeholder={t('track.messagePlaceholder')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-amani-500 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('track.charactersCount').replace('{count}', notificationForm.message.length)}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    <strong>{t('common.ok')}:</strong> {t('track.notifyNote')}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSendNotification}
                    disabled={sendingNotification || !notificationForm.title.trim() || !notificationForm.message.trim()}
                    className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {sendingNotification ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {t('track.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('track.sendNotification')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrackOrderPage;
