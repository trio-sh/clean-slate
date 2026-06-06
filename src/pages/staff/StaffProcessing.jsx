import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Package, CheckCircle, Clock, RefreshCw,
  Shirt, AlertTriangle, Timer, ChevronRight, X,
  PlayCircle, PauseCircle, CheckCircle2, Eye,
  Tag, MessageSquare, Camera, Printer, FileText
} from 'lucide-react';
import { useAuthStore } from '../../stores';
import db from '../../lib/db';
import { formatAddress } from '../../lib/utils';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';

const StaffProcessing = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all'); // all, washing, drying, pressing, ready
  const [processingNotes, setProcessingNotes] = useState('');

  useEffect(() => {
    loadOrders();
    // Auto refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const allOrders = await db.getOrdersWithDetails();
      const orderItems = await db.getAll('order_items');
      
      // Get orders that are in processing-related statuses
      const processingOrders = allOrders.filter(o => 
        ['picked_up', 'processing', 'quality_check', 'ready'].includes(o.status)
      );

      // Enrich with items
      const enriched = processingOrders.map(order => ({
        ...order,
        items: orderItems.filter(i => i.order_id === order.id),
        processingStage: order.processing_stage || 'washing',
        processingStarted: order.processing_started_at,
      })).sort((a, b) => {
        // Priority: processing > picked_up > ready
        const priority = { picked_up: 0, processing: 1, quality_check: 2, ready: 3 };
        return (priority[a.status] || 99) - (priority[b.status] || 99);
      });

      setOrders(enriched);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, notes = '') => {
    try {
      const updates = { 
        status: newStatus, 
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'processing') {
        updates.processing_started_at = new Date().toISOString();
      }
      if (newStatus === 'ready') {
        updates.ready_at = new Date().toISOString();
      }
      if (notes) {
        updates.processing_notes = notes;
      }

      await db.update('orders', orderId, updates);
      toast.success(`Order updated to ${newStatus}`);
      loadOrders();
      setSelectedOrder(null);
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  const handleStageUpdate = async (orderId, stage) => {
    try {
      await db.update('orders', orderId, { 
        processing_stage: stage, 
        updated_at: new Date().toISOString() 
      });
      toast.success(`Processing stage updated to ${stage}`);
      loadOrders();
    } catch (err) {
      toast.error('Failed to update stage');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      picked_up: 'bg-indigo-100 text-indigo-700',
      processing: 'bg-purple-100 text-purple-700',
      quality_check: 'bg-amber-100 text-amber-700',
      ready: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStageColor = (stage) => {
    const colors = {
      washing: 'bg-blue-100 text-blue-700',
      drying: 'bg-orange-100 text-orange-700',
      pressing: 'bg-purple-100 text-purple-700',
      folding: 'bg-green-100 text-green-700',
    };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  const getProcessingTime = (startTime) => {
    if (!startTime) return '--';
    const mins = differenceInMinutes(new Date(), parseISO(startTime));
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'ready') return o.status === 'ready';
    return o.status === 'processing' && o.processingStage === filter;
  });

  const stats = {
    total: orders.length,
    awaitingProcessing: orders.filter(o => o.status === 'picked_up').length,
    processing: orders.filter(o => o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-amani-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading processing queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Processing Queue</h1>
          <p className="text-gray-500">Manage orders through the cleaning process</p>
        </div>
        <button
          onClick={loadOrders}
          className="btn-secondary"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.awaitingProcessing}</p>
              <p className="text-sm text-gray-500">Awaiting Start</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.processing}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.ready}</p>
              <p className="text-sm text-gray-500">Ready</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Timer className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total in Queue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'washing', label: 'Washing' },
          { id: 'drying', label: 'Drying' },
          { id: 'pressing', label: 'Pressing' },
          { id: 'ready', label: 'Ready' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-amani-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Droplets className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No orders in this queue</h3>
            <p className="text-gray-400 mt-1">Orders will appear here when they're ready for processing</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold text-navy-900">#{order.reference_code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      {order.status === 'processing' && order.processingStage && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(order.processingStage)}`}>
                          {order.processingStage}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-medium text-navy-900">{order.customer_name || 'Customer'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Items</p>
                        <p className="font-medium text-navy-900">{order.items?.length || 0} items</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Received</p>
                        <p className="font-medium text-navy-900">{format(parseISO(order.created_at), 'MMM d, h:mm a')}</p>
                      </div>
                      {order.status === 'processing' && (
                        <div>
                          <p className="text-gray-500">Processing Time</p>
                          <p className="font-medium text-navy-900">{getProcessingTime(order.processingStarted)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'picked_up' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'processing')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Start Processing
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <>
                        <select
                          value={order.processingStage || 'washing'}
                          onChange={(e) => handleStageUpdate(order.id, e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="washing">Washing</option>
                          <option value="drying">Drying</option>
                          <option value="pressing">Pressing</option>
                          <option value="folding">Folding</option>
                        </select>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Ready
                        </button>
                      </>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg font-medium hover:bg-cyan-200 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        Send for Delivery
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items.slice(0, 4).map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        <Shirt className="w-3 h-3" />
                        {item.quantity}x {item.service_name || item.name || 'Item'}
                      </span>
                    ))}
                    {order.items.length > 4 && (
                      <span className="text-xs text-gray-500">+{order.items.length - 4} more</span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-display font-bold text-navy-900">
                      Order #{selectedOrder.reference_code}
                    </h2>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-navy-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{selectedOrder.customer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium">{selectedOrder.customer_phone || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Address</p>
                      <p className="font-medium">{formatAddress(selectedOrder.delivery_address) || formatAddress(selectedOrder.pickup_address) || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold text-navy-900 mb-3">Items ({selectedOrder.items?.length || 0})</h3>
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shirt className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{item.service_name || item.name || 'Service Item'}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium">${((item.unit_price || 0) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Processing Notes */}
                <div>
                  <h3 className="font-semibold text-navy-900 mb-3">Processing Notes</h3>
                  <textarea
                    value={processingNotes}
                    onChange={(e) => setProcessingNotes(e.target.value)}
                    placeholder="Add notes about this order (stains, special handling, etc.)"
                    className="w-full p-3 border border-gray-200 rounded-xl resize-none h-24"
                  />
                </div>

                {/* Reference Notes */}
                {selectedOrder.reference_notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-800">Reference Notes</p>
                        <p className="text-sm text-blue-700 mt-1 whitespace-pre-line">{selectedOrder.reference_notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Notes */}
                {selectedOrder.customer_notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-amber-800">Customer Notes</p>
                        <p className="text-sm text-amber-700 mt-1 whitespace-pre-line">{selectedOrder.customer_notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <button className="btn-secondary">
                    <Tag className="w-4 h-4" />
                    Print Label
                  </button>
                  <button className="btn-secondary">
                    <Camera className="w-4 h-4" />
                    Add Photo
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
                {selectedOrder.status === 'processing' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'ready', processingNotes)}
                    className="btn-primary"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Ready
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffProcessing;
