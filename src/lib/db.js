// Database configuration and mode switching for Amani's Cleaners
import { createClient } from '@supabase/supabase-js';
import { openDB } from 'idb';

// Mode can be 'demo' or 'live'
// Default to env variable, fallback to localStorage, then 'demo'
const defaultMode = import.meta.env.VITE_APP_MODE || 'demo';
const getMode = () => localStorage.getItem('amani_mode') || defaultMode;
const setMode = (mode) => localStorage.setItem('amani_mode', mode);

// Supabase configuration (for live mode)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client initialized');
} else {
  console.log('ℹ️ Supabase not configured, using demo mode only');
}

// ============================================
// PASSWORD HASHING UTILITIES
// ============================================
// Using Web Crypto API for secure password hashing

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Normalize phone number (remove non-digits, ensure country code)
function normalizePhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // Add country code if not present (assume Canada/US)
  if (digits.length === 10) {
    return '1' + digits;
  }
  return digits;
}

// IndexedDB configuration (for demo mode)
const DB_NAME = 'amani_cleaners_demo';
const DB_VERSION = 4; // Bumped to add partner_services + partner_invoices stores

const initDemoDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const usersStore = db.createObjectStore('users', { keyPath: 'id' });
        usersStore.createIndex('email', 'email', { unique: true });
        usersStore.createIndex('phone', 'phone');
        usersStore.createIndex('role', 'role');
      }

      // Addresses store
      if (!db.objectStoreNames.contains('addresses')) {
        const addressStore = db.createObjectStore('addresses', { keyPath: 'id' });
        addressStore.createIndex('user_id', 'user_id');
      }

      // Service categories store
      if (!db.objectStoreNames.contains('service_categories')) {
        const catStore = db.createObjectStore('service_categories', { keyPath: 'id' });
        catStore.createIndex('slug', 'slug', { unique: true });
      }

      // Services store
      if (!db.objectStoreNames.contains('services')) {
        const servicesStore = db.createObjectStore('services', { keyPath: 'id' });
        servicesStore.createIndex('category_id', 'category_id');
        servicesStore.createIndex('depot_id', 'depot_id');
      } else if (oldVersion < 3) {
        // Add depot_id index to existing services store
        try {
          const ss = transaction.objectStore('services');
          if (!ss.indexNames.contains('depot_id')) ss.createIndex('depot_id', 'depot_id');
        } catch (e) { /* ignore if already exists */ }
      }

      // Orders store
      if (!db.objectStoreNames.contains('orders')) {
        const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
        ordersStore.createIndex('reference_code', 'reference_code', { unique: true });
        ordersStore.createIndex('user_id', 'user_id');
        ordersStore.createIndex('status', 'status');
        ordersStore.createIndex('pickup_date', 'pickup_date');
      }

      // Order items store
      if (!db.objectStoreNames.contains('order_items')) {
        const itemsStore = db.createObjectStore('order_items', { keyPath: 'id' });
        itemsStore.createIndex('order_id', 'order_id');
      }

      // Depots store
      if (!db.objectStoreNames.contains('depots')) {
        const depotsStore = db.createObjectStore('depots', { keyPath: 'id' });
        depotsStore.createIndex('code', 'code', { unique: true });
        depotsStore.createIndex('city', 'city');
        depotsStore.createIndex('status', 'status');
        depotsStore.createIndex('manager_id', 'manager_id');
      } else if (oldVersion < 3) {
        // Add new indexes to existing depots store
        try {
          const ds = transaction.objectStore('depots');
          if (!ds.indexNames.contains('city')) ds.createIndex('city', 'city');
          if (!ds.indexNames.contains('status')) ds.createIndex('status', 'status');
          if (!ds.indexNames.contains('manager_id')) ds.createIndex('manager_id', 'manager_id');
        } catch (e) { /* ignore if already exists */ }
      }

      // Driver applications store
      if (!db.objectStoreNames.contains('driver_applications')) {
        const daStore = db.createObjectStore('driver_applications', { keyPath: 'id' });
        daStore.createIndex('email', 'email');
        daStore.createIndex('status', 'status');
      }

      // Laundry partner applications store
      if (!db.objectStoreNames.contains('laundry_partner_applications')) {
        const paStore = db.createObjectStore('laundry_partner_applications', { keyPath: 'id' });
        paStore.createIndex('email', 'email');
        paStore.createIndex('status', 'status');
      }

      // Career applications store
      if (!db.objectStoreNames.contains('career_applications')) {
        const caStore = db.createObjectStore('career_applications', { keyPath: 'id' });
        caStore.createIndex('email', 'email');
        caStore.createIndex('status', 'status');
      }

      // Subscription plans store
      if (!db.objectStoreNames.contains('subscription_plans')) {
        const plansStore = db.createObjectStore('subscription_plans', { keyPath: 'id' });
        plansStore.createIndex('slug', 'slug', { unique: true });
      }

      // Customer subscriptions store
      if (!db.objectStoreNames.contains('customer_subscriptions')) {
        const subStore = db.createObjectStore('customer_subscriptions', { keyPath: 'id' });
        subStore.createIndex('user_id', 'user_id');
      }

      // Driver routes store
      if (!db.objectStoreNames.contains('driver_routes')) {
        const routesStore = db.createObjectStore('driver_routes', { keyPath: 'id' });
        routesStore.createIndex('driver_id', 'driver_id');
        routesStore.createIndex('route_date', 'route_date');
      }

      // Route stops store
      if (!db.objectStoreNames.contains('route_stops')) {
        const stopsStore = db.createObjectStore('route_stops', { keyPath: 'id' });
        stopsStore.createIndex('route_id', 'route_id');
        stopsStore.createIndex('order_id', 'order_id');
      }

      // Notifications store
      if (!db.objectStoreNames.contains('notifications')) {
        const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
        notifStore.createIndex('user_id', 'user_id');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Discount codes store
      if (!db.objectStoreNames.contains('discount_codes')) {
        const discountStore = db.createObjectStore('discount_codes', { keyPath: 'id' });
        discountStore.createIndex('code', 'code', { unique: true });
      }

      // Staff shifts store
      if (!db.objectStoreNames.contains('staff_shifts')) {
        const shiftsStore = db.createObjectStore('staff_shifts', { keyPath: 'id' });
        shiftsStore.createIndex('staff_id', 'staff_id');
        shiftsStore.createIndex('depot_id', 'depot_id');
      }

      // Service areas store
      if (!db.objectStoreNames.contains('service_areas')) {
        db.createObjectStore('service_areas', { keyPath: 'id' });
      }

      // Check-ins store (for staff and drivers)
      if (!db.objectStoreNames.contains('checkins')) {
        const checkinsStore = db.createObjectStore('checkins', { keyPath: 'id' });
        checkinsStore.createIndex('user_id', 'user_id');
        checkinsStore.createIndex('check_date', 'check_date');
        checkinsStore.createIndex('type', 'type'); // 'check_in' or 'check_out'
      }

      // Reviews store
      if (!db.objectStoreNames.contains('reviews')) {
        const reviewsStore = db.createObjectStore('reviews', { keyPath: 'id' });
        reviewsStore.createIndex('order_id', 'order_id');
        reviewsStore.createIndex('user_id', 'user_id');
      }

      // Order status history store
      if (!db.objectStoreNames.contains('order_status_history')) {
        const historyStore = db.createObjectStore('order_status_history', { keyPath: 'id' });
        historyStore.createIndex('order_id', 'order_id');
      }

      // Partner services store
      if (!db.objectStoreNames.contains('partner_services')) {
        const partnerServicesStore = db.createObjectStore('partner_services', { keyPath: 'id' });
        partnerServicesStore.createIndex('depot_id', 'depot_id');
        partnerServicesStore.createIndex('category', 'category');
      }

      // Partner invoices store
      if (!db.objectStoreNames.contains('partner_invoices')) {
        const partnerInvoicesStore = db.createObjectStore('partner_invoices', { keyPath: 'id' });
        partnerInvoicesStore.createIndex('depot_id', 'depot_id');
        partnerInvoicesStore.createIndex('order_id', 'order_id');
        partnerInvoicesStore.createIndex('customer_id', 'customer_id');
        partnerInvoicesStore.createIndex('status', 'status');
        partnerInvoicesStore.createIndex('invoice_number', 'invoice_number', { unique: true });
      }
    },
  });
};

// Generate unique ID
const generateId = () => crypto.randomUUID();

// Generate 7-digit reference code
const generateReferenceCode = () => {
  return String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
};

