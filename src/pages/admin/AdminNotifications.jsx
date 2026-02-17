import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Send, Users, Truck, UserCheck, Shield, Search,
  Plus, X, CheckCircle, AlertTriangle, Clock, Megaphone,
  Filter, Trash2, Eye, RefreshCw, MessageSquare, Gift,
  Calendar, ChevronRight, User
} from 'lucide-react';
import db from '../../lib/db';
import { notificationService, notificationTemplates } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminNotifications() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('broadcast'); // broadcast, history, templates
  
  // Broadcast form
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'info',
    link: '',
    targetType: 'all', // all, role, specific
    targetRole: 'customer',
    targetUsers: [],
  });
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allNotifications] = await Promise.all([
        db.getAll('users'),
        db.getAll('notifications'),
      ]);
      
      setUsers(allUsers?.filter(u => u.is_active) || []);
      
      // Get recent notifications (last 100)
      const sorted = (allNotifications || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 100);
      setSentNotifications(sorted);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) {
      toast.error('Please enter title and message');
      return;
    }

    setSending(true);
    try {
      const notification = {
        title: broadcastForm.title,
        message: broadcastForm.message,
        type: broadcastForm.type,
        link: broadcastForm.link || null,
      };

      let result;
      let targetCount = 0;

      if (broadcastForm.targetType === 'all') {
        result = await notificationService.broadcastToAll(notification);
        targetCount = users.length;
      } else if (broadcastForm.targetType === 'role') {
        result = await notificationService.broadcastToRole(broadcastForm.targetRole, notification);
        targetCount = users.filter(u => u.role === broadcastForm.targetRole).length;
      } else if (broadcastForm.targetType === 'specific') {
        if (broadcastForm.targetUsers.length === 0) {
          toast.error('Please select at least one user');
          setSending(false);
          return;
        }
        result = await notificationService.sendToUsers(broadcastForm.targetUsers, notification);
        targetCount = broadcastForm.targetUsers.length;
      }

      toast.success(`Notification sent to ${targetCount} users!`);
      
      // Reset form
      setBroadcastForm({
        title: '',
        message: '',
        type: 'info',
        link: '',
        targetType: 'all',
        targetRole: 'customer',
        targetUsers: [],
      });
      
      // Reload sent notifications
      loadData();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleUseTemplate = (templateName, data = {}) => {
    const mockData = {
      order: { reference_code: 'EXAMPLE', items: [] },
      user: { first_name: 'Customer' },
      points: 100,
    };
    
    let template;
    switch (templateName) {
      case 'welcomeCustomer':
        template = notificationTemplates.welcomeCustomer(data.user || mockData.user);
        break;
      case 'loyaltyReward':
        template = notificationTemplates.loyaltyReward(data.points || mockData.points);
        break;
      case 'orderConfirmed':
        template = notificationTemplates.orderConfirmed(data.order || mockData.order);
        break;
      case 'orderReady':
        template = notificationTemplates.orderReady(data.order || mockData.order);
        break;
      case 'orderOutForDelivery':
        template = notificationTemplates.orderOutForDelivery(data.order || mockData.order);
        break;
      default:
        return;
    }
    
    setBroadcastForm(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      type: template.type,
      link: template.link || '',
    }));
    
    setActiveTab('broadcast');
    toast.success('Template loaded - customize as needed');
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!confirm('Delete this notification?')) return;
    
    try {
      await db.delete('notifications', notificationId);
      toast.success('Notification deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Delete all notifications older than 30 days?')) return;
    
    try {
      await notificationService.cleanup(30);
      toast.success('Old notifications cleaned up');
      loadData();
    } catch (error) {
      toast.error('Failed to cleanup notifications');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.includes(searchQuery)
    );
  });

  const getUserById = (id) => users.find(u => u.id === id);

  const notificationTypes = [
    { value: 'info', label: 'Info', icon: Bell, color: 'blue' },
    { value: 'order', label: 'Order', icon: CheckCircle, color: 'green' },
    { value: 'alert', label: 'Alert', icon: AlertTriangle, color: 'amber' },
    { value: 'promo', label: 'Promo', icon: Gift, color: 'purple' },
    { value: 'reminder', label: 'Reminder', icon: Clock, color: 'orange' },
  ];

  const getTypeColor = (type) => {
    const colors = {
      info: 'bg-blue-100 text-blue-700',
      order: 'bg-green-100 text-green-700',
      alert: 'bg-amber-100 text-amber-700',
      promo: 'bg-purple-100 text-purple-700',
      reminder: 'bg-orange-100 text-orange-700',
    };
    return colors[type] || colors.info;
  };

  const roleStats = {
    customer: users.filter(u => u.role === 'customer').length,
    driver: users.filter(u => u.role === 'driver').length,
    staff: users.filter(u => u.role === 'staff').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-amani-green" />
            Notifications Center
          </h1>
          <p className="text-gray-500 mt-1">Broadcast notifications to users</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleCleanup}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-600"
          >
            <Trash2 className="w-4 h-4" />
            Cleanup Old
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{roleStats.customer}</p>
              <p className="text-sm text-gray-500">Customers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{roleStats.driver}</p>
              <p className="text-sm text-gray-500">Drivers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{roleStats.staff}</p>
              <p className="text-sm text-gray-500">Staff</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{sentNotifications.length}</p>
              <p className="text-sm text-gray-500">Total Sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'broadcast'
                  ? 'border-amani-green text-amani-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              Broadcast
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'templates'
                  ? 'border-amani-green text-amani-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-amani-green text-amani-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Broadcast Tab */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Compose Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Compose Notification</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={broadcastForm.title}
                      onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                      placeholder="Notification title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea
                      value={broadcastForm.message}
                      onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                      placeholder="Notification message..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={broadcastForm.type}
                        onChange={(e) => setBroadcastForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                      >
                        {notificationTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link (optional)</label>
                      <input
                        type="text"
                        value={broadcastForm.link}
                        onChange={(e) => setBroadcastForm(prev => ({ ...prev, link: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                        placeholder="/order, /account..."
                      />
                    </div>
                  </div>
                </div>

                {/* Target Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Target Audience</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="targetType"
                        checked={broadcastForm.targetType === 'all'}
                        onChange={() => setBroadcastForm(prev => ({ ...prev, targetType: 'all', targetUsers: [] }))}
                        className="w-4 h-4 text-amani-green"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">All Users</span>
                        <p className="text-sm text-gray-500">{users.length} active users</p>
                      </div>
                      <Users className="w-5 h-5 text-gray-400" />
                    </label>

                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="targetType"
                        checked={broadcastForm.targetType === 'role'}
                        onChange={() => setBroadcastForm(prev => ({ ...prev, targetType: 'role', targetUsers: [] }))}
                        className="w-4 h-4 text-amani-green"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">By Role</span>
                        <p className="text-sm text-gray-500">Send to specific user role</p>
                      </div>
                      <Shield className="w-5 h-5 text-gray-400" />
                    </label>

                    {broadcastForm.targetType === 'role' && (
                      <div className="ml-7 grid grid-cols-2 gap-2">
                        {[
                          { role: 'customer', icon: Users, count: roleStats.customer },
                          { role: 'driver', icon: Truck, count: roleStats.driver },
                          { role: 'staff', icon: UserCheck, count: roleStats.staff },
                          { role: 'admin', icon: Shield, count: roleStats.admin },
                        ].map(item => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.role}
                              onClick={() => setBroadcastForm(prev => ({ ...prev, targetRole: item.role }))}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                broadcastForm.targetRole === item.role
                                  ? 'border-amani-green bg-amani-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Icon className="w-4 h-4 mb-1" />
                              <p className="font-medium capitalize text-sm">{item.role}s</p>
                              <p className="text-xs text-gray-500">{item.count} users</p>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="targetType"
                        checked={broadcastForm.targetType === 'specific'}
                        onChange={() => setBroadcastForm(prev => ({ ...prev, targetType: 'specific' }))}
                        className="w-4 h-4 text-amani-green"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Specific Users</span>
                        <p className="text-sm text-gray-500">
                          {broadcastForm.targetUsers.length > 0 
                            ? `${broadcastForm.targetUsers.length} selected`
                            : 'Select individual users'}
                        </p>
                      </div>
                      <User className="w-5 h-5 text-gray-400" />
                    </label>

                    {broadcastForm.targetType === 'specific' && (
                      <div className="ml-7">
                        <button
                          onClick={() => setShowUserPicker(true)}
                          className="w-full p-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Select Users
                        </button>
                        
                        {broadcastForm.targetUsers.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {broadcastForm.targetUsers.map(userId => {
                              const user = getUserById(userId);
                              return (
                                <span
                                  key={userId}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                                >
                                  {user?.first_name || 'User'}
                                  <button
                                    onClick={() => setBroadcastForm(prev => ({
                                      ...prev,
                                      targetUsers: prev.targetUsers.filter(id => id !== userId)
                                    }))}
                                    className="hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleBroadcast}
                    disabled={sending || !broadcastForm.title || !broadcastForm.message}
                    className="w-full py-3 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Notification
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <p className="text-gray-600">Click a template to use it. Customize before sending.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'welcomeCustomer', title: 'Welcome Message', desc: 'Welcome new customers with a discount code', type: 'promo' },
                  { name: 'loyaltyReward', title: 'Loyalty Reward', desc: 'Notify users about earned loyalty points', type: 'promo' },
                  { name: 'orderConfirmed', title: 'Order Confirmed', desc: 'Confirm a new order', type: 'order' },
                  { name: 'orderReady', title: 'Order Ready', desc: 'Notify when order is ready for delivery', type: 'order' },
                  { name: 'orderOutForDelivery', title: 'Out for Delivery', desc: 'Notify when driver is on the way', type: 'order' },
                ].map(template => (
                  <button
                    key={template.name}
                    onClick={() => handleUseTemplate(template.name)}
                    className="p-4 border border-gray-200 rounded-xl text-left hover:border-amani-green hover:bg-amani-50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${getTypeColor(template.type)} mb-2`}>
                          {template.type}
                        </span>
                        <h4 className="font-semibold text-gray-900">{template.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{template.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amani-green" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {sentNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900">No notifications sent yet</h3>
                  <p className="text-gray-500">Broadcast your first notification above</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {sentNotifications.map(notif => {
                    const user = getUserById(notif.user_id);
                    return (
                      <div
                        key={notif.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className={`p-2 rounded-lg ${getTypeColor(notif.type)}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 truncate">{notif.title}</h4>
                            {notif.is_read && (
                              <span className="text-xs text-gray-400">Read</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>To: {user ? `${user.first_name} ${user.last_name}` : 'Unknown'}</span>
                            <span>•</span>
                            <span>{new Date(notif.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Picker Modal */}
      <AnimatePresence>
        {showUserPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Select Users</h2>
                  <button
                    onClick={() => setShowUserPicker(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="Search users..."
                  />
                </div>
              </div>
              
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-2">
                  {filteredUsers.map(user => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={broadcastForm.targetUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBroadcastForm(prev => ({
                              ...prev,
                              targetUsers: [...prev.targetUsers, user.id]
                            }));
                          } else {
                            setBroadcastForm(prev => ({
                              ...prev,
                              targetUsers: prev.targetUsers.filter(id => id !== user.id)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-amani-green rounded"
                      />
                      <div className="w-10 h-10 bg-gradient-to-br from-amani-green to-emerald-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-gray-500">{user.email} • {user.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowUserPicker(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowUserPicker(false)}
                  className="flex-1 px-4 py-2 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark"
                >
                  Done ({broadcastForm.targetUsers.length} selected)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
