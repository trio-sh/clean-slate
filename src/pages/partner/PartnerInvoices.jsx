import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Send, Check, Download, Eye, X, Search, Filter, MessageSquare, DollarSign, Plus } from 'lucide-react';
import db from '../../lib/db';
import { useAuthStore } from '../../stores';
import { sendSMS, smsTemplates, downloadInvoice } from '../../lib/utils';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PartnerInvoices = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSMSConfirm, setShowSMSConfirm] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState(null);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [depot, setDepot] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, [user]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, statusFilter, searchQuery]);

  const loadInvoices = async () => {
    try {
      if (!user?.depot_id) {
        setLoading(false);
        return;
      }

      // Load depot info for letterhead
      const depotData = await db.getById('depots', user.depot_id);
      setDepot(depotData);

      // Get all invoices from partner_invoices table
      const invoicesData = await db.getInvoicesByDepot(user.depot_id);

      // Update invoice status based on dates (overdue check)
      const updatedInvoices = invoicesData.map(invoice => {
        let status = invoice.status;

        // Auto-update to overdue if past due date and not paid
        if (status !== 'paid' && invoice.due_date) {
          const dueDate = new Date(invoice.due_date);
          const today = new Date();
          if (today > dueDate) {
            status = 'overdue';
          }
        }

        return {
          ...invoice,
          status,
          invoice_date: invoice.issued_date || invoice.created_at,
        };
      });

      setInvoices(updatedInvoices);
    } catch (err) {
      console.error('Error loading invoices:', err);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };


  const filterInvoices = () => {
    let filtered = [...invoices];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoice_number.toLowerCase().includes(query) ||
        inv.customer_name.toLowerCase().includes(query) ||
        inv.customer_email.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));

    setFilteredInvoices(filtered);
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleSendSMSClick = (invoice) => {
    setInvoiceToSend(invoice);
    setShowSMSConfirm(true);
  };

  const handleSendSMS = async () => {
    if (!invoiceToSend) return;

    setSendingSMS(true);
    try {
      const invoice = invoiceToSend;

      // Check if customer has phone number
      if (!invoice.customer_phone) {
        toast.error('Customer phone number not available');
        setSendingSMS(false);
        setShowSMSConfirm(false);
        return;
      }

      // Generate invoice link (for demo purposes, use tracking page)
      const invoiceLink = `${window.location.origin}/track/${invoice.invoice_number}`;

      // Create SMS message
      const message = `Amani's Cleaners - Invoice #${invoice.invoice_number}

Total: $${invoice.total.toFixed(2)}
Due: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}

View invoice: ${invoiceLink}

Thank you for your business!`;

      // Send SMS
      const result = await sendSMS(invoice.customer_phone, message);

      if (result.success) {
        // Update invoice in IndexedDB
        await db.updateInvoice(invoice.id, {
          status: invoice.status === 'draft' ? 'sent' : invoice.status,
          sms_sent: true,
          sms_sent_at: new Date().toISOString(),
        });

        toast.success('Invoice sent via SMS successfully!');

        // Reload invoices
        await loadInvoices();
      } else {
        toast.error(result.error || 'Failed to send SMS');
      }
    } catch (err) {
      console.error('Error sending SMS:', err);
      toast.error('Failed to send invoice via SMS');
    } finally {
      setSendingSMS(false);
      setShowSMSConfirm(false);
      setInvoiceToSend(null);
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) return;

      // Update invoice status to paid in IndexedDB
      await db.updateInvoiceStatus(invoiceId, 'paid', new Date().toISOString());

      toast.success('Invoice marked as paid!');
      await loadInvoices();
    } catch (err) {
      console.error('Error marking as paid:', err);
      toast.error('Failed to mark invoice as paid');
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
        status: invoice.status === 'paid' ? 'completed' : 'pending',
        payment_method: invoice.status === 'paid' ? 'Paid' : 'To be paid',
        created_at: invoice.issued_date || invoice.created_at,
        notes: invoice.notes,
        partner_name: invoice.partner_name,
        partner_email: invoice.partner_email,
        partner_phone: invoice.partner_phone,
        depot_name: invoice.depot_name || depot?.name || null,
        depot_code: invoice.depot_code || depot?.code || null,
        depot_address: invoice.depot_address || depot?.address || null,
        depot_city: invoice.depot_city || depot?.city || null,
        depot_postal_code: invoice.depot_postal_code || depot?.postal_code || null,
        depot_phone: invoice.depot_phone || depot?.phone || null,
      };

      await downloadInvoice(orderForPDF);
      toast.success('Invoice downloaded!');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      toast.error('Failed to download invoice');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="bg-white rounded-xl p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
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
              Invoices Management
            </h1>
            <p className="text-gray-600 mt-1">Manage and send invoices to customers</p>
          </div>
          <button
            onClick={() => navigate('/partner-portal/invoices/create')}
            className="flex items-center gap-2 px-5 py-3 bg-amani-500 hover:bg-amani-600 text-white rounded-lg transition-colors shadow-lg shadow-amani-500/30"
          >
            <Plus className="w-5 h-5" />
            Create Invoice
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice number or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500 outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-navy-900">{invoices.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{invoices.filter(i => i.status === 'sent').length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{invoices.filter(i => i.status === 'paid').length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Paid</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{invoices.filter(i => i.status === 'overdue').length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-medium">No invoices found</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Try adjusting your search' : 'Invoices will appear here once orders are created'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-navy-900">
                          #{invoice.invoice_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-navy-900">{invoice.customer_name}</p>
                        <p className="text-xs text-gray-500">{invoice.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-navy-900">
                        ${invoice.total.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => handleViewDetails(invoice)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </button>

                        {/* Send via SMS */}
                        {(invoice.status === 'draft' || invoice.status === 'sent') && invoice.customer_phone && (
                          <button
                            onClick={() => handleSendSMSClick(invoice)}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                            title="Send via SMS"
                          >
                            <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                          </button>
                        )}

                        {/* Mark as Paid */}
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(invoice.id)}
                            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors group"
                            title="Mark as Paid"
                          >
                            <Check className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                          </button>
                        )}

                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors group"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-navy-900">Invoice Details</h2>
                  <p className="text-sm text-gray-500">#{selectedInvoice.invoice_number}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Partner & Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Partner (From) */}
                  {selectedInvoice.partner_name && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">From (Partner)</h3>
                      <div className="bg-amani-50 rounded-lg p-4 space-y-2">
                        <p className="font-medium text-navy-900">{selectedInvoice.partner_name}</p>
                        {selectedInvoice.partner_email && (
                          <p className="text-sm text-gray-600">{selectedInvoice.partner_email}</p>
                        )}
                        {selectedInvoice.partner_phone && (
                          <p className="text-sm text-gray-600">{selectedInvoice.partner_phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer (To) */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Bill To</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="font-medium text-navy-900">{selectedInvoice.customer_name}</p>
                      {selectedInvoice.customer_email && (
                        <p className="text-sm text-gray-600">{selectedInvoice.customer_email}</p>
                      )}
                      {selectedInvoice.customer_phone && (
                        <p className="text-sm text-gray-600">{selectedInvoice.customer_phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Invoice Date</p>
                    <p className="font-medium text-navy-900">
                      {format(new Date(selectedInvoice.invoice_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                    <p className="font-medium text-navy-900">
                      {format(new Date(selectedInvoice.due_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">SMS Sent</p>
                    <p className="font-medium text-navy-900">
                      {selectedInvoice.sms_sent ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Items</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Service
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Qty
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Price
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm text-navy-900">
                              {item.name || item.service_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-600">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                              ${(item.unit_price || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-navy-900">
                              ${(item.total_price || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-navy-900">
                      ${selectedInvoice.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {selectedInvoice.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">
                        -${selectedInvoice.discount_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (13%)</span>
                    <span className="font-medium text-navy-900">
                      ${selectedInvoice.tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-navy-900">Total</span>
                    <span className="font-bold text-xl text-amani-500">
                      ${selectedInvoice.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownloadPDF(selectedInvoice)}
                    className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  {(selectedInvoice.status === 'draft' || selectedInvoice.status === 'sent') && selectedInvoice.customer_phone && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleSendSMSClick(selectedInvoice);
                      }}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send via SMS
                    </button>
                  )}
                  {selectedInvoice.status !== 'paid' && (
                    <button
                      onClick={() => {
                        handleMarkPaid(selectedInvoice.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SMS Confirmation Modal */}
      <AnimatePresence>
        {showSMSConfirm && invoiceToSend && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-navy-900 mb-2">Send Invoice via SMS?</h2>
                <p className="text-gray-600">
                  Invoice #{invoiceToSend.invoice_number} will be sent to:
                </p>
                <p className="font-medium text-navy-900 mt-2">
                  {invoiceToSend.customer_name}
                </p>
                <p className="text-sm text-gray-600">
                  {invoiceToSend.customer_phone}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 mb-2">Message Preview:</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {`Amani's Cleaners - Invoice #${invoiceToSend.invoice_number}

Total: $${invoiceToSend.total.toFixed(2)}
Due: ${format(new Date(invoiceToSend.due_date), 'MMM dd, yyyy')}

View invoice: ${window.location.origin}/track/${invoiceToSend.invoice_number}

Thank you for your business!`}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSMSConfirm(false);
                    setInvoiceToSend(null);
                  }}
                  disabled={sendingSMS}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendSMS}
                  disabled={sendingSMS}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sendingSMS ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send SMS
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerInvoices;
