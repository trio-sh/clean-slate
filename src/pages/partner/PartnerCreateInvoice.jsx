import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Minus, Trash2, Search, Save, Download, Send,
  User, Mail, Phone, MapPin, DollarSign, Calendar, Package,
  AlertCircle, Check, X, Percent
} from 'lucide-react';
import db from '../../lib/db';
import { useAuthStore } from '../../stores';
import { downloadInvoice } from '../../lib/utils';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';

const PartnerCreateInvoice = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Form state
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Services state
  const [availableServices, setAvailableServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);

  // Invoice settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), // 7 days from now
    paymentTerms: '7', // days
    notes: '',
    discountPercent: 0,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);


  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    filterServices();
  }, [searchQuery, availableServices]);

  const loadData = async () => {
    try {
      if (!user?.depot_id) {
        toast.error('No depot assigned to your account');
        setLoading(false);
        return;
      }

      // Load partner's services
      const servicesData = await db.getPartnerServices(user.depot_id);
      const activeServices = servicesData.filter(s => s.is_active);
      setAvailableServices(activeServices);
      setFilteredServices(activeServices);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    if (!searchQuery.trim()) {
      setFilteredServices(availableServices);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = availableServices.filter(service =>
      service.name.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query) ||
      service.category?.toLowerCase().includes(query)
    );
    setFilteredServices(filtered);
  };

  const handleAddService = (service) => {
    // Check if service already added
    const existing = selectedServices.find(s => s.id === service.id);
    if (existing) {
      toast.error('Service already added. Adjust quantity instead.');
      return;
    }

    setSelectedServices([
      ...selectedServices,
      {
        id: service.id,
        name: service.name,
        description: service.description,
        unit_price: service.base_price || service.price || 0,
        quantity: 1,
        unit: service.price_type === 'per_lb' ? 'lb' : 'item',
      }
    ]);

    toast.success(`${service.name} added to invoice`);
    setShowServiceSelector(false);
    setSearchQuery('');
  };

  const handleUpdateQuantity = (serviceId, delta) => {
    setSelectedServices(selectedServices.map(service => {
      if (service.id === serviceId) {
        const newQuantity = Math.max(0.25, service.quantity + delta);
        return { ...service, quantity: newQuantity };
      }
      return service;
    }));
  };

  const handleRemoveService = (serviceId) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
    toast.success('Service removed from invoice');
  };

  const calculateTotals = () => {
    const subtotal = selectedServices.reduce((sum, service) => {
      return sum + (service.unit_price * service.quantity);
    }, 0);

    const discountAmount = subtotal * (invoiceSettings.discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.13; // 13% HST for Ontario
    const total = afterDiscount + tax;

    return {
      subtotal,
      discountAmount,
      tax,
      total,
    };
  };

  const validateForm = () => {
    if (!customerInfo.name.trim()) {
      toast.error('Customer name is required');
      return false;
    }

    if (selectedServices.length === 0) {
      toast.error('Please add at least one service to the invoice');
      return false;
    }

    return true;
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-PTR-${timestamp}-${random}`;
  };

  const handleSaveInvoice = async (action = 'draft') => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const totals = calculateTotals();
      const invoiceNumber = generateInvoiceNumber();

      const invoiceData = {
        invoice_number: invoiceNumber,
        depot_id: user.depot_id,
        partner_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
        partner_email: user.email || null,
        partner_phone: user.phone || null,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email || null,
        customer_phone: customerInfo.phone || null,
        customer_address: customerInfo.address || null,

        items: selectedServices.map(service => ({
          service_id: service.id,
          service_name: service.name,
          name: service.name,
          description: service.description,
          quantity: service.quantity,
          unit_price: service.unit_price,
          unit: service.unit,
          total_price: service.unit_price * service.quantity,
        })),

        subtotal: totals.subtotal,
        discount_percent: invoiceSettings.discountPercent,
        discount_amount: totals.discountAmount,
        tax: totals.tax,
        total: totals.total,

        issued_date: new Date().toISOString(),
        due_date: new Date(invoiceSettings.dueDate).toISOString(),
        payment_terms: parseInt(invoiceSettings.paymentTerms),
        notes: invoiceSettings.notes || null,

        status: action === 'draft' ? 'draft' : 'sent',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create invoice (IndexedDB)
      const result = await db.createInvoice(invoiceData);

      if (action === 'download') {
        // Generate and download PDF
        toast.success('Invoice created! Preparing PDF...');
        setTimeout(() => {
          handleDownloadPDF({ ...invoiceData, id: result.id });
        }, 500);
      } else if (action === 'send') {
        // Generate PDF and show SMS option
        toast.success('Invoice created! Preparing to send...');
        // TODO: Implement SMS sending
      } else {
        toast.success('Invoice saved as draft!');
      }

      // Navigate back to invoices page
      setTimeout(() => {
        navigate('/partner-portal/invoices');
      }, 1500);

    } catch (err) {
      console.error('Error creating invoice:', err);
      toast.error('Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const orderForPDF = {
        id: invoice.id,
        reference_code: invoice.invoice_number,
        customer_name: invoice.customer_name,
        customer_email: invoice.customer_email,
        customer_phone: invoice.customer_phone,
        delivery_address: invoice.customer_address,
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        discount_amount: invoice.discount_amount || 0,
        status: 'completed',
        payment_method: 'To be paid',
        created_at: invoice.issued_date || invoice.created_at,
        notes: invoice.notes,
        partner_name: invoice.partner_name,
        partner_email: invoice.partner_email,
        partner_phone: invoice.partner_phone,
      };

      await downloadInvoice(orderForPDF);
      toast.success('Invoice PDF downloaded!');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Failed to download PDF');
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amani-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-3">
              <FileText className="w-7 h-7 text-amani-500" />
              Create New Invoice
            </h1>
            <p className="text-gray-600 mt-1">Generate a manual invoice for your customers</p>
          </div>
          <button
            onClick={() => navigate('/partner-portal/invoices')}
            className="text-gray-600 hover:text-navy-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-amani-500" />
              Customer Information
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    placeholder="Enter customer name"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    placeholder="customer@email.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <textarea
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    placeholder="Customer address (optional)"
                    rows="2"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Invoice Items */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amani-500" />
                Invoice Items
              </h2>
              <button
                onClick={() => setShowServiceSelector(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amani-500 hover:bg-amani-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </button>
            </div>

            {selectedServices.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No services added yet</p>
                <p className="text-sm text-gray-400">Click "Add Service" to start building your invoice</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-lg p-4 flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-navy-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        ${service.unit_price.toFixed(2)} / {service.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2 py-1">
                        <button
                          onClick={() => handleUpdateQuantity(service.id, -0.25)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-16 text-center font-medium text-navy-900">
                          {service.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(service.id, 0.25)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="w-24 text-right">
                        <p className="text-lg font-semibold text-amani-600">
                          ${(service.unit_price * service.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveService(service.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Invoice Settings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amani-500" />
              Payment Terms & Notes
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoiceSettings.dueDate}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <select
                  value={invoiceSettings.paymentTerms}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, paymentTerms: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none bg-white"
                >
                  <option value="0">Due on Receipt</option>
                  <option value="7">Net 7</option>
                  <option value="15">Net 15</option>
                  <option value="30">Net 30</option>
                  <option value="60">Net 60</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount %
                </label>
                <div className="relative">
                  <Percent className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={invoiceSettings.discountPercent}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, discountPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Terms
                </label>
                <textarea
                  value={invoiceSettings.notes}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, notes: e.target.value })}
                  placeholder="Add any special terms or notes for the customer..."
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none resize-none"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-navy-900 to-amani-900 rounded-xl shadow-lg p-6 text-white"
            >
              <h2 className="text-lg font-semibold mb-6">Invoice Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-white/20">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Subtotal</span>
                  <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                </div>

                {invoiceSettings.discountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Discount ({invoiceSettings.discountPercent}%)</span>
                    <span className="font-medium text-green-400">-${totals.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Tax (13% HST)</span>
                  <span className="font-medium">${totals.tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mb-6">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-3xl font-bold text-amani-400">
                  ${totals.total.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>{selectedServices.length} service(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {format(new Date(invoiceSettings.dueDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => handleSaveInvoice('download')}
                  disabled={saving || selectedServices.length === 0}
                  className="w-full bg-white hover:bg-gray-100 text-navy-900 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Create & Download PDF
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleSaveInvoice('draft')}
                  disabled={saving || selectedServices.length === 0}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Invoice will be saved to your invoices dashboard
              </p>
            </motion.div>

            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4"
            >
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Quick Tips</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Fill in customer details</li>
                    <li>• Add services from your catalog</li>
                    <li>• Adjust quantities as needed</li>
                    <li>• Download PDF or save as draft</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Service Selector Modal */}
      <AnimatePresence>
        {showServiceSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-navy-900">Select Service</h2>
                  <p className="text-sm text-gray-500">Choose from your active services</p>
                </div>
                <button
                  onClick={() => {
                    setShowServiceSelector(false);
                    setSearchQuery('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Search */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Services List */}
              <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No services found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery ? 'Try a different search term' : 'Add services in the Services page'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredServices.map((service) => {
                      const isAdded = selectedServices.some(s => s.id === service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => handleAddService(service)}
                          disabled={isAdded}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            isAdded
                              ? 'border-green-200 bg-green-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-amani-500 hover:bg-amani-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-navy-900">{service.name}</h3>
                                {isAdded && (
                                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />
                                    Added
                                  </span>
                                )}
                              </div>
                              {service.description && (
                                <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                              )}
                              <p className="text-sm text-gray-600 mt-1">
                                {service.category || 'Uncategorized'}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-semibold text-amani-600">
                                ${(service.base_price || service.price || 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                per {service.price_type === 'per_lb' ? 'lb' : 'item'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerCreateInvoice;
