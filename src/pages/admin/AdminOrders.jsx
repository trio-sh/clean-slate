import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Search, Filter, Eye, Clock, CheckCircle, XCircle,
  Truck, RefreshCcw, ChevronLeft, ChevronRight, Download,
  Calendar, MapPin, Phone, AlertTriangle, Shirt, Mail,
  DollarSign, Edit, Trash2, Plus, X
} from 'lucide-react';
import { useOrderStore, useAppStore } from '../../stores';
import { formatAddress } from '../../lib/utils';
import OrderEditModal from '../../components/OrderEditModal';

const AdminOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const ordersPerPage = 15;

  const { orders, fetchOrders, updateOrderStatus, loading } = useOrderStore();
  

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const statusConfig = {
    pending_pickup: { label: 'Pending Pickup', color: 'bg-amber-100 text-amber-700', icon: Clock },
    picked_up: { label: 'Picked Up', color: 'bg-blue-100 text-blue-700', icon: Truck },
    processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: RefreshCcw },
    quality_check: { label: 'Quality Check', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
    ready: { label: 'Ready', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-cyan-100 text-cyan-700', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.reference_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone?.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') {
        matchesDate = orderDate >= today;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = orderDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate stats
  const stats = {
    total: filteredOrders.length,
    revenue: filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total) || parseFloat(o.total_amount) || 0), 0),
    pending: filteredOrders.filter(o => ['pending_pickup', 'picked_up'].includes(o.status)).length,
    completed: filteredOrders.filter(o => o.status === 'delivered').length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  // Handle status change
  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export orders
  const exportOrders = () => {
    const csv = [
      ['Order ID', 'Reference', 'Customer', 'Email', 'Phone', 'Status', 'Total', 'Date'].join(','),
      ...filteredOrders.map(o => [
        o.id,
        o.reference_code,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.status,
        o.total?.toFixed(2),
        new Date(o.created_at).toISOString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Order Management</h1>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportOrders} className="btn-secondary">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={fetchOrders} className="btn-primary" disabled={loading}>
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amani-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-amani-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">${stats.revenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusConfig).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field md:w-40"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending_pickup;
                const StatusIcon = status.icon;
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amani-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-amani-600" />
                        </div>
                        <div>
                          <p className="font-mono font-semibold text-navy-900">{order.reference_code}</p>
                          <p className="text-xs text-gray-500">{order.service_type || 'Standard'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-navy-900">
                        {order.customer_name || (order.user ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() : 'Guest')}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600">{order.customer_email || order.user?.email || '-'}</p>
                      <p className="text-xs text-gray-500">{order.customer_phone || order.user?.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${status.color}`}
                      >
                        {Object.entries(statusConfig).map(([value, { label }]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-navy-900">{order.item_count || order.items?.length || 0}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-navy-900">${order.total?.toFixed(2) || '0.00'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(order)}
                          className="p-2 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-navy-900 mb-1">No orders found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ordersPerPage + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      page === currentPage ? 'bg-amani-500 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-navy-900">Order Details</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedOrder.reference_code}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Update */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusConfig).map(([value, config]) => {
                      const Icon = config.icon;
                      const isActive = selectedOrder.status === value;
                      return (
                        <button
                          key={value}
                          onClick={() => handleStatusChange(selectedOrder.id, value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                            isActive ? `${config.color} border-current` : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-navy-900 mb-3">Customer</h3>
                    <p className="font-medium">
                      {selectedOrder.customer_name || 
                       (selectedOrder.user ? `${selectedOrder.user.first_name || ''} ${selectedOrder.user.last_name || ''}`.trim() : '') ||
                       'Guest Customer'}
                    </p>
                    <p className="text-sm text-gray-600">{selectedOrder.customer_email || selectedOrder.user?.email || 'No email'}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.customer_phone || selectedOrder.user?.phone || 'No phone'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-navy-900 mb-3">Address</h3>
                    <p className="text-sm text-gray-600">
                      {formatAddress(selectedOrder.delivery_address) || formatAddress(selectedOrder.pickup_address) || formatAddress(selectedOrder.address) || 'No address provided'}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold text-navy-900 mb-3">Items</h3>
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                    {(selectedOrder.items && selectedOrder.items.length > 0) ? (
                      selectedOrder.items.map((item, idx) => {
                        const price = Number(item.unit_price) || Number(item.price) || Number(item.total_price / item.quantity) || 0;
                        const qty = Number(item.quantity) || 1;
                        return (
                          <div key={idx} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <Shirt className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-medium">{item.name || item.service_name || `Service Item`}</p>
                                <p className="text-sm text-gray-500">Qty: {qty} × ${price.toFixed(2)}</p>
                              </div>
                            </div>
                            <p className="font-semibold">${(price * qty).toFixed(2)}</p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No items recorded for this order
                      </div>
                    )}
                    <div className="flex items-center justify-between p-4 bg-gray-50">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-amani-600">${(Number(selectedOrder.total) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Timeline */}
                <div>
                  <h3 className="font-semibold text-navy-900 mb-3">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    {selectedOrder.updated_at && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{formatDate(selectedOrder.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setEditingOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="btn-secondary"
                >
                  <Edit className="w-4 h-4" />
                  Edit Order
                </button>
                <button onClick={() => setSelectedOrder(null)} className="btn-secondary">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Edit Modal */}
      <AnimatePresence>
        {editingOrder && (
          <OrderEditModal
            order={editingOrder}
            onClose={() => setEditingOrder(null)}
            onSave={() => {
              setEditingOrder(null);
              fetchOrders();
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-2">Delete Order?</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete order <span className="font-mono font-bold">{showDeleteConfirm.reference_code}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 btn-secondary">Cancel</button>
                  <button
                    onClick={() => {
                      // Handle delete
                      setShowDeleteConfirm(null);
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700"
                  >
                    Delete
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

export default AdminOrders;