// Database operations
export const db = {
  getMode,
  setMode,
  supabase,
  
  // ============================================
  // SETTINGS FUNCTIONS
  // ============================================
  
  // Get a setting by key
  async getSetting(key) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const settings = await idb.getAll('settings');
      const setting = settings.find(s => s.key === key);
      return setting?.value || null;
    }
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data?.value || null;
  },

  // Update a setting by key
  async updateSetting(key, value) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const settings = await idb.getAll('settings');
      const existing = settings.find(s => s.key === key);
      if (existing) {
        await idb.put('settings', { ...existing, value, updated_at: new Date().toISOString() });
      } else {
        await idb.put('settings', { key, value, updated_at: new Date().toISOString() });
      }
      return { key, value };
    }
    // Try update first
    const { data: updateData, error: updateError } = await supabase
      .from('settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
      .single();
    
    if (updateError && updateError.code === 'PGRST116') {
      // Not found, insert new
      const { data: insertData, error: insertError } = await supabase
        .from('settings')
        .insert({ key, value })
        .select()
        .single();
      if (insertError) throw insertError;
      return insertData;
    }
    if (updateError) throw updateError;
    return updateData;
  },

  // Get app mode settings (demo enabled, etc.)
  async getAppModeSettings() {
    const value = await this.getSetting('app_mode');
    return value || { mode: 'live', demo_enabled: false };
  },

  // Update app mode settings
  async setAppModeSettings(settings) {
    return this.updateSetting('app_mode', settings);
  },
  
  async init() {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      await seedDemoData(idb);
      await seedDepotExtras(idb);
      return idb;
    }
    return supabase;
  },

  // Generic CRUD operations
  async getAll(table) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      return idb.getAll(table);
    }
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    return data || [];
  },

  async getById(table, id) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      return idb.get(table, id);
    }
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getByField(table, field, value) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const index = idb.transaction(table).store.index(field);
      return index.getAll(value);
    }
    const { data, error } = await supabase.from(table).select('*').eq(field, value);
    if (error) throw error;
    return data || [];
  },

  async create(table, data) {
    if (getMode() === 'demo') {
      // Demo mode: add id and timestamps
      const record = {
        ...data,
        id: data.id || generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (table === 'orders' && !record.reference_code) {
        record.reference_code = generateReferenceCode();
      }

      const idb = await initDemoDB();
      await idb.put(table, record);
      return record;
    }
    
    // Live mode: let Supabase handle id, created_at, updated_at defaults
    const record = { ...data };
    
    // Remove fields that Supabase auto-generates
    delete record.id;
    delete record.created_at;
    delete record.updated_at;
    
    // Remove empty strings for nullable unique fields (phone)
    if (table === 'users' && record.phone === '') {
      record.phone = null;
    }
    
    if (table === 'orders' && !record.reference_code) {
      record.reference_code = generateReferenceCode();
    }

    const { data: result, error } = await supabase.from(table).insert(record).select().single();
    if (error) {
      if (error.code === '42703' || error.message?.includes('column')) {
        const safeRecord = this._stripUnknownFields(table, record);
        const { data: r2, error: e2 } = await supabase.from(table).insert(safeRecord).select().single();
        if (e2) throw e2;
        return r2;
      }
      throw error;
    }
    return result;
  },

  async update(table, id, updates) {
    const record = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Remove password from raw updates (should never be stored directly)
    delete record.password;
    
    // Remove empty strings for nullable unique fields
    if (table === 'users' && record.phone === '') {
      record.phone = null;
    }

    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const existing = await idb.get(table, id);
      const updated = { ...existing, ...record };
      await idb.put(table, updated);
      return updated;
    }
    const { data, error } = await supabase.from(table).update(record).eq('id', id).select().single();
    if (error) {
      if (error.code === '42703' || error.message?.includes('column')) {
        const safeRecord = this._stripUnknownFields(table, record);
        const { data: r2, error: e2 } = await supabase.from(table).update(safeRecord).eq('id', id).select().single();
        if (e2) throw e2;
        return r2;
      }
      throw error;
    }
    return data;
  },

  // Helper: get the current logged-in user's ID from localStorage (Zustand persist key)
  _getCurrentUserId() {
    try {
      const stored = localStorage.getItem('amani-auth');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.state?.user?.id || null;
    } catch {
      return null;
    }
  },

  // Helper: strip fields not in the known schema (for when migration hasn't been run)
  _stripUnknownFields(table, record) {
    const knownColumns = {
      users: ['email', 'phone', 'first_name', 'last_name', 'password_hash', 'role',
              'avatar_url', 'is_active', 'is_verified', 'referral_code', 'referred_by',
              'first_order_discount_used', 'updated_at'],
      services: ['category_id', 'name', 'description', 'base_price', 'price_type',
                 'service_type', 'processing_days', 'is_active', 'display_order', 'updated_at'],
      service_categories: ['name', 'slug', 'description', 'icon', 'display_order', 'is_active', 'updated_at'],
    };
    
    const cols = knownColumns[table];
    if (!cols) return record; // No filtering for unknown tables
    
    const filtered = {};
    for (const [key, value] of Object.entries(record)) {
      if (cols.includes(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  },

  async delete(table, id) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      await idb.delete(table, id);
      return true;
    }
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Order-specific operations
  async createOrder(orderData) {
    // Extract items before creating order (items are inserted separately in store)
    const { items, ...orderDataWithoutItems } = orderData;
    
    return this.create('orders', {
      ...orderDataWithoutItems,
      reference_code: generateReferenceCode(),
      status: 'pending_pickup',
      payment_status: 'pending',
    });
  },

  async getOrderByReference(referenceCode) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const orders = await idb.getAll('orders');
      const order = orders.find(o => o.reference_code === referenceCode);
      if (!order) return null;
      
      // Get order items
      const orderItems = await idb.getAll('order_items');
      const items = orderItems.filter(i => i.order_id === order.id);
      
      return { ...order, items };
    }
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('reference_code', referenceCode)
      .single();
    if (error) throw error;
    return data;
  },

  async getOrdersWithDetails(filters = {}) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      let orders = await idb.getAll('orders');
      const users = await idb.getAll('users');
      const addresses = await idb.getAll('addresses');
      const orderItems = await idb.getAll('order_items');
      
      // Apply filters
      if (filters.status) {
        orders = orders.filter(o => o.status === filters.status);
      }
      if (filters.user_id) {
        orders = orders.filter(o => o.user_id === filters.user_id);
      }
      if (filters.pickup_date) {
        orders = orders.filter(o => o.pickup_date === filters.pickup_date);
      }

      // Join with related data and map user info to customer fields
      return orders.map(order => {
        const user = users.find(u => u.id === order.user_id);
        return {
          ...order,
          // Map user data to customer fields if not already present
          customer_name: order.customer_name || (user ? `${user.first_name} ${user.last_name}` : 'Guest'),
          customer_email: order.customer_email || user?.email || '',
          customer_phone: order.customer_phone || user?.phone || '',
          user,
          pickup_address_obj: addresses.find(a => a.id === order.pickup_address_id),
          delivery_address_obj: addresses.find(a => a.id === order.delivery_address_id),
          items: orderItems.filter(i => i.order_id === order.id),
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    let query = supabase
      .from('orders')
      .select('*, user:users!orders_user_id_fkey(*), items:order_items(*)')
      .order('created_at', { ascending: false });
    if (filters.status)      query = query.eq('status', filters.status);
    if (filters.user_id)     query = query.eq('user_id', filters.user_id);
    if (filters.pickup_date) query = query.eq('pickup_date', filters.pickup_date);
    if (filters.driver_id)   query = query.or(`pickup_driver_id.eq.${filters.driver_id},delivery_driver_id.eq.${filters.driver_id}`);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []);
  },

  // User operations
  async getUserByEmail(email) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const index = idb.transaction('users').store.index('email');
      return index.get(email);
    }
    const { data, error } = await supabase.rpc('get_user_by_email', { p_email: email });
    if (error && error.code !== 'PGRST116') throw error;
    return data?.[0] || null;
  },

  async getUserByPhone(phone) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const index = idb.transaction('users').store.index('phone');
      const normalizedPhone = normalizePhone(phone);
      let results = await index.getAll(normalizedPhone);
      if (results.length === 0) results = await index.getAll(phone);
      return results[0];
    }
    // Use SECURITY DEFINER RPC to bypass RLS on public.users
    const { data, error } = await supabase.rpc('get_user_by_phone', { p_phone: normalizePhone(phone) });
    if (error && error.code !== 'PGRST116') throw error;
    return data?.[0] || null;
  },

  // ============================================
  // AUTHENTICATION METHODS
  // ============================================

  // Register new user — insert directly, no Supabase Auth
  async registerWithEmail(userData) {
    const { email, password, first_name, last_name, phone } = userData;
    const normalizedPhone = phone ? normalizePhone(phone) : '';

    if (getMode() === 'demo') {
      const existingEmail = await this.getUserByEmail(email);
      if (existingEmail) throw new Error('Email already registered');
      if (phone) {
        const existingPhone = await this.getUserByPhone(phone);
        if (existingPhone) throw new Error('Phone number already registered');
      }
      const newUser = await this.create('users', {
        email, phone: normalizedPhone, first_name, last_name,
        password_hash: password, role: 'customer',
        is_active: true, is_verified: false, first_order_discount_used: false,
      });
      return { user: newUser };
    }

    const { data, error } = await supabase.rpc('register_user', {
      p_email:      email,
      p_password:   password,
      p_first_name: first_name,
      p_last_name:  last_name,
      p_phone:      normalizedPhone || null,
    });
    if (error) throw new Error(error.message || 'Registration failed');
    // register_user returns QUERY (array), get first row
    return { user: data && data[0] ? data[0] : data };
  },

  // Login with email — direct DB compare, no Supabase Auth
  async loginWithEmail(email, password) {
    if (getMode() === 'demo') {
      const user = await this.getUserByEmail(email);
      if (!user) throw new Error('Invalid email or password');
      if (user.password_hash !== password) throw new Error('Invalid email or password');
      return { user };
    }
    const { data, error } = await supabase.rpc('login_with_email', {
      p_email: email, p_password: password,
    });
    if (error) throw new Error('Invalid email or password');
    // login_with_email returns QUERY (array), get first row
    return { user: data && data[0] ? data[0] : data };
  },

  // Login with phone — direct DB compare, no Supabase Auth
  async loginWithPhone(phone, password) {
    if (getMode() === 'demo') {
      const user = await this.getUserByPhone(phone);
      if (!user) throw new Error('Invalid phone number or password');
      if (user.password_hash !== password) throw new Error('Invalid phone number or password');
      return { user };
    }
    const { data, error } = await supabase.rpc('login_with_phone', {
      p_phone: normalizePhone(phone), p_password: password,
    });
    if (error) throw new Error('Invalid phone number or password');
    // login_with_phone returns QUERY (array), get first row
    return { user: data && data[0] ? data[0] : data };
  },

  // Update password — plain text, direct update
  async updatePassword(userId, newPassword) {
    if (getMode() === 'demo') {
      return this.update('users', userId, { password_hash: newPassword });
    }
    const { data, error } = await supabase.rpc('update_user_password', {
      p_user_id: userId, p_password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  // Logout — session is in Zustand/localStorage, nothing else to clear
  async logout() {
    return true;
  },
  // Session is persisted by Zustand — nothing to restore from Supabase
  async restoreSession() {
    return null;
  },

  // Check if email exists
  async emailExists(email) {
    const user = await this.getUserByEmail(email);
    return !!user;
  },

  // Check if phone exists
  async phoneExists(phone) {
    const user = await this.getUserByPhone(phone);
    return !!user;
  },

  // Driver operations
  async getDriverRoutes(driverId, date) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      let routes = await idb.getAll('driver_routes');
      routes = routes.filter(r => r.driver_id === driverId);
      if (date) routes = routes.filter(r => r.route_date === date);
      
      // Get stops for each route
      const stops = await idb.getAll('route_stops');
      const orders = await idb.getAll('orders');
      
      return routes.map(route => ({
        ...route,
        stops: stops
          .filter(s => s.route_id === route.id)
          .sort((a, b) => a.sequence_number - b.sequence_number)
          .map(stop => ({
            ...stop,
            order: orders.find(o => o.id === stop.order_id),
          })),
      }));
    }
    
    let query = supabase
      .from('driver_routes')
      .select('*, stops:route_stops(*, order:orders(*))')
      .eq('driver_id', driverId)
      .order('route_date', { ascending: true });
    if (date) query = query.eq('route_date', date);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // ============================================
  // DEPOT / PARTNER OPERATIONS
  // ============================================

  // Get all active depots
  async getDepots(onlyActive = false) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const depots = await idb.getAll('depots');
      return onlyActive ? depots.filter(d => d.status === 'active') : depots;
    }
    let q = supabase.from('depots').select('*').order('name');
    if (onlyActive) q = q.eq('status', 'active');
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  // Get depots that serve a given city (city match on depot.city or service_areas)
  async getDepotsByCity(city) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const depots = await idb.getAll('depots');
      // Return all active depots; filter to preferred city first
      const active = depots.filter(d => d.status === 'active');
      const cityMatch = active.filter(d => d.city?.toLowerCase() === city?.toLowerCase());
      return cityMatch.length ? cityMatch : active;
    }
    const { data, error } = await supabase.from('depots').select('*').eq('status', 'active');
    if (error) throw error;
    return data || [];
  },

  // Get orders assigned to a specific depot
  async getOrdersByDepot(depotId, filters = {}) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      let orders = await idb.getAll('orders');
      orders = orders.filter(o => o.depot_id === depotId);
      if (filters.status) orders = orders.filter(o => o.status === filters.status);
      if (filters.date) orders = orders.filter(o => o.pickup_date === filters.date || o.delivery_date === filters.date);
      const users = await idb.getAll('users');
      const orderItems = await idb.getAll('order_items');
      return orders.map(order => {
        const user = users.find(u => u.id === order.user_id);
        return {
          ...order,
          customer_name: order.customer_name || (user ? `${user.first_name} ${user.last_name}` : 'Guest'),
          customer_email: order.customer_email || user?.email || '',
          customer_phone: order.customer_phone || user?.phone || '',
          items: orderItems.filter(i => i.order_id === order.id),
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    let q = supabase.from('orders')
      .select('*, user:users!orders_user_id_fkey(*), items:order_items(*)')
      .eq('depot_id', depotId)
      .order('created_at', { ascending: false });
    if (filters.status) q = q.eq('status', filters.status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  // Get capacity utilization for a depot on a specific date
  async getDepotCapacityForDate(depotId, date) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const depot = await idb.get('depots', depotId);
      const orders = await idb.getAll('orders');
      const dayOrders = orders.filter(o =>
        o.depot_id === depotId &&
        (o.pickup_date === date || o.delivery_date === date) &&
        !['cancelled', 'delivered'].includes(o.status)
      );
      const usedLbs = dayOrders.reduce((sum, o) => sum + (o.weight_lbs || 0), 0);
      const capacityLbs = depot?.capacity_per_day || 500;
      return {
        depot,
        date,
        order_count: dayOrders.length,
        used_lbs: usedLbs,
        capacity_lbs: capacityLbs,
        available_lbs: Math.max(0, capacityLbs - usedLbs),
        utilization_pct: Math.round((usedLbs / capacityLbs) * 100),
      };
    }
    const { data: depot } = await supabase.from('depots').select('*').eq('id', depotId).single();
    const { data: orders } = await supabase.from('orders').select('weight_lbs,status')
      .eq('depot_id', depotId).or(`pickup_date.eq.${date},delivery_date.eq.${date}`)
      .not('status', 'in', '(cancelled,delivered)');
    const usedLbs = (orders || []).reduce((s, o) => s + (o.weight_lbs || 0), 0);
    const capacityLbs = depot?.capacity_per_day || 500;
    return { depot, date, order_count: (orders||[]).length, used_lbs: usedLbs, capacity_lbs: capacityLbs, available_lbs: Math.max(0, capacityLbs - usedLbs), utilization_pct: Math.round((usedLbs / capacityLbs) * 100) };
  },

  // Assign an order to a depot
  async assignOrderToDepot(orderId, depotId) {
    return this.update('orders', orderId, { depot_id: depotId });
  },

  // Approve a partner application: create depot + partner user + mark approved
  async approvePartnerApplication(applicationId, depotData, partnerPassword) {
    const idb = getMode() === 'demo' ? await initDemoDB() : null;

    // Create depot record
    const depot = await this.create('depots', {
      ...depotData,
      status: 'active',
    });

    // Create partner user account
    const passwordHash = partnerPassword;
    const partnerUser = await this.create('users', {
      email: depotData.partner_email,
      phone: depotData.partner_phone || null,
      first_name: depotData.partner_first_name,
      last_name: depotData.partner_last_name,
      role: 'partner',
      depot_id: depot.id,
      password_hash: passwordHash,
      is_active: true,
      is_verified: true,
    });

    // Link manager to depot
    await this.update('depots', depot.id, { manager_id: partnerUser.id });

    // Update application status
    await this.update('laundry_partner_applications', applicationId, {
      status: 'approved',
      depot_id: depot.id,
      partner_user_id: partnerUser.id,
    });

    // Auto-send SMS with login credentials if phone is provided
    if (depotData.partner_phone) {
      try {
        const { sendSMS, smsTemplates } = await import('./utils');
        const phone = depotData.partner_phone.replace(/\D/g, '');
        const message = smsTemplates.loginCredentials(depotData.partner_email, partnerPassword);
        await sendSMS(phone, message);
      } catch (e) {
        console.warn('Could not send partner credentials SMS:', e);
        // Non-fatal — credentials are still shown in the UI
      }
    }

    return { depot, partnerUser };
  },

  // Stats operations
  async getDashboardStats() {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const orders = await idb.getAll('orders');
      const users = await idb.getAll('users');
      const today = new Date().toISOString().split('T')[0];

      const todayOrders = orders.filter(o => o.created_at?.startsWith(today));
      const pendingOrders = orders.filter(o => ['pending_pickup', 'picked_up'].includes(o.status));
      const processingOrders = orders.filter(o => o.status === 'processing');
      const deliveryOrders = orders.filter(o => o.status === 'out_for_delivery');
      const readyOrders = orders.filter(o => o.status === 'ready');
      const revenueToday = todayOrders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total || o.total_amount || 0), 0);
      const newCustomers = users.filter(u => 
        u.role === 'customer' && u.created_at?.startsWith(today)
      ).length;

      return {
        orders_today: todayOrders.length,
        pending_orders: pendingOrders.length,
        processing_orders: processingOrders.length,
        ready_orders: readyOrders.length,
        out_for_delivery: deliveryOrders.length,
        revenue_today: revenueToday,
        new_customers_today: newCustomers,
      };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const { data: orders, error } = await supabase.from('orders')
      .select('status,payment_status,total,total_amount,created_at');
    if (error) throw error;
    const all = orders || [];
    const todayOrders = all.filter(o => o.created_at?.startsWith(today));
    return {
      orders_today:        todayOrders.length,
      pending_orders:      all.filter(o => ['pending_pickup','picked_up'].includes(o.status)).length,
      processing_orders:   all.filter(o => o.status === 'processing').length,
      ready_orders:        all.filter(o => o.status === 'ready').length,
      out_for_delivery:    all.filter(o => o.status === 'out_for_delivery').length,
      revenue_today:       todayOrders.filter(o => o.payment_status === 'paid').reduce((s,o) => s + (o.total || o.total_amount || 0), 0),
      new_customers_today: 0,
    };
  },

  // Check-in operations
  async checkIn(userId, locationData) {
    const today = new Date().toISOString().split('T')[0];
    const checkinData = {
      user_id: userId,
      check_date: today,
      check_time: new Date().toISOString(),
      type: 'check_in',
      latitude: locationData?.latitude || null,
      longitude: locationData?.longitude || null,
      location_address: locationData?.address || null,
      notes: locationData?.notes || null,
    };
    return this.create('checkins', checkinData);
  },

  async checkOut(userId, locationData) {
    const today = new Date().toISOString().split('T')[0];
    
    // Create a new check_out record
    const checkoutData = {
      user_id: userId,
      check_date: today,
      check_time: new Date().toISOString(),
      type: 'check_out',
      latitude: locationData?.latitude || null,
      longitude: locationData?.longitude || null,
      location_address: locationData?.address || null,
      notes: locationData?.notes || null,
    };
    return this.create('checkins', checkoutData);
  },

  async getTodayCheckin(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const checkins = await idb.getAll('checkins');
      const todayRecords = checkins.filter(c => c.user_id === userId && c.check_date === today);
      // Support both old format (check_in_time on record) and new format (type + check_time)
      const checkInRec = todayRecords.find(c => c.type === 'check_in') || todayRecords.find(c => c.check_in_time);
      const checkOutRec = todayRecords.find(c => c.type === 'check_out');
      
      if (!checkInRec) return null;
      return {
        ...checkInRec,
        check_in_time: checkInRec.check_time || checkInRec.check_in_time,
        check_out_time: checkOutRec?.check_time || checkInRec.check_out_time || null,
        check_in_location: checkInRec.location_address 
          ? { address: checkInRec.location_address, latitude: checkInRec.latitude, longitude: checkInRec.longitude }
          : checkInRec.check_in_location || null,
        check_out_location: checkOutRec?.location_address
          ? { address: checkOutRec.location_address, latitude: checkOutRec.latitude, longitude: checkOutRec.longitude }
          : checkInRec.check_out_location || null,
      };
    }
    
    const { data } = await supabase
      .from('checkins').select('*')
      .eq('user_id', userId).eq('check_date', today)
      .order('check_time', { ascending: true });
    if (!data?.length) return null;
    const ci = data.find(c => c.type === 'check_in');
    const co = data.find(c => c.type === 'check_out');
    if (!ci) return null;
    return {
      ...ci,
      check_in_time:  ci.check_time,
      check_out_time: co?.check_time || null,
      check_in_location:  ci.location_address ? { address: ci.location_address, latitude: ci.latitude, longitude: ci.longitude } : null,
      check_out_location: co?.location_address ? { address: co.location_address, latitude: co.latitude, longitude: co.longitude } : null,
    };
  },

  // Helper to combine check-in and check-out records per user into UI-expected format
  _combineCheckinRecords(records, users) {
    // Group by user_id
    const byUser = {};
    for (const rec of records) {
      if (!byUser[rec.user_id]) byUser[rec.user_id] = [];
      byUser[rec.user_id].push(rec);
    }
    
    return Object.entries(byUser).map(([userId, recs]) => {
      const checkInRec = recs.find(c => c.type === 'check_in') || recs.find(c => c.check_in_time);
      const checkOutRec = recs.find(c => c.type === 'check_out');
      const base = checkInRec || recs[0];
      const user = users ? (base.user || users.find(u => u.id === userId)) : base.user;
      
      return {
        ...base,
        user,
        check_in_time: checkInRec?.check_time || checkInRec?.check_in_time || base.check_time,
        check_out_time: checkOutRec?.check_time || base.check_out_time || null,
        check_in_location: (checkInRec?.location_address || base.location_address)
          ? { address: checkInRec?.location_address || base.location_address }
          : checkInRec?.check_in_location || base.check_in_location || null,
        check_out_location: checkOutRec?.location_address
          ? { address: checkOutRec.location_address }
          : base.check_out_location || null,
      };
    }).sort((a, b) => new Date(b.check_in_time || b.check_time || 0) - new Date(a.check_in_time || a.check_time || 0));
  },

  async getCheckinHistory(userId, limit = 30) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const checkins = await idb.getAll('checkins');
      // Group by date
      const userCheckins = checkins.filter(c => c.user_id === userId);
      const byDate = {};
      for (const c of userCheckins) {
        const date = c.check_date || c.check_time?.split('T')[0] || '';
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(c);
      }
      return Object.values(byDate)
        .map(recs => {
          const checkIn = recs.find(r => r.type === 'check_in') || recs[0];
          const checkOut = recs.find(r => r.type === 'check_out');
          return {
            ...checkIn,
            check_in_time: checkIn.check_time || checkIn.check_in_time,
            check_out_time: checkOut?.check_time || checkIn.check_out_time || null,
          };
        })
        .sort((a, b) => new Date(b.check_in_time || 0) - new Date(a.check_in_time || 0))
        .slice(0, limit);
    }
    
    const { data, error } = await supabase
      .from('checkins').select('*')
      .eq('user_id', userId)
      .order('check_time', { ascending: false })
      .limit(limit * 2);
    if (error) { console.warn('Checkin history error:', error.message); return []; }
    const byDate = {};
    for (const c of (data || [])) {
      const d = c.check_date || '';
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(c);
    }
    return Object.values(byDate).map(day => {
      const ci = day.find(r => r.type === 'check_in') || day[0];
      const co = day.find(r => r.type === 'check_out');
      return { ...ci, check_in_time: ci.check_time, check_out_time: co?.check_time || null,
        check_in_location:  ci.location_address  ? { address: ci.location_address }  : null,
        check_out_location: co?.location_address ? { address: co.location_address } : null };
    }).sort((a,b) => new Date(b.check_in_time||0) - new Date(a.check_in_time||0)).slice(0, limit);
  },

  async getAllTodayCheckins() {
    const today = new Date().toISOString().split('T')[0];
    
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const checkins = await idb.getAll('checkins');
      const users = await idb.getAll('users');
      const todayRecords = checkins.filter(c => c.check_date === today);
      return this._combineCheckinRecords(
        todayRecords.map(c => ({ ...c, user: users.find(u => u.id === c.user_id) })),
        users
      );
    }
    
    try {
      const { data, error } = await supabase
        .from('checkins')
        .select('*, user:users!checkins_user_id_fkey(*)')
        .eq('check_date', today)
        .order('check_time', { ascending: false });
      if (error) throw error;
      return this._combineCheckinRecords(data || []);
    } catch (err) {
      try {
        const { data: checkins } = await supabase.from('checkins').select('*').eq('check_date', today);
        if (!checkins?.length) return [];
        const ids = [...new Set(checkins.map(c => c.user_id).filter(Boolean))];
        const { data: users } = await supabase.from('users').select('*').in('id', ids);
        const umap = Object.fromEntries((users||[]).map(u => [u.id, u]));
        return this._combineCheckinRecords(checkins.map(c => ({ ...c, user: umap[c.user_id]||null })));
      } catch (e) { console.error('getAllTodayCheckins error:', e); return []; }
    }
  },

  // User creation with password
  // Uses SHA-256 hash + direct insert for both demo and live modes
  // (supabase.auth.admin.createUser requires SERVICE_ROLE key which we don't have)
  async createUserWithPassword(userData, password) {
    const passwordHash = await hashPassword(password);
    
    return this.create('users', {
      ...userData,
      password_hash: passwordHash,
    });
  },

  // Verify password
  async verifyPassword(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) return { valid: false };

    // If no password hash, allow login (backwards compatibility)
    if (!user.password_hash) return { valid: true, user };

    const isValid = await verifyPassword(password, user.password_hash);
    return {
      valid: isValid,
      user: isValid ? user : null
    };
  },

  // ============================================
  // PARTNER SERVICES OPERATIONS
  // ============================================

  // Create a new service for a partner/depot
  async createPartnerService(service) {
    if (getMode() === 'demo') {
      const record = {
        ...service,
        id: service.id || generateId(),
        is_active: service.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const idb = await initDemoDB();
      await idb.put('partner_services', record);
      return record;
    }

    const record = {
      ...service,
      is_active: service.is_active ?? true,
    };
    delete record.id;
    delete record.created_at;
    delete record.updated_at;

    const { data, error } = await supabase
      .from('partner_services')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update a partner service
  async updatePartnerService(id, updates) {
    const record = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const existing = await idb.get('partner_services', id);
      if (!existing) throw new Error('Service not found');
      const updated = { ...existing, ...record };
      await idb.put('partner_services', updated);
      return updated;
    }

    const { data, error } = await supabase
      .from('partner_services')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Delete a partner service
  async deletePartnerService(id) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      await idb.delete('partner_services', id);
      return true;
    }

    const { error } = await supabase
      .from('partner_services')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Get all services for a specific depot
  async getPartnerServices(depotId) {
    if (getMode() === 'demo') {
      const idb = await initDemoDB();
      const services = await idb.getAll('partner_services');
      return services
        .filter(s => s.depot_id === depotId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const { data, error } = await supabase
      .from('partner_services')
      .select('*')
      .eq('depot_id', depotId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // ============================================
  // PARTNER INVOICES OPERATIONS
  // ============================================

  // Create a new invoice (always uses IndexedDB)
  async createInvoice(invoice) {
    const record = {
      ...invoice,
      id: invoice.id || generateId(),
      sms_sent: invoice.sms_sent ?? false,
      sms_sent_at: invoice.sms_sent_at || null,
      paid_date: invoice.paid_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const idb = await initDemoDB();
    await idb.put('partner_invoices', record);
    return record;
  },

  // Get all invoices for a specific depot (always uses IndexedDB)
  async getInvoicesByDepot(depotId, filters = {}) {
    const idb = await initDemoDB();
    let invoices = await idb.getAll('partner_invoices');
    invoices = invoices.filter(inv => inv.depot_id === depotId);

    // Apply filters
    if (filters.status) {
      invoices = invoices.filter(inv => inv.status === filters.status);
    }
    if (filters.customer_id) {
      invoices = invoices.filter(inv => inv.customer_id === filters.customer_id);
    }
    if (filters.date_from) {
      invoices = invoices.filter(inv => inv.issued_date >= filters.date_from);
    }
    if (filters.date_to) {
      invoices = invoices.filter(inv => inv.issued_date <= filters.date_to);
    }

    return invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // Get a single invoice by ID (always uses IndexedDB)
  async getInvoiceById(id) {
    const idb = await initDemoDB();
    return idb.get('partner_invoices', id);
  },

  // Update invoice status (and optionally paid_date) — always uses IndexedDB
  async updateInvoiceStatus(id, status, paid_date = null) {
    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'paid' && paid_date) {
      updates.paid_date = paid_date;
    }

    const idb = await initDemoDB();
    const existing = await idb.get('partner_invoices', id);
    if (!existing) throw new Error('Invoice not found');
    const updated = { ...existing, ...updates };
    await idb.put('partner_invoices', updated);
    return updated;
  },

  // Update invoice fields — always uses IndexedDB
  async updateInvoice(id, updates) {
    const record = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const idb = await initDemoDB();
    const existing = await idb.get('partner_invoices', id);
    if (!existing) throw new Error('Invoice not found');
    const updated = { ...existing, ...record };
    await idb.put('partner_invoices', updated);
    return updated;
  },
};

// Seed depot extras (runs even on upgraded DBs, safe to call multiple times)
async function seedDepotExtras(idb) {
  const demoPasswordHash = 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791';

  // Update existing depots with capacity + operating hours
  const depotUpdates = {
    'depot-1': {
      capacity_per_day: 500,
      phone: '437-215-6321',
      operating_hours: {
        mon: { open: '07:00', close: '21:00', closed: false },
        tue: { open: '07:00', close: '21:00', closed: false },
        wed: { open: '07:00', close: '21:00', closed: false },
        thu: { open: '07:00', close: '21:00', closed: false },
        fri: { open: '07:00', close: '21:00', closed: false },
        sat: { open: '09:00', close: '18:00', closed: false },
        sun: { open: '10:00', close: '16:00', closed: false },
      },
    },
    'depot-2': {
      capacity_per_day: 350,
      phone: '647-764-5658',
      operating_hours: {
        mon: { open: '08:00', close: '20:00', closed: false },
        tue: { open: '08:00', close: '20:00', closed: false },
        wed: { open: '08:00', close: '20:00', closed: false },
        thu: { open: '08:00', close: '20:00', closed: false },
        fri: { open: '08:00', close: '20:00', closed: false },
        sat: { open: '09:00', close: '17:00', closed: false },
        sun: { open: '00:00', close: '00:00', closed: true },
      },
    },
  };

  for (const [depotId, updates] of Object.entries(depotUpdates)) {
    const existing = await idb.get('depots', depotId);
    if (existing && !existing.capacity_per_day) {
      await idb.put('depots', { ...existing, ...updates, updated_at: new Date().toISOString() });
    }
  }

  // Add partner demo user if not exists
  const existingPartner = await idb.get('users', 'user-partner');
  if (!existingPartner) {
    await idb.put('users', {
      id: 'user-partner',
      email: 'partner@amanicleaners.com',
      phone: '16475550020',
      first_name: 'CleanPro',
      last_name: 'Partners',
      role: 'partner',
      depot_id: 'depot-2',
      password_hash: demoPasswordHash,
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
    });
    // Link partner as manager of depot-2
    const depot2 = await idb.get('depots', 'depot-2');
    if (depot2 && !depot2.manager_id) {
      await idb.put('depots', { ...depot2, manager_id: 'user-partner', updated_at: new Date().toISOString() });
    }
  }

  // Add demo partner application if no partner apps exist
  let partnerApps = [];
  try { partnerApps = await idb.getAll('laundry_partner_applications'); } catch { /* store may not exist yet */ }
  if (partnerApps.length === 0) {
    await idb.put('laundry_partner_applications', {
      id: 'papp-demo-1',
      business_name: 'FreshPress Laundry',
      contact_person_first_name: 'Amanda',
      contact_person_last_name: 'Clarke',
      email: 'amanda@freshpress.ca',
      phone: '4165559876',
      business_address: '840 Lawrence Ave W, Toronto, ON M6A 1C4',
      business_license: 'ON-LP-2024-8432',
      years_operating: 6,
      capacity_per_day: 400,
      services_offered: 'Wash & fold, dry cleaning, shirt laundering, alterations',
      message: 'We have been operating in North York for 6 years and would love to partner with Amani\'s to serve more customers.',
      business_documents_url: '',
      status: 'pending',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await idb.put('laundry_partner_applications', {
      id: 'papp-demo-2',
      business_name: 'CleanPro Partners',
      contact_person_first_name: 'CleanPro',
      contact_person_last_name: 'Partners',
      email: 'partner@amanicleaners.com',
      phone: '16475550020',
      business_address: '3455 Weston Road, North York, ON M9M 0G4',
      business_license: 'ON-LP-2023-1122',
      years_operating: 4,
      capacity_per_day: 350,
      services_offered: 'Wash & fold, dry cleaning, comforters, uniform cleaning',
      message: 'Long-time laundry operator in North York, eager to join the Amani network.',
      business_documents_url: '',
      status: 'approved',
      depot_id: 'depot-2',
      partner_user_id: 'user-partner',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Add demo driver application if no driver apps exist
  let driverApps = [];
  try { driverApps = await idb.getAll('driver_applications'); } catch { /* store may not exist yet */ }
  if (driverApps.length === 0) {
    await idb.put('driver_applications', {
      id: 'dapp-demo-1',
      first_name: 'James',
      last_name: 'Okafor',
      email: 'james.okafor@email.com',
      phone: '4165557788',
      city: 'Scarborough',
      vehicle_type: 'SUV',
      has_insurance: true,
      availability: 'Weekdays only',
      years_of_experience: 5,
      experience_details: 'Previous courier experience with UPS and local delivery companies.',
      message: 'Looking to join a growing company. I am reliable and punctual.',
      status: 'pending',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
}

// Seed demo data
async function seedDemoData(idb) {
  const existingUsers = await idb.getAll('users');
  if (existingUsers.length > 0) return;

  // Service categories
  const categories = [
    { id: 'cat-1', name: 'Laundry', slug: 'laundry', description: 'Wash & Fold services', icon: 'washing-machine', display_order: 1 },
    { id: 'cat-2', name: 'Shirts & Blouses', slug: 'shirts-blouses', description: 'Professional shirt cleaning', icon: 'shirt', display_order: 2 },
    { id: 'cat-3', name: 'Pants & Shorts', slug: 'pants-shorts', description: 'All types of bottoms', icon: 'pants', display_order: 3 },
    { id: 'cat-4', name: 'Skirts', slug: 'skirts', description: 'Skirts of all lengths', icon: 'skirt', display_order: 4 },
    { id: 'cat-5', name: 'Dresses', slug: 'dresses', description: 'From casual to formal', icon: 'dress', display_order: 5 },
    { id: 'cat-6', name: 'Jackets', slug: 'jackets', description: 'Blazers, coats, and more', icon: 'jacket', display_order: 6 },
    { id: 'cat-7', name: 'Sweaters', slug: 'sweaters', description: 'Delicate knit care', icon: 'sweater', display_order: 7 },
    { id: 'cat-8', name: 'Wedding & Formal', slug: 'wedding-formal', description: 'Special occasion attire', icon: 'wedding', display_order: 8 },
    { id: 'cat-9', name: 'Suits', slug: 'suits', description: 'Professional suit cleaning', icon: 'suit', display_order: 9 },
    { id: 'cat-10', name: 'Ties & Scarves', slug: 'ties-scarves', description: 'Accessories', icon: 'tie', display_order: 10 },
    { id: 'cat-11', name: 'Coats & Winter Wear', slug: 'coats-winter', description: 'Heavy outerwear', icon: 'coat', display_order: 11 },
    { id: 'cat-12', name: 'Bedding', slug: 'bedding', description: 'Blankets, comforters, duvets', icon: 'bed', display_order: 12 },
    { id: 'cat-13', name: 'Culinary Linen', slug: 'culinary-linen', description: 'Restaurant & kitchen linens', icon: 'utensils', display_order: 13 },
  ];

  for (const cat of categories) {
    await idb.put('service_categories', { ...cat, is_active: true, created_at: new Date().toISOString() });
  }

  // Services (pricing)
  const services = [
    // Laundry
    { id: 'srv-1', category_id: 'cat-1', name: 'Wash & Fold (Regular)', base_price: 2.39, price_type: 'per_lb', service_type: 'wash_fold' },
    { id: 'srv-2', category_id: 'cat-1', name: 'Wash & Fold (Commercial)', base_price: 2.25, price_type: 'per_lb', service_type: 'wash_fold' },
    // Shirts
    { id: 'srv-3', category_id: 'cat-2', name: 'Shirts - Laundered On Hanger', base_price: 6.50, price_type: 'fixed', service_type: 'wash_fold' },
    { id: 'srv-4', category_id: 'cat-2', name: 'Shirts - Dryclean On Hanger', base_price: 8.50, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-5', category_id: 'cat-2', name: 'Shirts - Dryclean Folded', base_price: 9.50, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-6', category_id: 'cat-2', name: 'Shirts - Polo/Golf', base_price: 8.50, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-7', category_id: 'cat-2', name: 'Blouse', base_price: 12.00, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-8', category_id: 'cat-2', name: 'Blouse - Silk or Linen', base_price: 15.00, price_type: 'fixed', service_type: 'dry_clean' },
    // Pants
    { id: 'srv-9', category_id: 'cat-3', name: 'Pants - Regular Poly-Blend', base_price: 9.50, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-10', category_id: 'cat-3', name: 'Pants - Cotton', base_price: 11.00, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-11', category_id: 'cat-3', name: 'Pants - Linen', base_price: 17.00, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-12', category_id: 'cat-3', name: 'Shorts', base_price: 8.00, price_type: 'fixed', service_type: 'dry_clean' },
    // Dresses
    { id: 'srv-13', category_id: 'cat-5', name: 'Dress - Regular', base_price: 18.00, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-14', category_id: 'cat-5', name: 'Dress - Pleated/Long', base_price: 20.00, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-15', category_id: 'cat-5', name: 'Dress - Cocktail/Fancy', base_price: 28.00, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-16', category_id: 'cat-5', name: 'Dress - Silk', base_price: 32.00, price_type: 'fixed', service_type: 'dry_clean' },
    // Jackets
    { id: 'srv-17', category_id: 'cat-6', name: 'Blazer/Suit Jacket', base_price: 14.00, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-18', category_id: 'cat-6', name: 'Heavy Jacket', base_price: 26.00, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-19', category_id: 'cat-6', name: 'Jean Jacket', base_price: 14.00, price_type: 'fixed', service_type: 'dry_clean' },
    { id: 'srv-20', category_id: 'cat-6', name: 'Canada Goose Jackets', base_price: 60.00, price_type: 'starting_from', service_type: 'dry_clean' },
    // Suits
    { id: 'srv-21', category_id: 'cat-9', name: "Men's or Women's 2 piece suit", base_price: 24.00, price_type: 'starting_from', service_type: 'dry_clean' },
    { id: 'srv-22', category_id: 'cat-9', name: "Men's or Women's 3 piece suit", base_price: 29.00, price_type: 'starting_from', service_type: 'dry_clean' },
    // Bedding
    { id: 'srv-23', category_id: 'cat-12', name: 'Blanket - Twin or Full', base_price: 25.00, price_type: 'fixed', service_type: 'wash_fold' },
    { id: 'srv-24', category_id: 'cat-12', name: 'Comforter - Queen or King', base_price: 45.00, price_type: 'fixed', service_type: 'wash_fold' },
    { id: 'srv-25', category_id: 'cat-12', name: 'Duvet', base_price: 45.00, price_type: 'starting_from', service_type: 'dry_clean' },
    // Wedding
    { id: 'srv-26', category_id: 'cat-8', name: 'Wedding Gowns Preserved and Boxed', base_price: 210.00, price_type: 'starting_from', service_type: 'specialty' },
    { id: 'srv-27', category_id: 'cat-8', name: 'Prom Dress', base_price: 28.00, price_type: 'starting_from', service_type: 'dry_clean' },
  ];

  for (const srv of services) {
    await idb.put('services', { ...srv, is_active: true, display_order: 1, created_at: new Date().toISOString() });
  }

  // Demo users - password is 'demo123' for all
  // Pre-computed SHA-256 hash of 'demo123'
  const demoPasswordHash = 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791';
  
  const users = [
    // Admin
    { id: 'user-admin', email: 'admin@amanicleaners.com', phone: '14372156321', first_name: 'Admin', last_name: 'Amani', role: 'admin', is_verified: true, password_hash: demoPasswordHash },
    // Drivers
    { id: 'user-driver', email: 'driver@amanicleaners.com', phone: '16475550001', first_name: 'Marcus', last_name: 'Thompson', role: 'driver', is_verified: true, vehicle: '2022 Honda Civic', license_plate: 'ABCD 123', rating: 4.9, total_deliveries: 342, on_duty: true, password_hash: demoPasswordHash },
    { id: 'user-driver-2', email: 'lisa.w@amanicleaners.com', phone: '16475550010', first_name: 'Lisa', last_name: 'Wang', role: 'driver', is_verified: true, vehicle: '2021 Toyota Corolla', license_plate: 'EFGH 456', rating: 4.8, total_deliveries: 287, on_duty: true, password_hash: demoPasswordHash },
    { id: 'user-driver-3', email: 'ahmed.h@amanicleaners.com', phone: '16475550011', first_name: 'Ahmed', last_name: 'Hassan', role: 'driver', is_verified: true, vehicle: '2023 Hyundai Elantra', license_plate: 'IJKL 789', rating: 4.7, total_deliveries: 156, on_duty: false, password_hash: demoPasswordHash },
    // Staff
    { id: 'user-staff', email: 'staff@amanicleaners.com', phone: '16475550002', first_name: 'Demo', last_name: 'Staff', role: 'staff', is_verified: true, password_hash: demoPasswordHash },
    // Customers
    { id: 'user-customer', email: 'customer@example.com', phone: '16475550003', first_name: 'John', last_name: 'Smith', role: 'customer', is_verified: true, password_hash: demoPasswordHash },
    { id: 'user-customer-2', email: 'sarah.j@email.com', phone: '14165551234', first_name: 'Sarah', last_name: 'Johnson', role: 'customer', is_verified: true, password_hash: demoPasswordHash },
    { id: 'user-customer-3', email: 'michael.c@email.com', phone: '14165552345', first_name: 'Michael', last_name: 'Chen', role: 'customer', is_verified: true, password_hash: demoPasswordHash },
    { id: 'user-customer-4', email: 'emily.w@email.com', phone: '14165553456', first_name: 'Emily', last_name: 'Williams', role: 'customer', is_verified: true, password_hash: demoPasswordHash },
    { id: 'user-customer-5', email: 'david.b@email.com', phone: '14165554567', first_name: 'David', last_name: 'Brown', role: 'customer', is_verified: true, password_hash: demoPasswordHash },
  ];

  for (const user of users) {
    await idb.put('users', { ...user, is_active: true, created_at: new Date().toISOString() });
  }

  // Demo addresses
  const addresses = [
    { id: 'addr-1', user_id: 'user-customer', label: 'Home', street: '123 Maple Street', city: 'Toronto', province: 'ON', postal_code: 'M5V 2H1', latitude: 43.6532, longitude: -79.3832, is_default: true },
    { id: 'addr-2', user_id: 'user-customer', label: 'Office', street: '456 Bay Street, Suite 500', city: 'Toronto', province: 'ON', postal_code: 'M5H 2Y4', latitude: 43.6505, longitude: -79.3803, is_default: false },
    { id: 'addr-3', user_id: 'user-customer-2', label: 'Home', street: '789 Queen Street West', city: 'Toronto', province: 'ON', postal_code: 'M6J 1G1', latitude: 43.6448, longitude: -79.4103, is_default: true },
    { id: 'addr-4', user_id: 'user-customer-3', label: 'Home', street: '321 Yonge Street', city: 'Toronto', province: 'ON', postal_code: 'M5B 1R8', latitude: 43.6565, longitude: -79.3812, is_default: true },
  ];

  for (const addr of addresses) {
    await idb.put('addresses', { ...addr, country: 'Canada', created_at: new Date().toISOString() });
  }

  // Depots
  const depots = [
    { id: 'depot-1', name: 'Amani Main - Weston', code: 'AMN-WEST1', street_address: '325 Weston Road, Unit 5D', city: 'Toronto', postal_code: 'M6N 3P1', latitude: 43.6858, longitude: -79.4732, status: 'active' },
    { id: 'depot-2', name: 'Amani North York', code: 'AMN-NORK', street_address: '3455 Weston Road', city: 'North York', postal_code: 'M9M 0G4', latitude: 43.7289, longitude: -79.5247, status: 'active' },
  ];

  for (const depot of depots) {
    await idb.put('depots', { ...depot, created_at: new Date().toISOString() });
  }

  // Subscription plans
  const plans = [
    { id: 'plan-1', name: 'Student Monthly', slug: 'student-monthly', type: 'student_monthly', price: 235.00, pounds_included: 100, validity_days: 30 },
    { id: 'plan-2', name: 'Student 1 Semester', slug: 'student-semester', type: 'student_semester', price: 575.00, pounds_included: 250, validity_days: 120 },
    { id: 'plan-3', name: 'Student 2 Semester (Popular)', slug: 'student-year', type: 'student_year', price: 1080.00, pounds_included: 500, validity_days: 240 },
    { id: 'plan-4', name: 'Silver - For Professionals', slug: 'silver', type: 'silver', price: 275.00, pounds_included: 120, validity_days: 30 },
    { id: 'plan-5', name: 'Gold - Ideal for Couples', slug: 'gold', type: 'gold', price: 420.50, pounds_included: 200, validity_days: 30 },
  ];

  for (const plan of plans) {
    await idb.put('subscription_plans', { ...plan, is_active: true, created_at: new Date().toISOString() });
  }

  // Discount codes
  const discounts = [
    { id: 'disc-1', code: 'WELCOME15', description: '15% off first order for new app signups', discount_type: 'percentage', discount_value: 15, first_order_only: true, is_active: true },
    { id: 'disc-2', code: 'FIRST20', description: '$20 off first laundry order', discount_type: 'fixed', discount_value: 20, first_order_only: true, is_active: true },
    { id: 'disc-3', code: 'SENIOR10', description: '10% senior discount (in-store)', discount_type: 'percentage', discount_value: 10, first_order_only: false, is_active: true },
  ];

  for (const disc of discounts) {
    await idb.put('discount_codes', { ...disc, uses_count: 0, created_at: new Date().toISOString() });
  }

  // Demo orders
  const demoOrders = [
    {
      id: 'order-1',
      reference_code: '1234567',
      user_id: 'user-customer',
      customer_id: 'user-customer',
      customer_name: 'John Smith',
      customer_email: 'customer@example.com',
      customer_phone: '647-555-0003',
      depot_id: 'depot-1',
      pickup_address_id: 'addr-1',
      delivery_address_id: 'addr-1',
      pickup_address: '123 Maple Street, Toronto, ON M5V 2H1',
      delivery_address: '123 Maple Street, Toronto, ON M5V 2H1',
      status: 'processing',
      subtotal: 50.50,
      tax: 6.57,
      total: 57.07,
      payment_status: 'pending',
      payment_method: 'cash',
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_time_slot: '7am-11am',
      delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      delivery_time_slot: '6pm-10pm',
      customer_notes: 'Please handle with care - delicate items',
    },
    {
      id: 'order-2',
      reference_code: '2345678',
      user_id: 'user-customer',
      customer_id: 'user-customer',
      customer_name: 'John Smith',
      customer_email: 'customer@example.com',
      customer_phone: '647-555-0003',
      depot_id: 'depot-1',
      pickup_address_id: 'addr-2',
      delivery_address_id: 'addr-1',
      pickup_address: '456 Bay Street, Suite 500, Toronto, ON M5H 2Y4',
      delivery_address: '123 Maple Street, Toronto, ON M5V 2H1',
      status: 'pending_pickup',
      subtotal: 132.00,
      tax: 17.16,
      total: 149.16,
      payment_status: 'pending',
      payment_method: 'cash',
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_time_slot: '6pm-10pm',
      delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      delivery_time_slot: '7am-11am',
      customer_notes: 'Please call when you arrive',
    },
    {
      id: 'order-4',
      reference_code: '4567890',
      user_id: 'user-customer',
      customer_id: 'user-customer',
      customer_name: 'Sarah Johnson',
      customer_email: 'sarah@example.com',
      customer_phone: '416-555-1234',
      depot_id: 'depot-1',
      pickup_address: '789 Queen Street West, Toronto, ON M6J 1G1',
      delivery_address: '789 Queen Street West, Toronto, ON M6J 1G1',
      status: 'pending_pickup',
      subtotal: 45.00,
      tax: 5.85,
      total: 50.85,
      payment_status: 'pending',
      payment_method: 'cash',
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_time_slot: '7am-11am',
      delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      delivery_time_slot: '6pm-10pm',
      customer_notes: 'Ring doorbell twice',
    },
    {
      id: 'order-3',
      reference_code: '3456789',
      user_id: 'user-customer',
      customer_id: 'user-customer',
      customer_name: 'John Smith',
      customer_email: 'customer@example.com',
      customer_phone: '647-555-0003',
      depot_id: 'depot-1',
      pickup_address: '123 Maple Street, Toronto, ON M5V 2H1',
      delivery_address: '123 Maple Street, Toronto, ON M5V 2H1',
      status: 'ready',
      subtotal: 68.64,
      tax: 8.92,
      total: 77.56,
      payment_status: 'pending',
      payment_method: 'cash',
      pickup_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      pickup_time_slot: '7am-11am',
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_time_slot: '6pm-10pm',
    },
    {
      id: 'order-5',
      reference_code: '5678901',
      user_id: 'user-customer-3',
      customer_id: 'user-customer-3',
      customer_name: 'Michael Chen',
      customer_email: 'michael.c@email.com',
      customer_phone: '416-555-2345',
      depot_id: 'depot-1',
      pickup_address: '321 Yonge Street, Toronto, ON M5B 1R8',
      delivery_address: '321 Yonge Street, Toronto, ON M5B 1R8',
      status: 'out_for_delivery',
      subtotal: 89.50,
      tax: 11.64,
      total: 101.14,
      payment_status: 'pending',
      payment_method: 'card',
      pickup_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      pickup_time_slot: '7am-11am',
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_time_slot: '6pm-10pm',
      customer_notes: 'Leave at concierge if not home',
    },
  ];

  for (const order of demoOrders) {
    await idb.put('orders', { ...order, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }

  // Order items for demo orders
  const orderItems = [
    { id: 'item-1', order_id: 'order-1', service_id: 'srv-3', service_name: 'Shirts - Laundered On Hanger', name: 'Shirts - Laundered On Hanger', quantity: 3, unit_price: 6.50, total_price: 19.50 },
    { id: 'item-2', order_id: 'order-1', service_id: 'srv-9', service_name: 'Pants - Regular Poly-Blend', name: 'Pants - Regular Poly-Blend', quantity: 2, unit_price: 9.50, total_price: 19.00 },
    { id: 'item-3', order_id: 'order-1', service_id: 'srv-7', service_name: 'Blouse', name: 'Blouse', quantity: 1, unit_price: 12.00, total_price: 12.00 },
    { id: 'item-4', order_id: 'order-2', service_id: 'srv-21', service_name: "Men's 2 piece suit", name: "Men's 2 piece suit", quantity: 2, unit_price: 24.00, total_price: 48.00 },
    { id: 'item-5', order_id: 'order-2', service_id: 'srv-23', service_name: 'Blanket - Twin or Full', name: 'Blanket - Twin or Full', quantity: 2, unit_price: 25.00, total_price: 50.00 },
    { id: 'item-6', order_id: 'order-2', service_id: 'srv-4', service_name: 'Shirts - Dryclean On Hanger', name: 'Shirts - Dryclean On Hanger', quantity: 4, unit_price: 8.50, total_price: 34.00 },
    { id: 'item-7', order_id: 'order-3', service_id: 'srv-1', service_name: 'Wash & Fold (Regular)', name: 'Wash & Fold (Regular)', quantity: 25, unit_price: 2.39, total_price: 59.75 },
    { id: 'item-8', order_id: 'order-3', service_id: 'srv-12', service_name: 'Shorts', name: 'Shorts', quantity: 1, unit_price: 8.00, total_price: 8.00 },
    { id: 'item-9', order_id: 'order-4', service_id: 'srv-3', service_name: 'Shirts - Laundered On Hanger', name: 'Shirts - Laundered On Hanger', quantity: 5, unit_price: 6.50, total_price: 32.50 },
    { id: 'item-10', order_id: 'order-4', service_id: 'srv-12', service_name: 'Shorts', name: 'Shorts', quantity: 2, unit_price: 8.00, total_price: 16.00 },
    { id: 'item-11', order_id: 'order-5', service_id: 'srv-21', service_name: "Men's 2 piece suit", name: "Men's 2 piece suit", quantity: 1, unit_price: 24.00, total_price: 24.00 },
    { id: 'item-12', order_id: 'order-5', service_id: 'srv-3', service_name: 'Shirts - Laundered On Hanger', name: 'Shirts - Laundered On Hanger', quantity: 8, unit_price: 6.50, total_price: 52.00 },
    { id: 'item-13', order_id: 'order-5', service_id: 'srv-12', service_name: 'Shorts', name: 'Shorts', quantity: 2, unit_price: 8.00, total_price: 16.00 },
  ];

  for (const item of orderItems) {
    await idb.put('order_items', { ...item, created_at: new Date().toISOString() });
  }

  // Driver routes for today
  const today = new Date().toISOString().split('T')[0];
  const driverRoutes = [
    {
      id: 'route-1',
      driver_id: 'user-driver',
      date: today,
      status: 'in_progress',
      route_type: 'pickup',
      vehicle_number: 'AMN-001',
      start_time: '07:00',
      end_time: '11:00',
    },
    {
      id: 'route-2',
      driver_id: 'user-driver',
      date: today,
      status: 'pending',
      route_type: 'delivery',
      vehicle_number: 'AMN-001',
      start_time: '18:00',
      end_time: '22:00',
    },
  ];

  for (const route of driverRoutes) {
    await idb.put('driver_routes', { ...route, created_at: new Date().toISOString() });
  }

  // Route stops
  const routeStops = [
    {
      id: 'stop-1',
      route_id: 'route-1',
      order_id: 'order-1',
      sequence_number: 1,
      stop_type: 'pickup',
      status: 'completed',
      address: '123 Maple Street, Toronto, ON M5V 2H1',
      customer_name: 'John Smith',
      customer_phone: '647-555-0003',
      estimated_time: '07:30',
      arrived_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    },
    {
      id: 'stop-2',
      route_id: 'route-1',
      order_id: 'order-2',
      sequence_number: 2,
      stop_type: 'pickup',
      status: 'pending',
      address: '456 Bay Street, Suite 500, Toronto, ON M5H 2Y4',
      customer_name: 'John Smith',
      customer_phone: '647-555-0003',
      estimated_time: '08:15',
    },
    {
      id: 'stop-3',
      route_id: 'route-2',
      order_id: 'order-1',
      sequence_number: 1,
      stop_type: 'delivery',
      status: 'pending',
      address: '123 Maple Street, Toronto, ON M5V 2H1',
      customer_name: 'John Smith',
      customer_phone: '647-555-0003',
      estimated_time: '18:30',
    },
  ];

  for (const stop of routeStops) {
    await idb.put('route_stops', { ...stop, created_at: new Date().toISOString() });
  }

  // Service areas
  const serviceAreas = [
    { id: 'area-1', name: 'Toronto', region: 'Toronto', postal_code_prefix: 'M', is_active: true },
    { id: 'area-2', name: 'North York', region: 'Toronto', postal_code_prefix: 'M', is_active: true },
    { id: 'area-3', name: 'Brampton', region: 'Peel', postal_code_prefix: 'L', is_active: true },
    { id: 'area-4', name: 'Mississauga', region: 'Peel', postal_code_prefix: 'L', is_active: true },
    { id: 'area-5', name: 'Vaughan', region: 'York', postal_code_prefix: 'L', is_active: true },
    { id: 'area-6', name: 'Richmond Hill', region: 'York', postal_code_prefix: 'L', is_active: true },
    { id: 'area-7', name: 'Markham', region: 'York', postal_code_prefix: 'L', is_active: true },
  ];

  for (const area of serviceAreas) {
    await idb.put('service_areas', { ...area, min_order_amount: 64.01, created_at: new Date().toISOString() });
  }

  // Settings
  const settings = [
    { key: 'business_info', value: { name: "Amani's Cleaners", slogan: 'Proudly Canadian Owned since 2013', phone: ['437-215-6321', '647-764-5658'], email: 'amaniscleaners@gmail.com', website: 'amanicleaners.com' } },
    { key: 'operating_hours', value: { pickup: ['7:00 AM - 11:00 AM', '6:00 PM - 10:00 PM'], delivery: ['7:00 AM - 11:00 AM', '6:00 PM - 10:00 PM'] } },
    { key: 'pricing_rules', value: { min_order_weight: 23, min_order_amount: 64.01, same_day_fee_range: [20, 35], tax_rate: 0.13 } },
    { key: 'app_mode', value: { mode: 'live', demo_enabled: false } },
  ];

  for (const setting of settings) {
    await idb.put('settings', { ...setting, updated_at: new Date().toISOString() });
  }

  console.log('Demo data seeded successfully!');
}

export default db;