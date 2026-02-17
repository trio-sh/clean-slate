import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Package, CreditCard,
  Bell, Shield, LogOut, Edit2, Check, X, Plus, Trash2,
  ChevronRight, Star, Eye, EyeOff, Copy, Gift, RefreshCw,
  Home, Building, Lock, Award, Heart, Share2
} from 'lucide-react';
import { useAuthStore, useCartStore } from '../../stores';
import db from '../../lib/db';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, updatePassword } = useAuthStore();
  const { addItem, clearCart } = useCartStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [editing, setEditing] = useState(false);
  
  // Address modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    street: '',
    unit: '',
    city: '',
    province: 'ON',
    postal_code: '',
    is_default: false,
    delivery_instructions: '',
  });
  
  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // Profile form
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  
  // Notification preferences (stored in localStorage)
  const [notificationPrefs, setNotificationPrefs] = useState({
    orderUpdates: true,
    promotions: true,
    reminders: true,
    sms: true,
    email: true,
  });

  // Load notification preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('amani_notification_prefs');
    if (savedPrefs) {
      setNotificationPrefs(JSON.parse(savedPrefs));
    }
  }, []);

  // Save notification preferences
  const handleNotificationChange = (key, value) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    localStorage.setItem('amani_notification_prefs', JSON.stringify(newPrefs));
    toast.success('Preferences saved');
  };

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      const allOrders = await db.getAll('orders');
      const userOrders = allOrders.filter(o => o.customer_id === user.id || o.user_id === user.id);
      setOrders(userOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  }, [user]);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    try {
      const userAddresses = await db.getByField('addresses', 'user_id', user.id);
      setAddresses(userAddresses || []);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  }, [user]);

  const loadSubscriptions = useCallback(async () => {
    if (!user) return;
    try {
      const userSubscriptions = await db.getByField('customer_subscriptions', 'user_id', user.id);
      const allPlans = await db.getAll('subscription_plans');
      
      // Enrich subscriptions with plan details
      const enrichedSubscriptions = (userSubscriptions || []).map(sub => {
        const plan = allPlans.find(p => p.id === sub.plan_id);
        return {
          ...sub,
          plan_name: plan?.name || 'Unknown Plan',
          plan_price: plan?.price || 0,
          plan_pounds: plan?.pounds_included || 0
        };
      });
      
      setSubscriptions(enrichedSubscriptions);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadOrders();
      loadAddresses();
      loadSubscriptions();
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      });
    }
  }, [user, loadOrders, loadAddresses, loadSubscriptions]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  // Password change handler
  const handleChangePassword = async () => {
    setPasswordError('');
    
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    try {
      const result = await updatePassword(passwordForm.newPassword);
      if (result.success) {
        toast.success('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordError(result.error || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Address handlers
  const openAddressModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        label: address.label || 'Home',
        street: address.street || '',
        unit: address.unit || '',
        city: address.city || '',
        province: address.province || 'ON',
        postal_code: address.postal_code || '',
        is_default: address.is_default || false,
        delivery_instructions: address.delivery_instructions || '',
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        label: 'Home',
        street: '',
        unit: '',
        city: '',
        province: 'ON',
        postal_code: '',
        is_default: addresses.length === 0,
        delivery_instructions: '',
      });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.street || !addressForm.city || !addressForm.postal_code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // If setting as default, unset other defaults first
      if (addressForm.is_default) {
        for (const addr of addresses) {
          if (addr.is_default && addr.id !== editingAddress?.id) {
            await db.update('addresses', addr.id, { is_default: false });
          }
        }
      }

      if (editingAddress) {
        await db.update('addresses', editingAddress.id, {
          ...addressForm,
          user_id: user.id,
        });
        toast.success('Address updated!');
      } else {
        await db.create('addresses', {
          ...addressForm,
          user_id: user.id,
        });
        toast.success('Address added!');
      }
      setShowAddressModal(false);
      loadAddresses();
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      // Unset all other defaults
      for (const addr of addresses) {
        if (addr.is_default) {
          await db.update('addresses', addr.id, { is_default: false });
        }
      }
      // Set new default
      await db.update('addresses', addressId, { is_default: true });
      toast.success('Default address updated!');
      loadAddresses();
    } catch {
      toast.error('Failed to update default address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await db.delete('addresses', addressId);
      toast.success('Address deleted!');
      loadAddresses();
    } catch {
      toast.error('Failed to delete address');
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    setDeletingAccount(true);
    try {
      // Delete user's data
      // 1. Delete addresses
      const userAddresses = await db.getByField('addresses', 'user_id', user.id);
      for (const addr of userAddresses || []) {
        await db.delete('addresses', addr.id);
      }
      
      // 2. Anonymize orders (keep for records but remove PII)
      const userOrders = await db.getByField('orders', 'customer_id', user.id);
      for (const order of userOrders || []) {
        await db.update('orders', order.id, {
          customer_id: null,
          customer_name: 'Deleted User',
          customer_email: null,
          customer_phone: null,
          is_guest_order: true,
        });
      }
      
      // 3. Delete check-ins
      const userCheckins = await db.getByField('checkins', 'user_id', user.id);
      for (const checkin of userCheckins || []) {
        await db.delete('checkins', checkin.id);
      }
      
      // 4. Delete the user account
      await db.delete('users', user.id);
      
      // 5. Logout and redirect
      toast.success('Your account has been deleted. We\'re sorry to see you go!');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account. Please try again or contact support.');
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  // Reorder handler
  const handleReorder = async (order) => {
    if (!order.items || order.items.length === 0) {
      toast.error('No items to reorder');
      return;
    }
    
    clearCart();
    
    for (const item of order.items) {
      if (item.service_id !== 'laundry') {
        addItem({
          id: item.service_id,
          name: item.name || item.service_name,
          price: item.unit_price,
          quantity: item.quantity,
        });
      }
    }
    
    toast.success('Items added to cart!');
    navigate('/order');
  };

  // Copy referral code
  const copyReferralCode = () => {
    const code = user?.referral_code || `AMANI${user?.id?.slice(-6).toUpperCase()}`;
    navigator.clipboard.writeText(code);
    toast.success('Referral code copied!');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'preferences', label: 'Settings', icon: Bell },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending_pickup: 'bg-yellow-100 text-yellow-700',
      picked_up: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      ready: 'bg-green-100 text-green-700',
      out_for_delivery: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
  };

  // Calculate loyalty points (simple: $1 = 1 point)
  const totalSpent = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0);
  const loyaltyPoints = Math.floor(totalSpent);
  const loyaltyTier = loyaltyPoints >= 500 ? 'Gold' : loyaltyPoints >= 200 ? 'Silver' : 'Bronze';

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy-900 mb-2">Please sign in</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your account.</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-3xl p-6 md:p-8 mb-8 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-amani-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-display font-bold text-amani-400">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold mb-1">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-gray-400">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1 text-amani-400">
                  <Star className="w-4 h-4" />
                  {orders.length} orders
                </span>
                <span className="flex items-center gap-1 text-yellow-400">
                  <Award className="w-4 h-4" />
                  {loyaltyTier} Member
                </span>
                <span className="text-gray-500">
                  Member since {user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : 'recently'}
                </span>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-amani-50 text-amani-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                    {tab.id === 'orders' && orders.length > 0 && (
                      <span className="ml-auto text-xs bg-amani-100 text-amani-700 px-2 py-0.5 rounded-full">
                        {orders.length}
                      </span>
                    )}
                    {tab.id === 'subscriptions' && subscriptions.length > 0 && (
                      <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {subscriptions.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 min-w-0"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-bold text-navy-900">Personal Information</h2>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-amani-600 hover:text-amani-700"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amani-500 text-white rounded-lg text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            first_name: user?.first_name || '',
                            last_name: user?.last_name || '',
                            phone: user?.phone || '',
                          });
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">First Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className="input"
                        />
                      ) : (
                        <p className="text-navy-900 font-medium">{user?.first_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Last Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className="input"
                        />
                      ) : (
                        <p className="text-navy-900 font-medium">{user?.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <p className="text-navy-900">{user?.email}</p>
                      {user?.is_verified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <p className="text-navy-900">{user?.phone || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-display font-bold text-navy-900 mb-6">Order History</h2>
                
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                    <button 
                      onClick={() => navigate('/services')}
                      className="inline-flex items-center gap-2 text-amani-600 hover:text-amani-700 mt-2"
                    >
                      Place your first order
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 border border-gray-100 rounded-xl hover:border-amani-200 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-bold text-navy-900">#{order.reference_code}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                {formatStatus(order.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {order.items?.length || 0} items • ${(order.total || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {order.created_at && format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReorder(order)}
                              className="flex items-center gap-1 px-3 py-2 text-sm text-amani-600 hover:bg-amani-50 rounded-lg transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Reorder
                            </button>
                            <button
                              onClick={() => navigate(`/track/${order.reference_code}`)}
                              className="flex items-center gap-1 px-3 py-2 text-sm bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors"
                            >
                              Track
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-bold text-navy-900">My Subscriptions</h2>
                  <button
                    onClick={() => navigate('/subscriptions')}
                    className="btn-primary text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Subscription
                  </button>
                </div>
                
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions yet</h3>
                    <p className="text-gray-500 mb-6">Save money with our subscription plans</p>
                    <button 
                      onClick={() => navigate('/subscriptions')}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4" />
                      Explore Plans
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((subscription) => {
                      const isActive = subscription.status === 'active';
                      const isPending = subscription.status === 'pending_payment';
                      const isExpired = new Date(subscription.end_date) < new Date();
                      
                      return (
                        <div
                          key={subscription.id}
                          className={`p-5 border rounded-xl transition-all ${
                            isActive 
                              ? 'border-purple-200 bg-purple-50/30' 
                              : isPending
                              ? 'border-yellow-200 bg-yellow-50/30'
                              : 'border-gray-100'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-navy-900">{subscription.plan_name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  isActive 
                                    ? 'bg-purple-100 text-purple-700'
                                    : isPending
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {isPending ? 'Pending Payment' : 
                                   isActive ? 'Active' : 
                                   isExpired ? 'Expired' : 
                                   subscription.status.replace('_', ' ')}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div>
                                  <p className="font-medium text-navy-900">${subscription.plan_price}/month</p>
                                  <p className="text-xs">Price</p>
                                </div>
                                <div>
                                  <p className="font-medium text-navy-900">{subscription.plan_pounds} lbs</p>
                                  <p className="text-xs">Included</p>
                                </div>
                                <div>
                                  <p className="font-medium text-navy-900">
                                    {subscription.pounds_remaining || 0} lbs
                                  </p>
                                  <p className="text-xs">Remaining</p>
                                </div>
                                <div>
                                  <p className="font-medium text-navy-900">
                                    {format(new Date(subscription.end_date), 'MMM d, yyyy')}
                                  </p>
                                  <p className="text-xs">Expires</p>
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                  Started: {format(new Date(subscription.start_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2">
                              {isPending && (
                                <button
                                  onClick={() => navigate('/subscriptions')}
                                  className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors"
                                >
                                  Pay Now
                                </button>
                              )}
                              {isActive && (
                                <button
                                  onClick={() => navigate('/subscriptions')}
                                  className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
                                >
                                  Manage
                                </button>
                              )}
                              <button
                                onClick={() => navigate(`/track?subscription=${subscription.id}`)}
                                className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-bold text-navy-900">Saved Addresses</h2>
                  <button
                    onClick={() => openAddressModal()}
                    className="btn-primary text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No addresses saved</p>
                    <p className="text-sm text-gray-400 mt-1">Add an address for faster checkout</p>
                    <button 
                      onClick={() => openAddressModal()}
                      className="btn-primary mt-4"
                    >
                      <Plus className="w-4 h-4" />
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className={`p-4 border rounded-xl transition-colors ${
                        address.is_default ? 'border-amani-300 bg-amani-50/50' : 'border-gray-100 hover:border-amani-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {address.label === 'Home' ? (
                              <Home className="w-5 h-5 text-amani-500 mt-0.5" />
                            ) : address.label === 'Work' ? (
                              <Building className="w-5 h-5 text-amani-500 mt-0.5" />
                            ) : (
                              <MapPin className="w-5 h-5 text-amani-500 mt-0.5" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-navy-900">{address.label || 'Address'}</p>
                                {address.is_default && (
                                  <span className="text-xs bg-amani-100 text-amani-700 px-2 py-0.5 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm">{address.street}{address.unit ? `, ${address.unit}` : ''}</p>
                              <p className="text-gray-600 text-sm">
                                {address.city}, {address.province} {address.postal_code}
                              </p>
                              {address.delivery_instructions && (
                                <p className="text-gray-500 text-xs mt-1 italic">
                                  📝 {address.delivery_instructions}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!address.is_default && (
                              <button 
                                onClick={() => handleSetDefaultAddress(address.id)}
                                className="p-2 hover:bg-amani-100 rounded-lg text-gray-500 hover:text-amani-600"
                                title="Set as default"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => openAddressModal(address)}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAddress(address.id)}
                              className="p-2 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className="space-y-6">
                {/* Points Summary */}
                <div className="bg-gradient-to-br from-amani-500 to-maple-500 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-display font-bold">Loyalty Points</h2>
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      <Award className="w-4 h-4" />
                      <span className="font-medium">{loyaltyTier}</span>
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-2">{loyaltyPoints.toLocaleString()}</div>
                  <p className="text-white/80">Points earned from ${totalSpent.toFixed(2)} spent</p>
                  
                  <div className="mt-4 bg-white/10 rounded-xl p-4">
                    <p className="text-sm text-white/80 mb-2">
                      {loyaltyTier === 'Bronze' && `Earn ${200 - loyaltyPoints} more points to reach Silver!`}
                      {loyaltyTier === 'Silver' && `Earn ${500 - loyaltyPoints} more points to reach Gold!`}
                      {loyaltyTier === 'Gold' && '🎉 You have reached the highest tier!'}
                    </p>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all"
                        style={{ 
                          width: `${Math.min(100, (loyaltyPoints / (loyaltyTier === 'Bronze' ? 200 : 500)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Referral Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-900">Refer a Friend</h3>
                      <p className="text-sm text-gray-500">Give $10, Get $10</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    Share your referral code with friends. When they place their first order, you both get $10 off!
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 font-mono font-bold text-navy-900">
                      {user?.referral_code || `AMANI${user?.id?.slice(-6).toUpperCase() || 'NEW'}`}
                    </div>
                    <button
                      onClick={copyReferralCode}
                      className="btn-primary"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>

                {/* Tier Benefits */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-navy-900 mb-4">Tier Benefits</h3>
                  <div className="space-y-3">
                    {[
                      { tier: 'Bronze', points: '0-199', benefits: ['1 point per $1 spent', 'Birthday bonus'] },
                      { tier: 'Silver', points: '200-499', benefits: ['1.5x points', 'Priority pickup', '5% off orders'] },
                      { tier: 'Gold', points: '500+', benefits: ['2x points', 'VIP support', '10% off orders', 'Free express'] },
                    ].map((t) => (
                      <div 
                        key={t.tier} 
                        className={`p-4 rounded-xl ${loyaltyTier === t.tier ? 'bg-amani-50 border-2 border-amani-200' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-navy-900">{t.tier}</span>
                          <span className="text-sm text-gray-500">{t.points} points</span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {t.benefits.map((b, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-display font-bold text-navy-900 mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'orderUpdates', label: 'Order updates', description: 'Get notified about order status changes' },
                      { key: 'promotions', label: 'Promotions', description: 'Receive special offers and discounts' },
                      { key: 'reminders', label: 'Reminders', description: 'Get reminded about scheduled pickups' },
                    ].map((pref) => (
                      <div key={pref.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-navy-900">{pref.label}</p>
                          <p className="text-sm text-gray-500">{pref.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notificationPrefs[pref.key]}
                            onChange={(e) => handleNotificationChange(pref.key, e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amani-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amani-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="font-medium text-navy-900 mb-4">Notification Channels</h3>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notificationPrefs.sms}
                          onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-amani-500 focus:ring-amani-500"
                        />
                        <span className="text-navy-900">SMS</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notificationPrefs.email}
                          onChange={(e) => handleNotificationChange('email', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-amani-500 focus:ring-amani-500"
                        />
                        <span className="text-navy-900">Email</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-display font-bold text-navy-900 mb-6">Security</h2>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-amani-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-navy-900">Change Password</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full flex items-center justify-between p-4 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        <span className="font-medium text-red-600">Delete Account</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold text-navy-900">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h2>
                  <button
                    onClick={() => setShowAddressModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="label">Label</label>
                  <select
                    value={addressForm.label}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                    className="input"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label">Street Address *</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                    className="input"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="label">Unit/Apt (Optional)</label>
                  <input
                    type="text"
                    value={addressForm.unit}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="input"
                    placeholder="Unit 5D"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">City *</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                      className="input"
                      placeholder="Toronto"
                    />
                  </div>
                  <div>
                    <label className="label">Province</label>
                    <select
                      value={addressForm.province}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, province: e.target.value }))}
                      className="input"
                    >
                      <option value="ON">Ontario</option>
                      <option value="BC">British Columbia</option>
                      <option value="AB">Alberta</option>
                      <option value="QC">Quebec</option>
                      <option value="MB">Manitoba</option>
                      <option value="SK">Saskatchewan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Postal Code *</label>
                  <input
                    type="text"
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value.toUpperCase() }))}
                    className="input"
                    placeholder="M6N 3P1"
                    maxLength={7}
                  />
                </div>

                <div>
                  <label className="label">Delivery Instructions (Optional)</label>
                  <textarea
                    value={addressForm.delivery_instructions}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, delivery_instructions: e.target.value }))}
                    className="input"
                    rows={2}
                    placeholder="e.g., Ring doorbell, leave at concierge..."
                  />
                </div>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-amani-500 focus:ring-amani-500"
                  />
                  <span className="text-navy-900">Set as default address</span>
                </label>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddress}
                  className="btn-primary flex-1"
                >
                  <Check className="w-4 h-4" />
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold text-navy-900">Change Password</h2>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="input pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="btn-primary flex-1"
                >
                  {changingPassword ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Changing...
                    </span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold text-red-600">Delete Account</h2>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">This action cannot be undone</h3>
                      <p className="text-sm text-red-700 mt-1">
                        Deleting your account will permanently remove:
                      </p>
                      <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                        <li>Your profile information</li>
                        <li>Saved addresses</li>
                        <li>Loyalty points and rewards</li>
                        <li>Order history (anonymized)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-bold text-red-600">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    className="input border-red-200 focus:border-red-500 focus:ring-red-500"
                    placeholder="Type DELETE"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingAccount ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete My Account
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountPage;
