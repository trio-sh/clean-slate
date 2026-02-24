import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package, Clock, CheckCircle, Truck,
  TrendingUp, Building2, ArrowRight, RefreshCcw
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import db from '../../lib/db';
import { useAuthStore } from '../../stores';

const PartnerDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const [depot, setDepot] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (!user?.depot_id) { setLoading(false); return; }
      const [depotData, ordersData] = await Promise.all([
        db.getById('depots', user.depot_id),
        db.getOrdersByDepot(user.depot_id),
      ]);
      setDepot(depotData);
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const todayOrders = orders.filter(o => o.pickup_date === today || o.delivery_date === today);
  const pendingOrders = orders.filter(o => ['pending_pickup', 'picked_up'].includes(o.status));
  const processingOrders = orders.filter(o => o.status === 'processing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const stats = [
    { label: "Today's Orders", value: todayOrders.length, icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending', value: pendingOrders.length, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Processing', value: processingOrders.length, icon: RefreshCcw, color: 'bg-purple-50 text-purple-600' },
    { label: 'Ready for Pickup', value: readyOrders.length, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
  ];

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">
          Welcome back, {user?.first_name}!
        </h1>
        {depot && (
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amani-500" />
            {depot.name} — {depot.city}
          </p>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-navy-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link to="/partner-portal/orders" className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <h3 className="font-semibold text-navy-900">Manage Orders</h3>
            <p className="text-sm text-gray-500 mt-1">{orders.length} total orders at your depot</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amani-500 transition-colors" />
        </Link>
        <Link to="/partner-portal/services" className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <h3 className="font-semibold text-navy-900">My Services</h3>
            <p className="text-sm text-gray-500 mt-1">Manage depot services &amp; pricing</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amani-500 transition-colors" />
        </Link>
        <Link to="/partner-portal/depot" className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <h3 className="font-semibold text-navy-900">Depot Info</h3>
            <p className="text-sm text-gray-500 mt-1">Hours, capacity &amp; contact details</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amani-500 transition-colors" />
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy-900">Recent Orders</h2>
          <Link to="/partner-portal/orders" className="text-amani-500 text-sm font-medium hover:underline">View all</Link>
        </div>
        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3" />
            <p>No orders assigned to your depot yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-navy-900">#{order.reference_code}</p>
                  <p className="text-sm text-gray-500">{order.customer_name} · {order.pickup_date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                  order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerDashboard;
