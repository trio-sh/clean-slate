import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Search, Clock, CheckCircle, RefreshCcw,
  Truck, X, Phone, MapPin, ChevronRight, Loader2, Filter,
  FileText, Edit, Plus, Minus
} from 'lucide-react';
import db from '../../lib/db';
import { useAuthStore } from '../../stores';
import toast from 'react-hot-toast';

const statusConfig = {
  pending_pickup:    { label: 'Pending Pickup',    color: 'bg-amber-100 text-amber-700',   icon: Clock },
  picked_up:         { label: 'Picked Up',          color: 'bg-blue-100 text-blue-700',     icon: Truck },
  processing:        { label: 'Processing',          color: 'bg-purple-100 text-purple-700', icon: RefreshCcw },
  quality_check:     { label: 'Quality Check',       color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  ready:             { label: 'Ready',               color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  out_for_delivery:  { label: 'Out for Delivery',    color: 'bg-cyan-100 text-cyan-700',    icon: Truck },
  delivered:         { label: 'Delivered',           color: 'bg-green-100 text-green-700',  icon: CheckCircle },
};

// Partner's workflow: received at depot → processing → ready
const partnerFlow = ['picked_up', 'processing', 'quality_check', 'ready'];

const getNextStatus = (status) => {
  const idx = partnerFlow.indexOf(status);
  return idx >= 0 && idx < partnerFlow.length - 1 ? partnerFlow[idx + 1] : null;
};

const PartnerOrders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [orderInvoices, setOrderInvoices] = useState({});

  useEffect(() => { loadOrders(); }, [user]);

  const loadOrders = async () => {
    try {
      if (!user?.depot_id) { setLoading(false); return; }
      const data = await db.getOrdersByDepot(user.depot_id);
      setOrders(data);

      // Load invoices for orders
      const invoiceMap = {};
      for (const order of data) {
        const invoices = await db.query('partner_invoices', { order_id: order.id });
        if (invoices.length > 0) {
          invoiceMap[order.id] = invoices[0];
        }
      }
      setOrderInvoices(invoiceMap);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await db.update('orders', orderId, { status: newStatus });
      toast.success(`Order moved to ${statusConfig[newStatus]?.label}`);
      await loadOrders();
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEditOrder = async (updatedOrder) => {
    try {
      // Calculate new total from items
      const subtotal = updatedOrder.items.reduce((sum, item) => {
        return sum + (Number(item.unit_price) * Number(item.quantity));
      }, 0);

      const total = subtotal;

      await db.update('orders', updatedOrder.id, {
        items: updatedOrder.items,
        special_instructions: updatedOrder.special_instructions,
        total: total
      });

      toast.success('Order updated successfully');
      setShowEditModal(false);
      setEditingOrder(null);
      await loadOrders();

      // Update selected order if it's open
      if (selectedOrder?.id === updatedOrder.id) {
        setSelectedOrder({ ...updatedOrder, total });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order');
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const handleGenerateInvoice = async (order) => {
    try {
      // Check if invoice already exists
      if (orderInvoices[order.id]) {
        toast.error('Invoice already exists for this order');
        return;
      }

      // Calculate subtotal
      const subtotal = order.items?.reduce((sum, item) => {
        return sum + (Number(item.total_price || item.unit_price * item.quantity || 0));
      }, 0) || Number(order.total || 0);

      // Calculate tax (13%)
      const tax = subtotal * 0.13;
      const total = subtotal + tax;

      const invoiceData = {
        invoice_number: generateInvoiceNumber(),
        order_id: order.id,
        partner_id: user.depot_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.delivery_address || order.pickup_address,
        items: order.items || [],
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'draft',
        created_at: new Date().toISOString()
      };

      const invoiceId = await db.create('partner_invoices', invoiceData);
      toast.success('Invoice generated successfully');

      // Reload orders to update invoice indicators
      await loadOrders();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate invoice');
    }
  };

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      o.reference_code?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.includes(searchQuery);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        {[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-xl mb-3" />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 mb-1">Depot Orders</h1>
        <p className="text-gray-500">{orders.length} orders at your depot</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, customer, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent text-sm bg-white appearance-none"
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusConfig).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3" />
          <p>No orders match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = statusConfig[order.status] || statusConfig.pending_pickup;
            const Icon = cfg.icon;
            const nextStatus = getNextStatus(order.status);
            const hasInvoice = orderInvoices[order.id];

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 ${cfg.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-navy-900">#{order.reference_code}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {hasInvoice && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Invoice
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{order.customer_name} · {order.pickup_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {nextStatus && (
                      <button
                        onClick={() => handleStatusChange(order.id, nextStatus)}
                        disabled={updatingStatus}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amani-500 text-white rounded-lg text-sm font-medium hover:bg-amani-600 transition-colors disabled:opacity-60"
                      >
                        {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {statusConfig[nextStatus]?.label}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-navy-900">Order #{selectedOrder.reference_code}</h2>
                    {orderInvoices[selectedOrder.id] && (
                      <button
                        onClick={() => {
                          const invoice = orderInvoices[selectedOrder.id];
                          toast.success(`Invoice: ${invoice.invoice_number}`);
                        }}
                        className="p-1 hover:bg-green-50 rounded-lg transition-colors"
                        title="View Invoice"
                      >
                        <FileText className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{selectedOrder.pickup_date}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Status flow */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {partnerFlow.map(status => {
                      const cfg = statusConfig[status];
                      const Icon = cfg.icon;
                      const isActive = selectedOrder.status === status;
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(selectedOrder.id, status)}
                          disabled={updatingStatus}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                            isActive ? `${cfg.color} border-current font-medium` : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Customer */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <p className="font-semibold text-navy-900 mb-2">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" />{selectedOrder.customer_phone || 'No phone'}</div>
                  <div className="flex items-start gap-2 text-gray-600"><MapPin className="w-4 h-4 mt-0.5" />{selectedOrder.pickup_address || selectedOrder.delivery_address || 'No address'}</div>
                </div>

                {/* Items */}
                {selectedOrder.items?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-navy-900 text-sm">Items</p>
                      <button
                        onClick={() => {
                          setEditingOrder({ ...selectedOrder });
                          setShowEditModal(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-amani-600 hover:bg-amani-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                    <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 text-sm">
                          <span className="text-gray-700">{item.name || item.service_name} × {item.quantity}</span>
                          <span className="font-medium">${Number(item.total_price || item.unit_price * item.quantity || 0).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 bg-gray-50 font-semibold text-sm">
                        <span>Total</span>
                        <span className="text-amani-600">${Number(selectedOrder.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedOrder.customer_notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                    <p className="font-medium mb-1">Customer Notes</p>
                    <p>{selectedOrder.customer_notes}</p>
                  </div>
                )}

                {selectedOrder.special_instructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                    <p className="font-medium mb-1">Special Instructions</p>
                    <p>{selectedOrder.special_instructions}</p>
                  </div>
                )}

                {/* Invoice Details */}
                {orderInvoices[selectedOrder.id] && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <p className="font-semibold text-green-900">Invoice Generated</p>
                    </div>
                    <div className="space-y-1 text-green-800">
                      <p><span className="font-medium">Number:</span> {orderInvoices[selectedOrder.id].invoice_number}</p>
                      <p><span className="font-medium">Subtotal:</span> ${Number(orderInvoices[selectedOrder.id].subtotal).toFixed(2)}</p>
                      <p><span className="font-medium">Tax (13%):</span> ${Number(orderInvoices[selectedOrder.id].tax).toFixed(2)}</p>
                      <p><span className="font-medium">Total:</span> ${Number(orderInvoices[selectedOrder.id].total).toFixed(2)}</p>
                      <p><span className="font-medium">Status:</span> <span className="capitalize">{orderInvoices[selectedOrder.id].status}</span></p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 flex justify-end gap-3">
                {/* Generate Invoice Button */}
                {(selectedOrder.status === 'ready' || selectedOrder.status === 'delivered') && !orderInvoices[selectedOrder.id] && (
                  <button
                    onClick={() => handleGenerateInvoice(selectedOrder)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Generate Invoice
                  </button>
                )}

                {getNextStatus(selectedOrder.status) && (
                  <button
                    onClick={() => { handleStatusChange(selectedOrder.id, getNextStatus(selectedOrder.status)); }}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-amani-500 text-white rounded-lg font-medium hover:bg-amani-600 transition-colors text-sm flex items-center gap-2 disabled:opacity-60"
                  >
                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Move to {statusConfig[getNextStatus(selectedOrder.status)]?.label}
                  </button>
                )}
                <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {showEditModal && editingOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-navy-900">Edit Order #{editingOrder.reference_code}</h2>
                  <p className="text-sm text-gray-500">Update items, quantities, pricing, and instructions</p>
                </div>
                <button onClick={() => { setShowEditModal(false); setEditingOrder(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Items Editor */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-navy-900 text-sm">Order Items</p>
                    <button
                      onClick={() => {
                        setEditingOrder({
                          ...editingOrder,
                          items: [...(editingOrder.items || []), { name: '', quantity: 1, unit_price: 0 }]
                        });
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-amani-600 hover:bg-amani-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editingOrder.items?.map((item, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              placeholder="Item name"
                              value={item.name || item.service_name || ''}
                              onChange={(e) => {
                                const newItems = [...editingOrder.items];
                                newItems[i] = { ...newItems[i], name: e.target.value };
                                setEditingOrder({ ...editingOrder, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Quantity</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity || 1}
                                  onChange={(e) => {
                                    const newItems = [...editingOrder.items];
                                    newItems[i] = { ...newItems[i], quantity: parseInt(e.target.value) || 1 };
                                    setEditingOrder({ ...editingOrder, items: newItems });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Price/Unit ($)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unit_price || 0}
                                  onChange={(e) => {
                                    const newItems = [...editingOrder.items];
                                    newItems[i] = { ...newItems[i], unit_price: parseFloat(e.target.value) || 0 };
                                    setEditingOrder({ ...editingOrder, items: newItems });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Item Total:</span>
                              <span className="font-semibold text-navy-900">
                                ${((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const newItems = editingOrder.items.filter((_, idx) => idx !== i);
                              setEditingOrder({ ...editingOrder, items: newItems });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-base font-bold">
                      <span>Order Total:</span>
                      <span className="text-amani-600">
                        ${editingOrder.items?.reduce((sum, item) => sum + ((item.unit_price || 0) * (item.quantity || 1)), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="text-sm font-semibold text-navy-900 mb-2 block">Special Instructions</label>
                  <textarea
                    value={editingOrder.special_instructions || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, special_instructions: e.target.value })}
                    placeholder="Add any special instructions for this order..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amani-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="px-6 pb-6 flex justify-end gap-3">
                <button
                  onClick={() => { setShowEditModal(false); setEditingOrder(null); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditOrder(editingOrder)}
                  className="px-4 py-2 bg-amani-500 text-white rounded-lg font-medium hover:bg-amani-600 transition-colors text-sm flex items-center gap-2"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerOrders;
