import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

import {
  Truck, Package, MapPin, Clock, CheckCircle,
  Navigation, Phone, ChevronRight, Calendar, TrendingUp,
  AlertCircle, Star, RefreshCw, Eye, PlayCircle,
  LogIn, LogOut, Send, MessageSquare
} from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../../stores';
import { useLanguage } from '../../i18n/LanguageContext';
import db from '../../lib/db';
import { sendSMS, smsTemplates, formatAddress } from '../../lib/utils';
import { format, isToday, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import CheckInModal from '../../components/CheckInModal';

const DriverDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    completedToday: 0,
    pendingPickups: 0,
    pendingDeliveries: 0,
    rating: 4.9,
  });
  const [todayOrders, setTodayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [sendingSMS, setSendingSMS] = useState({});

  useEffect(() => {
    loadDashboardData();
    checkTodayCheckin();
  }, [user]);

  const checkTodayCheckin = async () => {
    if (!user) return;
    try {
      const checkin = await db.getTodayCheckin(user.id);
      setTodayCheckin(checkin);
      
      // Show check-in modal if not checked in today
      if (!checkin) {
        setTimeout(() => setShowCheckInModal(true), 500);
      }
    } catch (err) {
      console.error('Failed to check today status:', err);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load orders directly - simpler approach without complex route system
      const orders = await db.getOrdersWithDetails();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get orders that need pickup - status is pending_pickup
      const pickupOrders = orders.filter(o => 
        o.status === 'pending_pickup'
      );
      
      // Get orders ready for delivery
      const deliveryOrders = orders.filter(o => 
        ['ready', 'out_for_delivery'].includes(o.status)
      );

      const completedToday = orders.filter(o => 
        o.status === 'delivered'
      ).length;

      // Combine into today's assignments
      const assignments = [
        ...pickupOrders.map(o => ({ ...o, taskType: 'pickup' })),
        ...deliveryOrders.map(o => ({ ...o, taskType: 'delivery' })),
      ].sort((a, b) => {
        // Sort by time slot
        const getTimeValue = (slot) => {
          if (!slot) return 99;
          if (slot.includes('7am') || slot.includes('7:00') || slot === 'morning') return 1;
          if (slot.includes('6pm') || slot.includes('6:00') || slot === 'evening') return 2;
          return 99;
        };
        const aTime = getTimeValue(a.taskType === 'pickup' ? a.pickup_time_slot : a.delivery_time_slot);
        const bTime = getTimeValue(b.taskType === 'pickup' ? b.pickup_time_slot : b.delivery_time_slot);
        return aTime - bTime;
      });

      setStats({
        todayDeliveries: deliveryOrders.length + pickupOrders.length,
        completedToday,
        pendingPickups: pickupOrders.length,
        pendingDeliveries: deliveryOrders.length,
        rating: user?.rating || 4.9,
      });

      setTodayOrders(assignments);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const updates = { 
        status: newStatus,
        updated_at: new Date().toISOString() 
      };
      
      if (newStatus === 'picked_up') {
        updates.picked_up_at = new Date().toISOString();
      } else if (newStatus === 'out_for_delivery') {
        updates.out_for_delivery_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }
      
      await db.update('orders', orderId, updates);
      toast.success(`Order marked as ${newStatus.replace('_', ' ')}!`);
      
      // Add notification
      addNotification({
        type: 'order',
        title: 'Status Updated',
        message: `Order marked as ${newStatus.replace('_', ' ')}`,
        link: `/driver/delivery/${orderId}`,
      });
      
      loadDashboardData();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update order status');
    }
  };

  // SMS Notification handler
  const handleNotifyCustomer = async (order, notificationType) => {
    if (!order.customer_phone) {
      toast.error('No phone number available for this customer');
      return;
    }

    setSendingSMS(prev => ({ ...prev, [order.id]: notificationType }));
    
    try {
      const driverName = user?.first_name || 'Your driver';
      let message;
      
      switch (notificationType) {
        case 'on_way':
          message = smsTemplates.outForDelivery(order.reference_code, driverName);
          // Also update status to out_for_delivery
          await db.update('orders', order.id, { 
            status: 'out_for_delivery', 
            out_for_delivery_at: new Date().toISOString() 
          });
          break;
        case 'arriving':
          message = `${driverName} from Amani's Cleaners will arrive in about 5 minutes with your order #${order.reference_code}. Please be ready! 🚗`;
          break;
        case 'pickup_reminder':
          message = smsTemplates.pickupReminder(order.reference_code, order.pickup_time_slot || 'today');
          break;
        default:
          message = `Update on your Amani's Cleaners order #${order.reference_code}`;
      }

      const result = await sendSMS(order.customer_phone, message);
      
      if (result.success) {
        toast.success('Customer notified successfully!');
        if (notificationType === 'on_way') {
          loadDashboardData(); // Refresh to show updated status
        }
      } else {
        toast.error(result.error || 'Failed to send SMS');
      }
    } catch (err) {
      console.error('SMS error:', err);
      toast.error('Failed to send notification');
    } finally {
      setSendingSMS(prev => ({ ...prev, [order.id]: null }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_pickup: 'bg-amber-100 text-amber-700',
      picked_up: 'bg-indigo-100 text-indigo-700',
      processing: 'bg-purple-100 text-purple-700',
      ready: 'bg-green-100 text-green-700',
      out_for_delivery: 'bg-cyan-100 text-cyan-700',
      delivered: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
  };

  // Get next task
  const nextTask = todayOrders.find(o => 
    !['delivered', 'cancelled'].includes(o.status)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Check-in Modal */}
      {showCheckInModal && (
        <CheckInModal
          onClose={() => setShowCheckInModal(false)}
          onSuccess={() => {
            setShowCheckInModal(false);
            checkTodayCheckin();
          }}
        />
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-600">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        {/* Check-in Status */}
        <div className="flex items-center gap-3">
          {todayCheckin ? (
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Checked in at {format(new Date(todayCheckin.check_in_time), 'h:mm a')}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowCheckInModal(true)}
              className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span className="font-medium">Check In Now</span>
            </button>
          )}
          
          <button
            onClick={loadDashboardData}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.pendingPickups}</p>
              <p className="text-sm text-gray-500">Pending Pickups</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.pendingDeliveries}</p>
              <p className="text-sm text-gray-500">Pending Deliveries</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.completedToday}</p>
              <p className="text-sm text-gray-500">Completed Today</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.rating}</p>
              <p className="text-sm text-gray-500">Your Rating</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Next Task Hero Card */}
      {nextTask && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 text-white ${
            nextTask.taskType === 'pickup' 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
              : 'bg-gradient-to-r from-purple-500 to-indigo-600'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {nextTask.taskType === 'pickup' ? (
                <Package className="w-6 h-6" />
              ) : (
                <Truck className="w-6 h-6" />
              )}
              <span className="font-semibold text-lg">
                Next: {nextTask.taskType === 'pickup' ? 'Pickup' : 'Delivery'}
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              nextTask.taskType === 'pickup' ? 'bg-amber-600' : 'bg-purple-700'
            }`}>
              {formatStatus(nextTask.status)}
            </span>
          </div>
          
          <div className="mb-4">
            <p className="font-mono font-bold text-lg mb-1">
              #{nextTask.reference_code}
            </p>
            <p className="text-white/90 mb-1">
              <strong>Customer:</strong> {nextTask.customer_name || 'Guest'}
            </p>
            <p className="text-white/80 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {nextTask.taskType === 'pickup' 
                ? (formatAddress(nextTask.pickup_address) || 'Address not provided')
                : (formatAddress(nextTask.delivery_address) || 'Address not provided')
              }
            </p>
            <p className="text-white/80 flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4" />
              {nextTask.taskType === 'pickup' 
                ? (nextTask.pickup_time_slot || 'Time TBD')
                : (nextTask.delivery_time_slot || 'Time TBD')
              }
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {nextTask.customer_phone ? (
              <a 
                href={`tel:${nextTask.customer_phone}`}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            ) : null}
            
            <button 
              onClick={() => {
                const address = nextTask.taskType === 'pickup' 
                  ? formatAddress(nextTask.pickup_address) 
                  : formatAddress(nextTask.delivery_address);
                if (address) {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
                } else {
                  toast.error('No address available');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Navigate
            </button>
            
            {/* SMS Notification Buttons */}
            {nextTask.taskType === 'delivery' && ['ready', 'out_for_delivery'].includes(nextTask.status) && (
              <button
                onClick={() => handleNotifyCustomer(nextTask, 'on_way')}
                disabled={sendingSMS[nextTask.id]}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sendingSMS[nextTask.id] === 'on_way' ? 'Sending...' : "I'm On My Way"}
              </button>
            )}
            
            {nextTask.taskType === 'delivery' && nextTask.status === 'out_for_delivery' && (
              <button
                onClick={() => handleNotifyCustomer(nextTask, 'arriving')}
                disabled={sendingSMS[nextTask.id]}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sendingSMS[nextTask.id] === 'arriving' ? 'Sending...' : 'Arriving Soon'}
              </button>
            )}
            
            {nextTask.taskType === 'pickup' && nextTask.status === 'pending_pickup' && (
              <button
                onClick={() => handleNotifyCustomer(nextTask, 'pickup_reminder')}
                disabled={sendingSMS[nextTask.id]}
                className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-amber-900 rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sendingSMS[nextTask.id] === 'pickup_reminder' ? 'Sending...' : 'Send Reminder'}
              </button>
            )}
            
            <button
              onClick={() => handleStatusUpdate(
                nextTask.id, 
                nextTask.taskType === 'pickup' ? 'picked_up' : 'delivered'
              )}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-navy-900 font-medium hover:bg-white/90 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Complete
            </button>
          </div>
        </motion.div>
      )}

      {/* Today's Tasks */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-display font-bold text-navy-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amani-500" />
            Today's Schedule
          </h2>
          <Link to="/driver/routes" className="text-sm text-amani-600 hover:text-amani-700">
            View All Routes
          </Link>
        </div>
        
        {todayOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No tasks scheduled today</h3>
            <p className="text-gray-400 mt-1">Check back later for new assignments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todayOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      order.taskType === 'pickup' ? 'bg-amber-100' : 'bg-purple-100'
                    }`}>
                      {order.taskType === 'pickup' ? (
                        <Package className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Truck className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-navy-900">#{order.reference_code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.customer_name || 'Guest'} • {
                          order.taskType === 'pickup' 
                            ? (order.pickup_time_slot || 'TBD')
                            : (order.delivery_time_slot || 'TBD')
                        }
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {formatAddress(order.taskType === 'pickup' ? order.pickup_address : order.delivery_address)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Quick SMS Button */}
                    {order.customer_phone && (
                      <button
                        onClick={() => handleNotifyCustomer(
                          order, 
                          order.taskType === 'pickup' ? 'pickup_reminder' : 'on_way'
                        )}
                        disabled={sendingSMS[order.id]}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                        title="Send SMS"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    )}
                    
                    <Link
                      to={`/driver/delivery/${order.id}`}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
