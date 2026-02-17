import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Calendar, DollarSign, User, 
  CheckCircle, XCircle, Clock, MoreVertical,
  Star, Crown, GraduationCap, Eye, Edit, Trash2
} from 'lucide-react';
import db from '../../lib/db';
import toast from 'react-hot-toast';

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subs, allUsers, allPlans] = await Promise.all([
        db.getAll('customer_subscriptions'),
        db.getAll('users'),
        db.getAll('subscription_plans')
      ]);

      setSubscriptions(subs || []);
      setUsers(allUsers || []);
      setPlans(allPlans || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (id) => users.find(u => u.id === id);
  const getPlanById = (id) => plans.find(p => p.id === id);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanIcon = (planSlug) => {
    if (planSlug?.includes('student')) return GraduationCap;
    if (planSlug?.includes('gold')) return Crown;
    return Star;
  };

  const getPlanColor = (planSlug) => {
    if (planSlug?.includes('student')) return 'purple';
    if (planSlug?.includes('gold')) return 'amber';
    return 'gray';
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const user = getUserById(sub.user_id);
    const plan = getPlanById(sub.plan_id);
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = !searchTerm || 
      (user?.first_name?.toLowerCase().includes(searchLower)) ||
      (user?.last_name?.toLowerCase().includes(searchLower)) ||
      (user?.email?.toLowerCase().includes(searchLower)) ||
      (plan?.name?.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || plan?.slug === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleStatusChange = async (subscriptionId, newStatus) => {
    try {
      await db.update('customer_subscriptions', subscriptionId, { status: newStatus });
      toast.success(`Subscription status updated to ${newStatus}`);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update subscription status');
    }
  };

  const handleDeleteSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    
    try {
      await db.delete('customer_subscriptions', subscriptionId);
      toast.success('Subscription deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      toast.error('Failed to delete subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amani-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">Manage customer subscriptions and payments</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500"
            >
              <option value="all">All Plans</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.slug}>{plan.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptions.filter(s => s.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payment</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptions.filter(s => s.status === 'pending_payment').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(subscriptions
                  .filter(s => s.status === 'active')
                  .reduce((sum, s) => sum + (getPlanById(s.plan_id)?.price || 0), 0)
                ).toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(subscriptions.map(s => s.user_id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pounds Remaining
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((subscription) => {
                const user = getUserById(subscription.user_id);
                const plan = getPlanById(subscription.plan_id);
                const PlanIcon = plan ? getPlanIcon(plan.slug) : Star;
                const planColor = plan ? getPlanColor(plan.slug) : 'gray';

                return (
                  <motion.tr
                    key={subscription.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user ? `${user.first_name} ${user.last_name}` : 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-2 bg-${planColor}-100 rounded-lg mr-3`}>
                          <PlanIcon className={`w-4 h-4 text-${planColor}-600`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {plan?.name || 'Unknown Plan'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {plan?.pounds_included} lbs included
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                        {subscription.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${plan?.price || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{subscription.start_date}</div>
                        <div>to {subscription.end_date}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {subscription.pounds_remaining || 0} lbs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button className="text-amani-600 hover:text-amani-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <select
                          value={subscription.status}
                          onChange={(e) => handleStatusChange(subscription.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="pending_payment">Pending Payment</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || planFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating some subscription plans'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptions;