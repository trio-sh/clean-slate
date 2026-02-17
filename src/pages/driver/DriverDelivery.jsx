import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';

import { 
  ArrowLeft, MapPin, Phone, Navigation, Package, 
  Camera, CheckCircle, AlertCircle, Clock, User,
  MessageSquare, Copy, ExternalLink, Truck, DollarSign,
  Shirt, Send
} from 'lucide-react';
import db from '../../lib/db';
import { sendSMS, smsTemplates, formatAddress } from '../../lib/utils';
import { useAuthStore } from '../../stores';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const DriverDelivery = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [notes, setNotes] = useState('');
  const [taskType, setTaskType] = useState('delivery'); // 'pickup' or 'delivery'

  useEffect(() => {
    loadOrderData();
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      // Get order with items
      const orders = await db.getOrdersWithDetails();
      const orderData = orders.find(o => o.id === orderId);
      
      if (!orderData) {
        toast.error('Order not found');
        navigate('/driver');
        return;
      }
      
      // Determine task type based on status
      if (['pending_pickup'].includes(orderData.status)) {
        setTaskType('pickup');
      } else {
        setTaskType('delivery');
      }
      
      setOrder(orderData);
    } catch (err) {
      console.error('Failed to load order:', err);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const updates = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };
      
      if (notes) {
        updates.driver_notes = notes;
      }
      
      if (newStatus === 'picked_up') {
        updates.picked_up_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }
      
      await db.update('orders', orderId, updates);
      
      toast.success(`Order marked as ${newStatus.replace('_', ' ')}`);
      navigate('/driver');
    } catch (err) {
      console.error('Failed to update order:', err);
      toast.error('Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const openNavigation = (address) => {
    if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
    } else {
      toast.error('No address available');
    }
  };

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const handleNotifyCustomer = async (type) => {
    if (!order.customer_phone) {
      toast.error('No customer phone number available');
      return;
    }
    
    setSendingSMS(true);
    try {
      const driverName = user?.first_name || 'Your driver';
      let message;
      
      if (type === 'on_way') {
        message = smsTemplates.outForDelivery(order.reference_code, driverName);
      } else if (type === 'arriving') {
        message = `${driverName} from Amani's Cleaners will arrive in about 5 minutes with your order #${order.reference_code}. Please be ready! 🚗`;
      } else if (type === 'pickup_reminder') {
        message = smsTemplates.pickupReminder(order.reference_code, order.pickup_time_slot || 'today');
      }
      
      const result = await sendSMS(order.customer_phone, message);
      
      if (result.success) {
        toast.success('Customer notified!');
      } else {
        toast.error(result.error || 'Failed to send SMS');
      }
    } catch (err) {
      console.error('SMS error:', err);
      toast.error('Failed to send notification');
    } finally {
      setSendingSMS(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-amani-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Order not found</p>
        <button onClick={() => navigate('/driver')} className="mt-4 btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const address = formatAddress(taskType === 'pickup' ? order.pickup_address : order.delivery_address);
  const timeSlot = taskType === 'pickup' ? order.pickup_time_slot : order.delivery_time_slot;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/driver')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-navy-900">
            {taskType === 'pickup' ? 'Pickup' : 'Delivery'} Details
          </h1>
          <p className="text-gray-500">Order #{order.reference_code}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
        taskType === 'pickup' ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
      }`}>
        {taskType === 'pickup' ? <Package className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
        <span className="font-medium capitalize">{taskType}</span>
        <span className="mx-2">•</span>
        <span className={`px-2 py-0.5 rounded text-sm ${getStatusColor(order.status)}`}>
          {order.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Customer Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-navy-900 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Customer Information
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-lg font-semibold text-navy-900">{order.customer_name || 'Customer'}</p>
            {order.customer_email && (
              <p className="text-sm text-gray-500">{order.customer_email}</p>
            )}
          </div>
          
          {order.customer_phone ? (
            <>
              <a 
                href={`tel:${order.customer_phone}`}
                className="flex items-center gap-3 p-3 bg-green-50 rounded-xl text-green-700 hover:bg-green-100 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">{order.customer_phone}</span>
                <span className="ml-auto text-sm">Tap to call</span>
              </a>
              
              {/* Quick SMS Notifications */}
              <div className="flex gap-2">
                {taskType === 'delivery' && ['ready', 'out_for_delivery'].includes(order.status) && (
                  <button
                    onClick={() => handleNotifyCustomer('on_way')}
                    disabled={sendingSMS}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {sendingSMS ? 'Sending...' : "Notify: On My Way"}
                    </span>
                  </button>
                )}
                {taskType === 'delivery' && order.status === 'out_for_delivery' && (
                  <button
                    onClick={() => handleNotifyCustomer('arriving')}
                    disabled={sendingSMS}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-purple-50 rounded-xl text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {sendingSMS ? 'Sending...' : "Notify: Arriving Soon"}
                    </span>
                  </button>
                )}
                {taskType === 'pickup' && order.status === 'pending_pickup' && (
                  <button
                    onClick={() => handleNotifyCustomer('pickup_reminder')}
                    disabled={sendingSMS}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {sendingSMS ? 'Sending...' : "Send Pickup Reminder"}
                    </span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-gray-500">
              <Phone className="w-5 h-5" />
              <span className="font-medium">No phone number available</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Address Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            {taskType === 'pickup' ? 'Pickup' : 'Delivery'} Address
          </h2>
        </div>
        <div className="p-4">
          <p className="text-navy-900 mb-4">{address || 'No address provided'}</p>
          
          <div className="flex gap-3">
            <button
              onClick={() => openNavigation(address)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              <Navigation className="w-5 h-5" />
              Navigate
            </button>
            <button
              onClick={() => copyAddress(address)}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              title="Copy Address"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Time Slot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-gray-200 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Time Window</p>
            <p className="text-lg font-semibold text-navy-900">{timeSlot || 'Not specified'}</p>
          </div>
        </div>
      </motion.div>

      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-navy-900 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-gray-400" />
              Order Items ({order.items.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-navy-900">{item.service_name || item.name || 'Item'}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">${((item.unit_price || 0) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 flex items-center justify-between">
            <span className="font-semibold text-navy-900">Total</span>
            <span className="text-xl font-bold text-amani-600">${(order.total || 0).toFixed(2)}</span>
          </div>
        </motion.div>
      )}

      {/* Customer Notes */}
      {order.customer_notes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Customer Notes</p>
              <p className="text-sm text-amber-700 mt-1">{order.customer_notes}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Driver Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-200 p-4"
      >
        <label className="block font-semibold text-navy-900 mb-2 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          Add Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any delivery notes..."
          className="w-full p-3 border border-gray-200 rounded-xl resize-none h-20 focus:ring-2 focus:ring-amani-500 focus:border-amani-500"
        />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="space-y-3 pb-6"
      >
        {order.status === 'pending_pickup' && taskType === 'pickup' && (
          <button
            onClick={() => handleUpdateStatus('picked_up')}
            disabled={updating}
            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updating ? (
              <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                Confirm Pickup Complete
              </>
            )}
          </button>
        )}
        
        {order.status === 'ready' && taskType === 'delivery' && (
          <button
            onClick={() => handleUpdateStatus('out_for_delivery')}
            disabled={updating}
            className="w-full py-4 bg-cyan-500 text-white rounded-2xl font-bold text-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updating ? (
              <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Truck className="w-6 h-6" />
                Start Delivery
              </>
            )}
          </button>
        )}
        
        {order.status === 'out_for_delivery' && (
          <button
            onClick={() => handleUpdateStatus('delivered')}
            disabled={updating}
            className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updating ? (
              <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                Confirm Delivery Complete
              </>
            )}
          </button>
        )}

        {/* Payment Info for Delivery */}
        {taskType === 'delivery' && order.payment_method === 'cash' && order.payment_status === 'pending' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Cash on Delivery</p>
                <p className="text-sm text-green-600">Collect ${(order.total || 0).toFixed(2)} from customer</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DriverDelivery;
