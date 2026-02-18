import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

import {
  Package, Search, Filter, Eye, Clock, CheckCircle,
  XCircle, Truck, RefreshCcw, ChevronLeft, ChevronRight,
  Calendar, MapPin, Phone, AlertTriangle, Shirt,
  FileText, Download, Receipt, Mail, MessageSquare, Edit,
  Building2, Loader2
} from 'lucide-react';
import { useOrderStore, useAppStore } from '../../stores';
import { downloadInvoice, downloadReceipt, sendEmail, emailTemplates, formatAddress } from '../../lib/utils';
import SMSComposerModal from '../../components/SMSComposerModal';
import OrderEditModal from '../../components/OrderEditModal';
import toast from 'react-hot-toast';
import db from '../../lib/db';

const StaffOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsRecipient, setSmsRecipient] = useState(null);
  const [depots, setDepots] = useState([]);
  const [assigningDepot, setAssigningDepot] = useState(false);
  const ordersPerPage = 10;

  const { orders, fetchOrders, updateOrderStatus, loading } = useOrderStore();
  const { mode } = useAppStore();

  useEffect(() => {
    fetchOrders();
    db.getDepots(true).then(setDepots).catch(() => {});
  }, [fetchOrders]);

  const handleAssignDepot = async (orderId, depotId) => {
    setAssigningDepot(true);
    try {
      await db.assignOrderToDepot(orderId, depotId);
      toast.success('Depot assigned');
      fetchOrders();
      setSelectedOrder(prev => prev ? { ...prev, depot_id: depotId } : prev);
    } catch {
      toast.error('Failed to assign depot');
    } finally {
      setAssigningDepot(false);
    }
  };

  // Status configuration
  const statusConfig = {
    pending_pickup: { label: 'Pending Pickup', color: 'bg-amber-100 text-amber-700', icon: Clock },
    picked_up: { label: 'Picked Up', color: 'bg-blue-100 text-blue-700', icon: Truck },
    processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: RefreshCcw },
    ready: { label: 'Ready', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.reference_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get next status
  const getNextStatus = (currentStatus) => {
    const flow = ['pending_pickup', 'picked_up', 'processing', 'ready', 'out_for_delivery', 'delivered'];
    const currentIndex = flow.indexOf(currentStatus);
    return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Order Management</h1>
          <p className="text-gray-600">View and manage all customer orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn-secondary"
          disabled={loading}
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference, name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
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

          {/* Date Filter */}
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

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {['pending_pickup', 'processing', 'ready'].map(status => {
            const config = statusConfig[status];
            const count = orders.filter(o => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  statusFilter === status 
                    ? config.color 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending_pickup;
                const StatusIcon = status.icon;
                
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amani-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-amani-600" />
                        </div>
                        <div>
                          <p className="font-mono font-semibold text-navy-900">
                            {order.reference_code}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.service_type || 'Standard'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-navy-900">
                        {order.customer_name || order.user?.first_name ? `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim() : 'Guest Customer'}
                      </p>
                      <p className="text-sm text-gray-500">{order.customer_phone || order.user?.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-navy-900">{order.item_count || order.items?.length || 0} items</p>
                      <p className="text-xs text-gray-500">{order.weight ? `${order.weight} lbs` : '-'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-navy-900">${order.total?.toFixed(2) || '0.00'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => handleStatusChange(order.id, getNextStatus(order.status))}
                            className="px-3 py-1.5 bg-amani-50 text-amani-600 rounded-lg text-sm font-medium hover:bg-amani-100 transition-colors"
                          >
                            Next Step
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-navy-900 mb-1">No orders found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ordersPerPage + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, currentPage - 2),
                Math.min(totalPages, currentPage + 1)
              ).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-amani-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-navy-900">
                    Order #{selectedOrder.reference_code}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Created {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="font-semibold text-navy-900 mb-3">Order Status</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([value, config]) => {
                    const Icon = config.icon;
                    const isActive = selectedOrder.status === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleStatusChange(selectedOrder.id, value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          isActive
                            ? `${config.color} border-current`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Depot Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amani-500" />
                  Assigned Depot
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedOrder.depot_id || ''}
                    onChange={e => handleAssignDepot(selectedOrder.id, e.target.value)}
                    disabled={assigningDepot}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent text-sm"
                  >
                    <option value="">No depot assigned</option>
                    {depots.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.city} ({d.capacity_per_day || '?'} lbs/day)
                      </option>
                    ))}
                  </select>
                  {assigningDepot && <Loader2 className="w-5 h-5 animate-spin text-amani-500 self-center" />}
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-navy-900 mb-3">Customer Information</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amani-100 rounded-full flex items-center justify-center text-amani-600 font-semibold">
                      {(selectedOrder.customer_name || selectedOrder.user?.first_name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-navy-900">
                        {selectedOrder.customer_name || 
                         (selectedOrder.user ? `${selectedOrder.user.first_name || ''} ${selectedOrder.user.last_name || ''}`.trim() : '') ||
                         'Guest Customer'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedOrder.customer_email || selectedOrder.user?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.customer_phone || selectedOrder.user?.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{formatAddress(selectedOrder.delivery_address) || formatAddress(selectedOrder.pickup_address) || formatAddress(selectedOrder.address) || 'No address provided'}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-navy-900 mb-3">Order Items</h3>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {(selectedOrder.items || []).map((item, index) => {
                    const price = Number(item.unit_price) || Number(item.price) || 0;
                    const qty = Number(item.quantity) || 1;
                    return (
                      <div key={index} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Shirt className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-navy-900">{item.name || item.service_name || 'Service Item'}</p>
                            <p className="text-sm text-gray-500">Qty: {qty} × ${price.toFixed(2)}</p>
                          </div>
                        </div>
                        <p className="font-semibold">${(price * qty).toFixed(2)}</p>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between p-4 bg-gray-50">
                    <span className="font-semibold text-navy-900">Total</span>
                    <span className="text-xl font-bold text-amani-600">
                      ${(Number(selectedOrder.total) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold text-navy-900 mb-3">Order Notes</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <p className="text-sm text-amber-800">{selectedOrder.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              {/* Action Buttons Row */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => {
                    downloadInvoice(selectedOrder);
                    toast.success('Invoice downloading...');
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  <FileText className="w-4 h-4" />
                  Invoice
                </button>
                <button
                  onClick={() => {
                    downloadReceipt(selectedOrder);
                    toast.success('Receipt downloading...');
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  <Receipt className="w-4 h-4" />
                  Receipt
                </button>
                {selectedOrder.customer_phone && (
                  <button
                    onClick={() => {
                      setSmsRecipient({
                        phone: selectedOrder.customer_phone,
                        name: selectedOrder.customer_name,
                        email: selectedOrder.customer_email
                      });
                      setShowSMSModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send SMS
                  </button>
                )}
                {selectedOrder.customer_email && (
                  <button
                    onClick={async () => {
                      const template = emailTemplates.orderConfirmation(selectedOrder);
                      await sendEmail(selectedOrder.customer_email, template.subject, template.html);
                      toast.success('Email notification sent!');
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </button>
                )}
              </div>
              
              {/* Main Actions Row */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="btn-secondary"
                >
                  <Edit className="w-4 h-4" />
                  Edit Prices
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
                {getNextStatus(selectedOrder.status) && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedOrder.id, getNextStatus(selectedOrder.status));
                    }}
                    className="btn-primary"
                  >
                    Move to {statusConfig[getNextStatus(selectedOrder.status)]?.label}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

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

      {/* SMS Composer Modal */}
      <SMSComposerModal
        isOpen={showSMSModal}
        onClose={() => {
          setShowSMSModal(false);
          setSmsRecipient(null);
        }}
        recipients={smsRecipient ? [smsRecipient] : []}
        order={selectedOrder}
      />
    </div>
  );
};

export default StaffOrders;
