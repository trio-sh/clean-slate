import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { 
  Package, Clock, CheckCircle, AlertTriangle,
  TrendingUp, ChevronRight, RefreshCw, Search,
  Shirt, Droplets, Timer, Users, Truck, Calendar,
  BarChart2, ArrowUp, ArrowDown, Bell, Eye,
  PlayCircle, PauseCircle, CheckCircle2, LogIn, LogOut,
  MapPin, FileText, Download
} from 'lucide-react';
import { useAuthStore } from '../../stores';
import db from '../../lib/db';
import { format, isToday, parseISO, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';
import CheckInModal from '../../components/CheckInModal';
import { downloadInvoice, downloadReceipt } from '../../lib/utils';

const StaffDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    pendingOrders: 0,
    processingOrders: 0,
    readyOrders: 0,
    completedToday: 0,
    totalItemsToday: 0,
    avgProcessingTime: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [urgentOrders, setUrgentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeProcessing, setActiveProcessing] = useState([]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState(null);

  useEffect(() => {
    loadDashboardData();
    checkTodayCheckin();
    // Auto refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      const orders = await db.getOrdersWithDetails();
      const orderItems = await db.getAll('order_items');
      
      // Calculate stats
      const pending = orders.filter(o => ['pending_pickup', 'picked_up'].includes(o.status)).length;
      const processing = orders.filter(o => o.status === 'processing').length;
      const ready = orders.filter(o => o.status === 'ready').length;
      const completedToday = orders.filter(o => 
        o.status === 'delivered' && 
        isToday(parseISO(o.updated_at || o.created_at))
      ).length;

      // Calculate total items being processed today
      const todayOrders = orders.filter(o => isToday(parseISO(o.created_at)));
      const totalItems = todayOrders.reduce((sum, o) => {
        const items = orderItems.filter(i => i.order_id === o.id);
        return sum + items.reduce((s, i) => s + (i.quantity || 0), 0);
      }, 0);
      
      setStats({
        pendingOrders: pending,
        processingOrders: processing,
        readyOrders: ready,
        completedToday,
        totalItemsToday: totalItems,
        avgProcessingTime: 45, // minutes - would be calculated from actual data
      });
      
      // Get recent orders
      const sortedOrders = orders
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);
      setRecentOrders(sortedOrders);

      // Get urgent orders (pending for more than 2 hours)
      const urgent = orders.filter(o => {
        if (o.status !== 'pending_pickup') return false;
        const mins = differenceInMinutes(new Date(), parseISO(o.created_at));
        return mins > 120;
      });
      setUrgentOrders(urgent);

      // Get orders currently being processed
      const processingOrders = orders.filter(o => o.status === 'processing');
      setActiveProcessing(processingOrders.slice(0, 5));

    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleQuickStatusUpdate = async (orderId, newStatus) => {
    try {
      await db.update('orders', orderId, { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      });
      toast.success(`Order updated to ${newStatus}`);
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_pickup: 'bg-amber-100 text-amber-700 border-amber-200',
      picked_up: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      processing: 'bg-purple-100 text-purple-700 border-purple-200',
      ready: 'bg-green-100 text-green-700 border-green-200',
      out_for_delivery: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const statCards = [
    { label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'from-yellow-500 to-amber-600', bgColor: 'bg-yellow-50', link: '/staff/orders?status=pending_pickup' },
    { label: 'Processing', value: stats.processingOrders, icon: Droplets, color: 'from-purple-500 to-indigo-600', bgColor: 'bg-purple-50', link: '/staff/processing' },
    { label: 'Ready for Pickup', value: stats.readyOrders, icon: CheckCircle, color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50', link: '/staff/orders?status=ready' },
    { label: 'Completed Today', value: stats.completedToday, icon: TrendingUp, color: 'from-emerald-500 to-teal-600', bgColor: 'bg-emerald-50', link: '/staff/orders?status=delivered' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-amani-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Check-In Status Banner */}
      {!todayCheckin ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">You haven't checked in today</p>
                <p className="text-sm text-white/80">Please check in to start your shift</p>
              </div>
            </div>
            <button
              onClick={() => setShowCheckInModal(true)}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              Check In Now
            </button>
          </div>
        </motion.div>
      ) : todayCheckin && !todayCheckin.check_out_time ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Checked in at {format(parseISO(todayCheckin.check_in_time), 'h:mm a')}</p>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {todayCheckin.check_in_location?.address?.substring(0, 50) || 'Location recorded'}...
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCheckInModal(true)}
              className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Check Out
            </button>
          </div>
        </motion.div>
      ) : null}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">
            Welcome back, {user?.first_name || 'Staff'}!
          </h1>
          <p className="text-gray-500">Here's what's happening at the facility today</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link to="/staff/orders" className="btn-primary">
            <Package className="w-4 h-4" />
            View All Orders
          </Link>
        </div>
      </div>

      {/* Check-In Modal */}
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSuccess={checkTodayCheckin}
      />

      {/* Urgent Orders Alert */}
      {urgentOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">
                {urgentOrders.length} Urgent Order{urgentOrders.length > 1 ? 's' : ''} Require Attention
              </h3>
              <p className="text-sm text-red-600 mt-1">
                These orders have been pending for more than 2 hours
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {urgentOrders.slice(0, 3).map(order => (
                  <Link
                    key={order.id}
                    to={`/staff/orders`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    #{order.reference_code}
                  </Link>
                ))}
                {urgentOrders.length > 3 && (
                  <span className="text-sm text-red-600">+{urgentOrders.length - 3} more</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link
              to={stat.link}
              className={`block p-5 ${stat.bgColor} rounded-2xl border border-gray-100 hover:shadow-lg transition-all group`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-3xl font-bold text-navy-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shirt className="w-5 h-5 text-amani-500" />
            <span className="text-gray-600">Items Today</span>
          </div>
          <p className="text-2xl font-bold text-navy-900">{stats.totalItemsToday}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Timer className="w-5 h-5 text-amani-500" />
            <span className="text-gray-600">Avg. Processing Time</span>
          </div>
          <p className="text-2xl font-bold text-navy-900">{stats.avgProcessingTime} min</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 className="w-5 h-5 text-amani-500" />
            <span className="text-gray-600">Efficiency Rate</span>
          </div>
          <p className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            94%
            <ArrowUp className="w-4 h-4 text-green-500" />
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Processing */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-navy-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-purple-500" />
              Currently Processing
            </h2>
            <Link to="/staff/processing" className="text-sm text-amani-600 hover:text-amani-700">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {activeProcessing.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders currently processing</p>
                <Link to="/staff/orders" className="text-amani-600 text-sm mt-2 inline-block">
                  Start processing pending orders →
                </Link>
              </div>
            ) : (
              activeProcessing.map(order => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-navy-900">#{order.reference_code}</p>
                      <p className="text-sm text-gray-500">
                        {order.customer_name || (order.user ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() : 'Guest')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickStatusUpdate(order.id, 'ready')}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                      >
                        Mark Ready
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-navy-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amani-500" />
              Recent Orders
            </h2>
            <Link to="/staff/orders" className="text-sm text-amani-600 hover:text-amani-700">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {recentOrders.map(order => (
              <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-navy-900">#{order.reference_code}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.customer_name || (order.user ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() : 'Guest')} • {format(parseISO(order.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === 'pending_pickup' && (
                      <button
                        onClick={() => handleQuickStatusUpdate(order.id, 'picked_up')}
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                        title="Confirm Order"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {order.status === 'picked_up' && (
                      <button
                        onClick={() => handleQuickStatusUpdate(order.id, 'processing')}
                        className="p-2 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors"
                        title="Start Processing"
                      >
                        <PlayCircle className="w-5 h-5" />
                      </button>
                    )}
                    <Link
                      to={`/staff/orders`}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-amani-500 to-amani-600 rounded-2xl p-6 text-white">
        <h2 className="font-display font-bold text-xl mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/staff/orders?status=pending_pickup"
            className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Clock className="w-8 h-8" />
            <span className="text-sm font-medium">Process Pending</span>
          </Link>
          <Link
            to="/staff/processing"
            className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Droplets className="w-8 h-8" />
            <span className="text-sm font-medium">View Processing</span>
          </Link>
          <Link
            to="/staff/orders?status=ready"
            className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Truck className="w-8 h-8" />
            <span className="text-sm font-medium">Ready for Delivery</span>
          </Link>
          <Link
            to="/staff/orders"
            className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Search className="w-8 h-8" />
            <span className="text-sm font-medium">Search Orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
