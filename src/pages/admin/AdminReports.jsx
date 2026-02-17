import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Package,
  Users, Truck, Calendar, Download, RefreshCw, ArrowRight,
  PieChart, Activity, Clock, Star, Filter
} from 'lucide-react';
import db from '../../lib/db';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, 1y
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    newCustomers: 0,
    revenueChange: 0,
    ordersChange: 0,
    customerChange: 0
  });
  const [dailyData, setDailyData] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const orders = await db.getOrdersWithDetails();
      const users = await db.getAll('users');

      // Calculate date range
      const now = new Date();
      const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const days = daysMap[dateRange] || 7;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Filter orders by date range
      const periodOrders = orders.filter(o => 
        new Date(o.created_at) >= startDate
      );

      // Previous period for comparison
      const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
      const prevOrders = orders.filter(o => {
        const date = new Date(o.created_at);
        return date >= prevStartDate && date < startDate;
      });

      // Calculate stats - parseFloat because Supabase returns DECIMAL as strings
      const totalRevenue = periodOrders.reduce((sum, o) => sum + (parseFloat(o.total) || parseFloat(o.total_amount) || 0), 0);
      const prevRevenue = prevOrders.reduce((sum, o) => sum + (parseFloat(o.total) || parseFloat(o.total_amount) || 0), 0);
      const revenueChange = prevRevenue > 0 
        ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)
        : 0;

      const totalOrders = periodOrders.length;
      const prevOrderCount = prevOrders.length;
      const ordersChange = prevOrderCount > 0
        ? ((totalOrders - prevOrderCount) / prevOrderCount * 100).toFixed(1)
        : 0;

      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // New customers in period - check users table (role = 'customer' or no role)
      const newCustomers = users.filter(u => {
        const isCustomer = !u.role || u.role === 'customer';
        return isCustomer && new Date(u.created_at) >= startDate;
      }).length;
      const prevNewCustomers = users.filter(u => {
        const date = new Date(u.created_at);
        const isCustomer = !u.role || u.role === 'customer';
        return isCustomer && date >= prevStartDate && date < startDate;
      }).length;
      const customerChange = prevNewCustomers > 0
        ? ((newCustomers - prevNewCustomers) / prevNewCustomers * 100).toFixed(1)
        : 0;

      setStats({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        newCustomers,
        revenueChange: parseFloat(revenueChange),
        ordersChange: parseFloat(ordersChange),
        customerChange: parseFloat(customerChange)
      });

      // Daily data for chart
      const dailyMap = {};
      for (let i = Math.min(days, 14); i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = date.toISOString().split('T')[0];
        dailyMap[key] = { date: key, orders: 0, revenue: 0 };
      }
      periodOrders.forEach(order => {
        const key = new Date(order.created_at).toISOString().split('T')[0];
        if (dailyMap[key]) {
          dailyMap[key].orders += 1;
          dailyMap[key].revenue += parseFloat(order.total) || parseFloat(order.total_amount) || 0;
        }
      });
      setDailyData(Object.values(dailyMap));

      // Top services from joined order items
      const serviceCounts = {};
      periodOrders.forEach(order => {
        const items = order.items || [];
        if (items.length > 0) {
          items.forEach(item => {
            const name = item.service_name || item.name || 'Unknown';
            if (!serviceCounts[name]) {
              serviceCounts[name] = { name, count: 0, revenue: 0 };
            }
            serviceCounts[name].count += parseInt(item.quantity) || 1;
            serviceCounts[name].revenue += parseFloat(item.total_price) || ((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 1));
          });
        }
      });
      setTopServices(
        Object.values(serviceCounts)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      );

      // Orders by status
      const statusCounts = {};
      periodOrders.forEach(order => {
        const status = order.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      setOrdersByStatus(
        Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          percentage: totalOrders > 0 ? (count / totalOrders * 100).toFixed(1) : 0
        }))
      );

      // Recent activity
      setRecentActivity(
        orders
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          .slice(0, 10)
          .map(o => ({
            id: o.id,
            type: 'order',
            message: `Order #${o.reference_code || o.id.slice(0, 8)} ${o.status?.replace('_', ' ')}`,
            time: o.updated_at || o.created_at,
            amount: parseFloat(o.total) || parseFloat(o.total_amount) || 0
          }))
      );

    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Export report data to CSV
  const handleExportReport = async () => {
    try {
      const orders = await db.getOrdersWithDetails();
      
      // Calculate date range
      const now = new Date();
      const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const days = daysMap[dateRange] || 7;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      // Filter orders by date range
      const periodOrders = orders.filter(o => 
        new Date(o.created_at) >= startDate
      );

      if (periodOrders.length === 0) {
        toast.error('No data to export for this period');
        return;
      }

      // Create CSV content
      const headers = ['Date', 'Order ID', 'Customer', 'Status', 'Total', 'Payment Method'];
      const rows = periodOrders.map(o => [
        new Date(o.created_at).toLocaleDateString(),
        o.reference_code || o.id.slice(0, 8),
        o.customer_name || 'Guest',
        o.status?.replace('_', ' ') || '',
        `$${(parseFloat(o.total) || parseFloat(o.total_amount) || 0).toFixed(2)}`,
        o.payment_method || 'N/A'
      ]);

      const csvContent = [
        `Report Export - ${dateRange} - Generated ${new Date().toLocaleDateString()}`,
        '',
        `Total Revenue: $${stats.totalRevenue.toFixed(2)}`,
        `Total Orders: ${stats.totalOrders}`,
        `Average Order Value: $${stats.avgOrderValue.toFixed(2)}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report exported! (${periodOrders.length} orders)`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      pending_pickup: 'bg-amber-500',
      confirmed: 'bg-blue-500',
      picked_up: 'bg-purple-500',
      processing: 'bg-indigo-500',
      quality_check: 'bg-indigo-400',
      cleaning: 'bg-cyan-500',
      ready: 'bg-emerald-500',
      out_for_delivery: 'bg-orange-500',
      delivered: 'bg-green-500',
      completed: 'bg-green-600',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const maxDailyRevenue = Math.max(...dailyData.map(d => d.revenue), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amani-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={loadReportData}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-4 py-2 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div className={`flex items-center text-sm ${
              stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.revenueChange >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(stats.revenueChange)}%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`flex items-center text-sm ${
              stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.ordersChange >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(stats.ordersChange)}%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            <p className="text-sm text-gray-500 mt-1">Total Orders</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgOrderValue)}</p>
            <p className="text-sm text-gray-500 mt-1">Avg Order Value</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className={`flex items-center text-sm ${
              stats.customerChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.customerChange >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(stats.customerChange)}%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{stats.newCustomers}</p>
            <p className="text-sm text-gray-500 mt-1">New Customers</p>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
        <div className="h-64">
          <div className="flex h-full items-end justify-between gap-2">
            {dailyData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full relative group">
                  <div 
                    className="w-full bg-amani-green/20 rounded-t transition-all hover:bg-amani-green/30"
                    style={{ 
                      height: `${Math.max((day.revenue / maxDailyRevenue) * 200, 4)}px`
                    }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {formatCurrency(day.revenue)}
                      <br />
                      {day.orders} orders
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400 mt-2 rotate-45 origin-left">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Top Services & Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h2>
          {topServices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data available</p>
          ) : (
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <span className="w-6 h-6 rounded-full bg-amani-green/10 text-amani-green text-sm flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.count} orders</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(service.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
          {ordersByStatus.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders in this period</p>
          ) : (
            <div className="space-y-3">
              {ordersByStatus.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 capitalize">
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getStatusColor(item.status)} rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.time).toLocaleString()}
                    </p>
                  </div>
                </div>
                {activity.amount && (
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(activity.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amani-green to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">This Period</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
          <p className="text-sm opacity-80 mt-1">Orders Processed</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Average</span>
          </div>
          <p className="text-3xl font-bold">2.5h</p>
          <p className="text-sm opacity-80 mt-1">Processing Time</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Star className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Rating</span>
          </div>
          <p className="text-3xl font-bold">4.8/5</p>
          <p className="text-sm opacity-80 mt-1">Customer Satisfaction</p>
        </div>
      </div>
    </div>
  );
}
