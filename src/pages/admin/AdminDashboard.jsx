import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import {
  DollarSign, Package, Users, Truck, TrendingUp, TrendingDown,
  ArrowUpRight, BarChart3, ShoppingBag, Clock, Calendar,
  Shirt, Star, AlertCircle, CheckCircle, RefreshCcw
} from 'lucide-react';
import { useOrderStore, useAppStore } from '../../stores';
import { useLanguage } from '../../i18n/LanguageContext';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { orders, fetchOrders, loading } = useOrderStore();
  
  const [dateRange, setDateRange] = useState('week');
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0
  });
  const [topServices, setTopServices] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Calculate stats from orders
  useEffect(() => {
    if (orders.length > 0) {
      const now = new Date();
      let startDate = new Date();
      
      if (dateRange === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (dateRange === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      const filteredOrders = orders.filter(o => new Date(o.created_at) >= startDate);
      const revenue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total) || parseFloat(o.total_amount) || 0), 0);
      const uniqueCustomers = new Set(filteredOrders.map(o => o.customer_id).filter(Boolean)).size;
      
      setStats({
        revenue,
        orders: filteredOrders.length,
        customers: uniqueCustomers,
        avgOrderValue: filteredOrders.length > 0 ? revenue / filteredOrders.length : 0,
        pendingOrders: filteredOrders.filter(o => ['pending_pickup', 'picked_up'].includes(o.status)).length,
        processingOrders: filteredOrders.filter(o => ['processing', 'quality_check'].includes(o.status)).length,
        completedOrders: filteredOrders.filter(o => ['delivered'].includes(o.status)).length
      });

      // Calculate top services from order items
      const serviceMap = new Map();
      
      filteredOrders.forEach(order => {
        const items = order.items || [];
        items.forEach(item => {
          const serviceName = item.service_name || item.name || 'Unknown Service';
          const existing = serviceMap.get(serviceName) || { orders: 0, revenue: 0, quantity: 0 };
          const itemRevenue = parseFloat(item.total_price) || ((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 1));
          serviceMap.set(serviceName, {
            orders: existing.orders + 1,
            revenue: existing.revenue + itemRevenue,
            quantity: existing.quantity + (parseInt(item.quantity) || 1)
          });
        });
      });

      // Convert to array and sort by revenue
      const servicesArray = Array.from(serviceMap.entries())
        .map(([name, data]) => ({
          name,
          orders: data.quantity,
          revenue: data.revenue,
          trend: '+' + Math.floor(Math.random() * 20 + 1) + '%' // Placeholder trend
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5); // Top 5 services

      setTopServices(servicesArray.length > 0 ? servicesArray : [
        { name: 'No services yet', orders: 0, revenue: 0, trend: '0%' }
      ]);
    }
  }, [orders, dateRange]);

  // Demo data for charts
  const revenueData = [
    { day: 'Mon', revenue: 1250, orders: 12 },
    { day: 'Tue', revenue: 1890, orders: 18 },
    { day: 'Wed', revenue: 1450, orders: 14 },
    { day: 'Thu', revenue: 2100, orders: 21 },
    { day: 'Fri', revenue: 2450, orders: 24 },
    { day: 'Sat', revenue: 1980, orders: 19 },
    { day: 'Sun', revenue: 890, orders: 9 },
  ];

  const recentOrders = orders.slice(0, 5);

  const statusColors = {
    pending_pickup: 'bg-amber-100 text-amber-700',
    picked_up: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    ready: 'bg-emerald-100 text-emerald-700',
    out_for_delivery: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  // Stats cards configuration
  const statCards = [
    {
      title: t('dashboard.totalRevenue') || 'Total Revenue',
      value: `$${stats.revenue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: t('orders.title') || 'Total Orders',
      value: stats.orders.toString(),
      change: '+8.2%',
      trend: 'up',
      icon: Package,
      color: 'from-amani-500 to-maple-500'
    },
    {
      title: t('customers.activeCustomers') || 'Active Customers',
      value: stats.customers.toString(),
      change: '+15.3%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      title: t('dashboard.avgOrderValue') || 'Avg Order Value',
      value: `$${stats.avgOrderValue.toFixed(2)}`,
      change: '-2.1%',
      trend: 'down',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">{t('dashboard.overview')}</h1>
          <p className="text-gray-600">{t('dashboard.welcome')}! {t('dashboard.statsDesc') || "Here's what's happening with your business."}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field w-auto"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={fetchOrders}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-navy-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.title}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-navy-900">Revenue Overview</h2>
              <p className="text-sm text-gray-500">Daily revenue for the past week</p>
            </div>
            <Link to="/admin/reports" className="text-sm text-amani-600 hover:text-amani-700 flex items-center gap-1">
              View Details <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Simple Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-2">
            {revenueData.map((day, index) => {
              const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
              const height = (day.revenue / maxRevenue) * 100;
              
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">${day.revenue}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-amani-500 to-amani-400 rounded-t-lg min-h-[20px]"
                      style={{ height: `${height}%`, maxHeight: '200px' }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-6">Order Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-navy-900">Pending</p>
                  <p className="text-xs text-gray-500">Awaiting pickup</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-amber-600">{stats.pendingOrders}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <RefreshCcw className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-navy-900">Processing</p>
                  <p className="text-xs text-gray-500">Being cleaned</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-600">{stats.processingOrders}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-navy-900">Completed</p>
                  <p className="text-xs text-gray-500">Delivered</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-emerald-600">{stats.completedOrders}</span>
            </div>
          </div>

          <Link 
            to="/admin/orders" 
            className="mt-4 w-full btn-secondary justify-center"
          >
            View All Orders
          </Link>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-navy-900">{t('dashboard.recentOrders')}</h2>
            <Link to="/admin/orders" className="text-sm text-amani-600 hover:text-amani-700 flex items-center gap-1">
              {t('dashboard.viewAll')} <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amani-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-amani-600" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-900 font-mono text-sm">
                      {order.reference_code}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customer_name || (order.user ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() : 'Guest')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-navy-900">${order.total?.toFixed(2)}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.pending_pickup}`}>
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}

            {recentOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-navy-900">Top Services</h2>
            <Link to="/admin/services" className="text-sm text-amani-600 hover:text-amani-700 flex items-center gap-1">
              Manage <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div key={service.name} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-navy-900">{service.name}</p>
                    <span className="text-sm text-emerald-600 font-medium">{service.trend}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{service.orders} orders</span>
                    <span className="font-semibold text-navy-900">${service.revenue.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amani-500 to-maple-500 rounded-full"
                      style={{ width: `${(service.revenue / 4500) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/orders" className="flex items-center gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <Package className="w-6 h-6" />
            <span className="font-medium">Manage Orders</span>
          </Link>
          <Link to="/admin/customers" className="flex items-center gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <Users className="w-6 h-6" />
            <span className="font-medium">View Customers</span>
          </Link>
          <Link to="/admin/drivers" className="flex items-center gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <Truck className="w-6 h-6" />
            <span className="font-medium">Manage Drivers</span>
          </Link>
          <Link to="/admin/reports" className="flex items-center gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <BarChart3 className="w-6 h-6" />
            <span className="font-medium">View Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
