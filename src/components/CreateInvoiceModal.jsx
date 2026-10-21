import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Plus, Trash2, UserCheck, Download, History, CheckCircle2, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import db from '../lib/db';
import { useOrderStore, useAuthStore } from '../stores';
import { downloadInvoice } from '../lib/utils';
import { buildCustomerDirectory, searchCustomers } from '../lib/customerLookup';

const HST_RATE = 0.13;

// 'YYYY-MM-DDTHH:mm' in the user's local time, as <input type="datetime-local"> expects
const toLocalInputValue = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const emptyItem = () => ({ id: crypto.randomUUID?.() || String(Math.random()), name: '', quantity: '1', price: '' });

const STATUS_OPTIONS = [
  ['delivered', 'Delivered / completed'],
  ['ready', 'Ready'],
  ['processing', 'Processing'],
  ['picked_up', 'Picked up'],
  ['pending_pickup', 'Pending pickup'],
  ['cancelled', 'Cancelled'],
];

/**
 * Create an invoice (order) for a customer, optionally back-dated to a past
 * calendar date and time. Customers are looked up automatically as you type.
 *
 * Props: isOpen, onClose, onCreated(order), prefillCustomer (directory entry)
 */
const CreateInvoiceModal = ({ isOpen, onClose, onCreated, prefillCustomer = null }) => {
  const { createOrder } = useOrderStore();
  const { user } = useAuthStore();

  const [directory, setDirectory] = useState([]);
  const [services, setServices] = useState([]);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupOpen, setLookupOpen] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState(null);

  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [items, setItems] = useState([emptyItem()]);
  const [invoiceAt, setInvoiceAt] = useState(toLocalInputValue(new Date()));
  const [status, setStatus] = useState('delivered');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [chargeTax, setChargeTax] = useState(true);
  const [referenceNotes, setReferenceNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const nowValue = toLocalInputValue(new Date());

  const applyCustomer = (c) => {
    setLinkedCustomer(c);
    setCustomer({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
    });
    setLookupQuery('');
    setLookupOpen(false);
  };

  // Load directory + services when opened; reset the form.
  useEffect(() => {
    if (!isOpen) return;
    setCreated(null);
    setItems([emptyItem()]);
    setInvoiceAt(toLocalInputValue(new Date()));
    setStatus('delivered');
    setPaymentStatus('paid');
    setPaymentMethod('cash');
    setChargeTax(true);
    setReferenceNotes('');
    setLookupQuery('');
    setLinkedCustomer(null);
    setCustomer({ name: '', email: '', phone: '', address: '' });

    buildCustomerDirectory().then((dir) => {
      setDirectory(dir);
      if (prefillCustomer) {
        const fresh = dir.find((c) => c.key === prefillCustomer.key) || prefillCustomer;
        applyCustomer(fresh);
      }
    }).catch((e) => console.error('Customer directory failed to load:', e));

    db.getAll('services').then((s) => setServices((s || []).filter((x) => x.is_active !== false))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const matches = useMemo(
    () => (lookupQuery.trim().length >= 2 ? searchCustomers(directory, lookupQuery).slice(0, 6) : []),
    [directory, lookupQuery]
  );

  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((it) => {
      if (it.id !== id) return it;
      const next = { ...it, ...patch };
      // Auto-fill the price when the description matches a known service
      if (patch.name !== undefined && !it.price) {
        const svc = services.find((s) => s.name?.toLowerCase() === patch.name.toLowerCase());
        if (svc) next.price = String(svc.base_price ?? svc.price ?? '');
      }
      return next;
    }));

  const lineTotal = (it) => (parseFloat(it.quantity) || 0) * (parseFloat(it.price) || 0);
  const subtotal = items.reduce((sum, it) => sum + lineTotal(it), 0);
  const tax = chargeTax ? subtotal * HST_RATE : 0;
  const total = subtotal + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validItems = items.filter((it) => it.name.trim() && lineTotal(it) > 0);
    if (!customer.name.trim()) return toast.error('Customer name is required');
    if (validItems.length === 0) return toast.error('Add at least one item with a quantity and price');

    const when = new Date(invoiceAt);
    if (Number.isNaN(when.getTime())) return toast.error('Choose a valid invoice date and time');
    if (when.getTime() > Date.now() + 60 * 1000) return toast.error('Invoice date/time cannot be in the future');

    const round2 = (n) => Math.round(n * 100) / 100;
    const iso = when.toISOString();
    const auditNote = `Back-dated invoice entered ${new Date().toLocaleString('en-CA')} by ${user?.email || 'admin'}; invoice date ${when.toLocaleString('en-CA')}.`;

    const orderData = {
      customer_id: linkedCustomer?.id || null,
      customer_name: customer.name.trim(),
      customer_email: customer.email.trim(),
      customer_phone: customer.phone.trim(),
      is_guest_order: !linkedCustomer?.id,
      order_type: 'drop-off',
      status,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      pickup_address: customer.address.trim() || null,
      delivery_address: customer.address.trim() || null,
      pickup_date: iso.slice(0, 10),
      created_at: iso,
      ...(status === 'delivered' ? { delivered_at: iso } : {}),
      reference_notes: referenceNotes.trim() || null,
      staff_notes: auditNote,
      subtotal: round2(subtotal),
      discount_amount: 0,
      tax: round2(tax),
      total: round2(total),
      items: validItems.map((it) => ({
        service_id: 'manual',
        service_name: it.name.trim(),
        name: it.name.trim(),
        quantity: parseFloat(it.quantity),
        unit_price: parseFloat(it.price),
        total_price: round2(lineTotal(it)),
      })),
    };

    setSaving(true);
    const result = await createOrder(orderData);
    setSaving(false);

    if (!result.success) {
      toast.error(result.error || 'Failed to create invoice');
      return;
    }
    const order = { ...result.order, items: orderData.items };
    setCreated(order);
    toast.success(`Invoice ${result.order.reference_code} created`);
    onCreated?.(order);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.97, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-display font-bold text-navy-900">New Invoice</h2>
              <p className="text-sm text-gray-500">Create an invoice, optionally back-dated to a past date and time.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          {created ? (
            <div className="p-8 text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-navy-900">Invoice {created.reference_code} created</h3>
              <p className="text-gray-600">
                Dated {new Date(created.created_at).toLocaleString('en-CA')} &middot; ${Number(created.total).toFixed(2)}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button className="btn-primary flex items-center gap-2" onClick={() => downloadInvoice(created)}>
                  <Download className="w-4 h-4" /> Download invoice
                </button>
                <button className="btn-secondary" onClick={onClose}>Close</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Customer look-up */}
              <section className="space-y-3">
                <h3 className="font-semibold text-navy-900">Customer</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => { setLookupQuery(e.target.value); setLookupOpen(true); }}
                    onFocus={() => setLookupOpen(true)}
                    className="input pl-9"
                    placeholder="Look up existing customer by name, email, phone or invoice #..."
                  />
                  {lookupOpen && matches.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {matches.map((c) => (
                        <li key={c.key}>
                          <button
                            type="button"
                            onClick={() => applyCustomer(c)}
                            className="w-full text-left px-4 py-3 hover:bg-amani-50 flex items-center justify-between gap-3"
                          >
                            <span className="min-w-0">
                              <span className="block font-medium text-navy-900 truncate">{c.name}</span>
                              <span className="block text-xs text-gray-500 truncate">
                                {[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact details'}
                              </span>
                            </span>
                            <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                              <History className="w-3 h-3" />
                              {c.orderCount} invoice{c.orderCount === 1 ? '' : 's'}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {linkedCustomer && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-800">
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      {linkedCustomer.isGuest ? 'Returning guest' : 'Existing customer'} &middot;{' '}
                      {linkedCustomer.orderCount} past invoice{linkedCustomer.orderCount === 1 ? '' : 's'} &middot; $
                      {linkedCustomer.totalSpent.toFixed(2)} lifetime
                    </span>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => { setLinkedCustomer(null); setCustomer({ name: '', email: '', phone: '', address: '' }); }}
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input" placeholder="Full name *" value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                  <input className="input" type="email" placeholder="Email" value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
                  <input className="input" type="tel" placeholder="Phone" value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                  <input className="input" placeholder="Address" value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
                </div>
              </section>

              {/* Date & time */}
              <section className="space-y-2">
                <h3 className="font-semibold text-navy-900">Invoice date &amp; time</h3>
                <input
                  type="datetime-local"
                  className="input max-w-xs"
                  value={invoiceAt}
                  max={nowValue}
                  onChange={(e) => setInvoiceAt(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Pick a past date and time to back-date this invoice. It will appear in reports and on the printed invoice with this date.
                </p>
              </section>

              {/* Items */}
              <section className="space-y-3">
                <h3 className="font-semibold text-navy-900">Items</h3>
                <datalist id="invoice-services">
                  {services.map((s) => <option key={s.id} value={s.name} />)}
                </datalist>
                {items.map((it) => (
                  <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      className="input col-span-12 sm:col-span-5"
                      list="invoice-services"
                      placeholder="Description"
                      value={it.name}
                      onChange={(e) => updateItem(it.id, { name: e.target.value })}
                    />
                    <input
                      className="input col-span-4 sm:col-span-2 text-center"
                      type="number" inputMode="decimal" step="0.01" min="0"
                      placeholder="Qty / lbs"
                      value={it.quantity}
                      onChange={(e) => updateItem(it.id, { quantity: e.target.value })}
                    />
                    <input
                      className="input col-span-4 sm:col-span-2 text-center"
                      type="number" inputMode="decimal" step="0.01" min="0"
                      placeholder="Price"
                      value={it.price}
                      onChange={(e) => updateItem(it.id, { price: e.target.value })}
                    />
                    <span className="col-span-3 sm:col-span-2 text-right font-medium">${lineTotal(it).toFixed(2)}</span>
                    <button
                      type="button"
                      className="col-span-1 p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
                      disabled={items.length === 1}
                      onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-secondary flex items-center gap-2" onClick={() => setItems((p) => [...p, emptyItem()])}>
                  <Plus className="w-4 h-4" /> Add item
                </button>
              </section>

              {/* Status & payment */}
              <section className="grid sm:grid-cols-3 gap-3">
                <label className="text-sm">
                  <span className="block text-gray-600 mb-1">Order status</span>
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="block text-gray-600 mb-1">Payment</span>
                  <select className="input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                    <option value="paid">Paid</option>
                    <option value="pending">Unpaid / pending</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="block text-gray-600 mb-1">Method</span>
                  <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </label>
              </section>

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Reference notes (optional)</span>
                <input className="input" value={referenceNotes} onChange={(e) => setReferenceNotes(e.target.value)} />
              </label>

              {/* Totals */}
              <section className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <label className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={chargeTax} onChange={(e) => setChargeTax(e.target.checked)} />
                    HST (13%)
                  </span>
                  <span>${tax.toFixed(2)}</span>
                </label>
                <div className="flex justify-between text-lg font-bold text-navy-900 pt-2 border-t border-gray-200">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </section>

              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create invoice
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateInvoiceModal;
