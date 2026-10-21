// Customer look-up: merges registered customers and guest customers (people who
// only exist on invoices) into one searchable directory, each with their full
// invoice history (new and old).
import db from './db';

const DAY_MS = 24 * 60 * 60 * 1000;

export const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  // Treat +1 / leading-1 North American numbers the same as their 10-digit form
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const fullName = (first, last) => `${first || ''} ${last || ''}`.trim();

/**
 * Build the directory. Each entry:
 * { key, id, name, email, phone, address, isGuest, orders[], orderCount,
 *   totalSpent, firstOrderAt, lastOrderAt, daysSinceLast }
 * `orders` is sorted newest first. `id` is null for guests.
 */
export const buildCustomerDirectory = async () => {
  const [users, orders] = await Promise.all([
    db.getAll('users'),
    db.getOrdersWithDetails().catch(() => db.getAll('orders')),
  ]);

  const byId = new Map();
  const byEmail = new Map();
  const byPhone = new Map();
  const entries = [];

  const register = (entry) => {
    entries.push(entry);
    if (entry.id) byId.set(entry.id, entry);
    const e = normalizeEmail(entry.email);
    const p = normalizePhone(entry.phone);
    if (e) byEmail.set(e, entry);
    if (p) byPhone.set(p, entry);
  };

  users
    .filter((u) => u.role === 'customer')
    .forEach((u) =>
      register({
        key: `user-${u.id}`,
        id: u.id,
        name: fullName(u.first_name, u.last_name) || u.email || 'Customer',
        email: u.email || '',
        phone: u.phone || '',
        address: u.address || '',
        isGuest: false,
        orders: [],
      })
    );

  orders.forEach((order) => {
    const ownerId = order.customer_id || order.user_id;
    const email = normalizeEmail(order.customer_email || order.user?.email);
    const phone = normalizePhone(order.customer_phone || order.user?.phone);

    let entry =
      (ownerId && byId.get(ownerId)) ||
      (email && byEmail.get(email)) ||
      (phone && byPhone.get(phone));

    if (!entry) {
      entry = {
        key: `guest-${email || phone || order.id}`,
        id: null,
        name: order.customer_name || order.customer_email || order.customer_phone || 'Guest',
        email: order.customer_email || '',
        phone: order.customer_phone || '',
        address: order.delivery_address || order.pickup_address || '',
        isGuest: true,
        orders: [],
      };
      register(entry);
    } else {
      // Fill gaps in contact details from invoices
      if (!entry.email && order.customer_email) entry.email = order.customer_email;
      if (!entry.phone && order.customer_phone) entry.phone = order.customer_phone;
      if (!entry.address && (order.delivery_address || order.pickup_address)) {
        entry.address = order.delivery_address || order.pickup_address;
      }
    }
    entry.orders.push(order);
  });

  const now = Date.now();
  entries.forEach((entry) => {
    entry.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const live = entry.orders.filter((o) => o.status !== 'cancelled');
    entry.orderCount = entry.orders.length;
    entry.totalSpent = live.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    entry.lastOrderAt = entry.orders[0]?.created_at || null;
    entry.firstOrderAt = entry.orders[entry.orders.length - 1]?.created_at || null;
    entry.daysSinceLast = entry.lastOrderAt
      ? Math.floor((now - new Date(entry.lastOrderAt).getTime()) / DAY_MS)
      : null;
  });

  return entries.sort((a, b) => {
    if (a.lastOrderAt && b.lastOrderAt) return new Date(b.lastOrderAt) - new Date(a.lastOrderAt);
    if (a.lastOrderAt) return -1;
    if (b.lastOrderAt) return 1;
    return a.name.localeCompare(b.name);
  });
};

/**
 * Search by name, email, phone (digits only match) or invoice reference code.
 * Every whitespace-separated term must match somewhere.
 */
export const searchCustomers = (directory, query) => {
  const terms = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return directory;

  return directory.filter((c) => {
    const haystack = [
      c.name,
      c.email,
      c.phone,
      ...c.orders.map((o) => o.reference_code),
    ]
      .join(' ')
      .toLowerCase();
    const phoneDigits = normalizePhone(c.phone);

    return terms.every((term) => {
      if (haystack.includes(term)) return true;
      const digits = term.replace(/\D/g, '');
      return digits.length >= 3 && phoneDigits.includes(normalizePhone(digits));
    });
  });
};

export const SEGMENTS = {
  all: { label: 'All', test: () => true },
  new: { label: 'New (no invoices)', test: (c) => c.orderCount === 0 },
  repeat: { label: 'Repeat (2+ invoices)', test: (c) => c.orderCount >= 2 },
  winback: {
    label: 'Win-back (60+ days)',
    test: (c) => c.daysSinceLast !== null && c.daysSinceLast >= 60,
  },
  guests: { label: 'Guests', test: (c) => c.isGuest },
};

export const fillPromoTokens = (template, customer, code) =>
  String(template || '')
    .replace(/\{name\}/gi, (customer.name || 'there').split(' ')[0])
    .replace(/\{code\}/gi, code || '');

export const whatsappLink = (phone, message) => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) digits = `1${digits}`; // default to Canada/US
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};
