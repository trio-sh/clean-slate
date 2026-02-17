import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, Plus, Trash2, DollarSign, Package,
  AlertCircle, FileText, Receipt, Mail, MessageSquare,
  Send, Calculator, Percent, Download
} from 'lucide-react';
import db from '../lib/db';
import { downloadInvoice, downloadReceipt, sendEmail, emailTemplates, sendSMS, smsTemplates } from '../lib/utils';
import toast from 'react-hot-toast';

const OrderEditModal = ({ order, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [editedItems, setEditedItems] = useState([]);
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit_price: 0,
  });
  const [services, setServices] = useState([]);
  
  // Tax rate (HST for Ontario)
  const TAX_RATE = 0.13;

  useEffect(() => {
    if (order) {
      // Initialize with existing items
      const items = (order.items || []).map(item => ({
        id: item.id,
        name: item.name || item.service_name || 'Service',
        quantity: item.quantity || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        original_price: parseFloat(item.unit_price) || 0,
        total_price: parseFloat(item.total_price) || (item.unit_price * item.quantity) || 0,
        isModified: false,
        isNew: false,
      }));
      setEditedItems(items);
      
      // Load services for add item dropdown
      loadServices();
    }
  }, [order]);

  const loadServices = async () => {
    try {
      const allServices = await db.getAll('services');
      setServices(allServices);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return editedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * TAX_RATE;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const discount = parseFloat(order.discount_amount) || 0;
    return subtotal + tax - discount;
  };

  // Check if any changes were made
  const hasChanges = () => {
    const originalItemsCount = (order.items || []).length;
    if (editedItems.length !== originalItemsCount) return true;
    return editedItems.some(item => item.isModified || item.isNew);
  };

  // Item handlers
  const handleItemChange = (index, field, value) => {
    setEditedItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0,
        isModified: true,
      };
      // Recalculate total
      updated[index].total_price = updated[index].quantity * updated[index].unit_price;
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setEditedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!newItem.name || newItem.unit_price <= 0) {
      toast.error('Please enter item name and price');
      return;
    }

    setEditedItems(prev => [...prev, {
      id: `new-${Date.now()}`,
      name: newItem.name,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total_price: newItem.quantity * newItem.unit_price,
      isNew: true,
      isModified: true,
    }]);

    setNewItem({ name: '', quantity: 1, unit_price: 0 });
    setShowAddItem(false);
    toast.success('Item added');
  };

  const handleSelectService = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setNewItem({
        name: service.name,
        quantity: 1,
        unit_price: parseFloat(service.base_price) || 0,
      });
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!adjustmentNote.trim() && hasChanges()) {
      toast.error('Please add a note explaining the price adjustment');
      return;
    }

    setLoading(true);
    try {
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotal();

      // Update order
      const orderUpdates = {
        subtotal: subtotal,
        tax: tax,
        total: total,
        staff_notes: order.staff_notes 
          ? `${order.staff_notes}\n\n[${new Date().toLocaleString()}] Price Adjustment: ${adjustmentNote}`
          : `[${new Date().toLocaleString()}] Price Adjustment: ${adjustmentNote}`,
        updated_at: new Date().toISOString(),
      };

      await db.update('orders', order.id, orderUpdates);

      // Update order items
      for (const item of editedItems) {
        if (item.isNew) {
          // Create new order item
          await db.create('order_items', {
            order_id: order.id,
            service_id: null,
            service_name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          });
        } else if (item.isModified) {
          // Update existing item
          await db.update('order_items', item.id, {
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          });
        }
      }

      // Delete removed items
      const originalItemIds = (order.items || []).map(i => i.id);
      const currentItemIds = editedItems.filter(i => !i.isNew).map(i => i.id);
      const deletedIds = originalItemIds.filter(id => !currentItemIds.includes(id));
      
      for (const deletedId of deletedIds) {
        await db.delete('order_items', deletedId);
      }

      toast.success('Order updated successfully!');
      
      if (onSave) {
        onSave({
          ...order,
          ...orderUpdates,
          items: editedItems,
        });
      }
      
      onClose();
    } catch (err) {
      console.error('Failed to save order:', err);
      toast.error('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  // Generate documents
  const handleGenerateInvoice = async () => {
    try {
      const updatedOrder = {
        ...order,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        items: editedItems,
      };
      await downloadInvoice(updatedOrder);
      toast.success('Invoice generated!');
    } catch (err) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleGenerateReceipt = async () => {
    try {
      const updatedOrder = {
        ...order,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        items: editedItems,
      };
      await downloadReceipt(updatedOrder);
      toast.success('Receipt generated!');
    } catch (err) {
      toast.error('Failed to generate receipt');
    }
  };

  // Send updated invoice to customer
  const handleSendInvoice = async (method) => {
    try {
      if (method === 'email' && order.customer_email) {
        const template = emailTemplates.invoiceEmail(order, `${window.location.origin}/track/${order.reference_code}`);
        await sendEmail(order.customer_email, template.subject, template.html);
        toast.success('Invoice sent via email!');
      } else if (method === 'sms' && order.customer_phone) {
        const message = `Amani's Cleaners: Your updated invoice for order #${order.reference_code} is ready. Total: $${calculateTotal().toFixed(2)}. Track at: ${window.location.origin}/track/${order.reference_code}`;
        await sendSMS(order.customer_phone, message);
        toast.success('Invoice notification sent via SMS!');
      } else {
        toast.error(`No ${method === 'email' ? 'email' : 'phone'} available for customer`);
      }
    } catch (err) {
      toast.error(`Failed to send via ${method}`);
    }
  };

  if (!order) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-amani-500" />
                Edit Order #{order.reference_code}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Customer: {order.customer_name || 'Guest'} • {order.customer_phone || 'No phone'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Items Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy-900">Order Items</h3>
              <button
                onClick={() => setShowAddItem(true)}
                className="btn-secondary text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Item</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700 w-20">Qty</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700 w-28">Unit Price</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700 w-28">Total</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {editedItems.map((item, idx) => (
                    <tr key={item.id} className={`${item.isModified ? 'bg-amber-50' : 'bg-white'}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {item.isNew && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">NEW</span>
                          )}
                          {item.isModified && !item.isNew && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">EDITED</span>
                          )}
                          <span className="text-sm text-navy-900">{item.name}</span>
                        </div>
                        {item.original_price && item.original_price !== item.unit_price && (
                          <p className="text-xs text-gray-400 mt-1 line-through">
                            Original: ${item.original_price.toFixed(2)}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-16 text-center p-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            className="w-20 text-right p-1 border border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-navy-900">
                        ${item.total_price.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 hover:bg-red-50 rounded text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {editedItems.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No items in this order
                </div>
              )}
            </div>
          </div>

          {/* Add Item Form */}
          <AnimatePresence>
            {showAddItem && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
              >
                <h4 className="font-medium text-navy-900 mb-3">Add New Item</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Service/Item</label>
                    <select
                      onChange={(e) => handleSelectService(e.target.value)}
                      className="input-field text-sm mb-2"
                    >
                      <option value="">Select a service...</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} - ${parseFloat(s.base_price).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter custom item name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItem.unit_price}
                      onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowAddItem(false)}
                    className="btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItem}
                    className="btn-primary text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">HST (13%)</span>
                <span className="font-medium">${calculateTax().toFixed(2)}</span>
              </div>
              {(order.discount_amount > 0) && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${parseFloat(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-amani-600">${calculateTotal().toFixed(2)}</span>
              </div>
              {hasChanges() && order.total && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Original Total</span>
                  <span className="line-through">${parseFloat(order.total).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Adjustment Note */}
          {hasChanges() && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertCircle className="w-4 h-4 inline mr-1 text-amber-500" />
                Reason for Price Adjustment *
              </label>
              <textarea
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder="e.g., Customer brought 3 silk blouses instead of regular blouses as selected online"
                className="input-field min-h-[80px]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This note will be saved to the order history for reference
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-navy-900 mb-3">Generate Documents</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleGenerateInvoice}
                className="btn-secondary text-sm"
              >
                <FileText className="w-4 h-4" />
                Download Invoice
              </button>
              <button
                onClick={handleGenerateReceipt}
                className="btn-secondary text-sm"
              >
                <Receipt className="w-4 h-4" />
                Download Receipt
              </button>
              <button
                onClick={() => handleSendInvoice('email')}
                className="btn-secondary text-sm"
                disabled={!order.customer_email}
              >
                <Mail className="w-4 h-4" />
                Email Invoice
              </button>
              <button
                onClick={() => handleSendInvoice('sms')}
                className="btn-secondary text-sm"
                disabled={!order.customer_phone}
              >
                <MessageSquare className="w-4 h-4" />
                SMS Invoice Link
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {hasChanges() ? (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </span>
            ) : (
              'No changes made'
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || (!hasChanges())}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OrderEditModal;
