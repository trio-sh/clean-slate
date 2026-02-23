import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import db from '../lib/db';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login with email and password
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await db.loginWithEmail(email, password);
          set({ user: result.user, isAuthenticated: true, isLoading: false });
          return { success: true, user: result.user };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Login with phone and password
      loginWithPhone: async (phone, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await db.loginWithPhone(phone, password);
          set({ user: result.user, isAuthenticated: true, isLoading: false });
          return { success: true, user: result.user };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Quick demo login by role (no password needed in demo mode)
      loginAsRole: async (role) => {
        set({ isLoading: true, error: null });
        try {
          const users = await db.getAll('users');
          const user = users.find(u => u.role === role);
          if (user) {
            set({ user, isAuthenticated: true, isLoading: false });
            return { success: true, user };
          }
          throw new Error(`No ${role} user found`);
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Register new user
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const result = await db.registerWithEmail(userData);
          set({ user: result.user, isAuthenticated: true, isLoading: false });
          return { success: true, user: result.user };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await db.logout();
        } catch (e) {
          console.error('Logout error:', e);
        }
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return { success: false, error: 'Not authenticated' };

        try {
          const updated = await db.update('users', user.id, updates);
          set({ user: updated });
          return { success: true, user: updated };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      updatePassword: async (newPassword) => {
        const { user } = get();
        if (!user) return { success: false, error: 'Not authenticated' };

        try {
          await db.updatePassword(user.id, newPassword);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'amani-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Cart Store
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      laundryWeight: 0, // Regular Wash & Fold
      commercialLaundryWeight: 0, // Commercial Wash & Fold

      addItem: (item) => {
        const { items } = get();
        const existingIndex = items.findIndex(i => i.id === item.id);

        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex].quantity += item.quantity || 1;
          set({ items: newItems });
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
        }
      },

      removeItem: (itemId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          set({ items: items.filter(item => item.id !== itemId) });
        } else {
          const newItems = items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          );
          set({ items: newItems });
        }
      },

      setLaundryWeight: (weight) => set({ laundryWeight: weight }),
      setCommercialLaundryWeight: (weight) => set({ commercialLaundryWeight: weight }),

      clearCart: () => set({ items: [], laundryWeight: 0, commercialLaundryWeight: 0 }),

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      // Addon helpers
      hasSameDayService: () => {
        const { items } = get();
        return items.some(item => item.isAddon && item.addonType === 'same-day');
      },

      getSameDayAddon: () => {
        const { items } = get();
        return items.find(item => item.isAddon && item.addonType === 'same-day');
      },

      getAddons: () => {
        const { items } = get();
        return items.filter(item => item.isAddon);
      },

      getRegularItems: () => {
        const { items } = get();
        return items.filter(item => !item.isAddon);
      },
    }),
    {
      name: 'amani-cart',
    }
  )
);

// Order Store
export const useOrderStore = create((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  fetchOrders: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const orders = await db.getOrdersWithDetails(filters);
      set({ orders, loading: false });
      return orders;
    } catch (error) {
      console.error('fetchOrders error:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },

  fetchOrderByReference: async (referenceCode) => {
    set({ loading: true, error: null });
    try {
      const order = await db.getOrderByReference(referenceCode);
      set({ currentOrder: order, loading: false });
      return order;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  createOrder: async (orderData) => {
    set({ loading: true, error: null });
    try {
      const order = await db.createOrder(orderData);
      
      // Create order items - items are already in flat format from OrderPage
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          // Check if service_id is a valid UUID
          // This handles special cases like 'laundry' which isn't in the services table
          const isValidUUID = item.service_id && 
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.service_id);
          
          // Build order item data - only include service_id if it's a valid UUID
          const orderItemData = {
            order_id: order.id,
            service_name: item.service_name || item.name,
            name: item.name || item.service_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          };
          
          // Only add service_id if it's a valid UUID
          if (isValidUUID) {
            orderItemData.service_id = item.service_id;
          }
          
          await db.create('order_items', orderItemData);
        }
      }

      set({ currentOrder: order, loading: false });
      return { success: true, order, referenceCode: order.reference_code };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  updateOrderStatus: async (orderId, status, notes = '') => {
    try {
      const updates = { status };
      
      // Set timestamps based on status
      const now = new Date().toISOString();
      switch (status) {
        case 'confirmed': updates.confirmed_at = now; break;
        case 'picked_up': updates.picked_up_at = now; break;
        case 'processing': updates.processing_started_at = now; break;
        case 'ready': updates.ready_at = now; break;
        case 'out_for_delivery': updates.out_for_delivery_at = now; break;
        case 'delivered': updates.delivered_at = now; break;
        case 'completed': updates.completed_at = now; break;
        case 'cancelled': updates.cancelled_at = now; break;
      }

      const order = await db.update('orders', orderId, updates);
      
      // Get full order data for notification
      const fullOrder = await db.getById('orders', orderId);
      
      // Send notification to customer based on status
      if (fullOrder?.customer_id) {
        try {
          const { notificationService, notificationTemplates } = await import('../lib/utils');
          let notification = null;
          
          switch (status) {
            case 'picked_up':
              notification = notificationTemplates.orderPickedUp(fullOrder);
              break;
            case 'ready':
              notification = notificationTemplates.orderReady(fullOrder);
              break;
            case 'out_for_delivery':
              notification = notificationTemplates.orderOutForDelivery(fullOrder);
              break;
            case 'delivered':
              notification = notificationTemplates.orderDelivered(fullOrder);
              break;
          }
          
          if (notification) {
            await notificationService.sendToUser(fullOrder.customer_id, notification);
          }
        } catch (e) {
          console.error('Failed to send status notification:', e);
        }
      }
      
      // Update local state
      const { orders } = get();
      set({
        orders: orders.map(o => o.id === orderId ? { ...o, ...updates } : o),
        currentOrder: order,
      });
      
      return { success: true, order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));

// App Mode Store
export const useAppStore = create(
  persist(
    (set, get) => ({
      mode: 'live', // 'demo' or 'live' - now controlled by admin
      demoEnabled: false, // Whether demo mode is allowed (controlled by admin)
      sidebarOpen: true,
      notifications: [],
      settingsLoaded: false,

      // Load app mode settings from database
      loadAppModeSettings: async () => {
        try {
          const settings = await db.getAppModeSettings();
          set({ 
            mode: settings.mode || 'live', 
            demoEnabled: settings.demo_enabled || false,
            settingsLoaded: true 
          });
          // Also update localStorage for consistency
          db.setMode(settings.mode || 'live');
          return settings;
        } catch (error) {
          console.error('Error loading app mode settings:', error);
          set({ settingsLoaded: true });
          return null;
        }
      },

      // Admin function to toggle demo mode
      setDemoEnabled: async (enabled) => {
        try {
          const currentMode = get().mode;
          const newSettings = { 
            mode: enabled ? 'demo' : 'live', 
            demo_enabled: enabled 
          };
          await db.setAppModeSettings(newSettings);
          db.setMode(newSettings.mode);
          set({ demoEnabled: enabled, mode: newSettings.mode });
          return true;
        } catch (error) {
          console.error('Error updating demo mode:', error);
          return false;
        }
      },

      setMode: (mode) => {
        db.setMode(mode);
        set({ mode });
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      addNotification: (notification) => {
        const id = Date.now();
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id }],
        }));
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        }, 5000);
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
    }),
    {
      name: 'amani-app',
      partialize: (state) => ({ mode: state.mode, demoEnabled: state.demoEnabled }),
    }
  )
);

// Services Store
export const useServicesStore = create((set) => ({
  categories: [],
  services: [],
  isLoading: false,

  fetchServices: async () => {
    set({ isLoading: true });
    try {
      const categories = await db.getAll('service_categories');
      const services = await db.getAll('services');
      
      // Sort by display order
      categories.sort((a, b) => a.display_order - b.display_order);
      
      set({ categories, services, isLoading: false });
    } catch (error) {
      console.error('Error fetching services:', error);
      set({ isLoading: false });
    }
  },

  getServicesByCategory: (categoryId) => {
    const { services } = useServicesStore.getState();
    return services.filter(s => s.category_id === categoryId && s.is_active);
  },
}));

// Driver Store
export const useDriverStore = create((set, get) => ({
  routes: [],
  currentRoute: null,
  isLoading: false,

  fetchRoutes: async (driverId, date) => {
    set({ isLoading: true });
    try {
      const routes = await db.getDriverRoutes(driverId, date);
      set({ routes, isLoading: false });
      return routes;
    } catch (error) {
      console.error('Error fetching routes:', error);
      set({ isLoading: false });
      return [];
    }
  },

  updateStopStatus: async (stopId, status) => {
    try {
      const updates = { status };
      if (status === 'arrived') updates.arrived_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      
      await db.update('route_stops', stopId, updates);
      
      // Refresh routes
      const { routes } = get();
      // ... update logic
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));

// Stats Store
export const useStatsStore = create((set) => ({
  stats: null,
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const stats = await db.getDashboardStats();
      set({ stats, isLoading: false });
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      set({ isLoading: false });
      return null;
    }
  },
}));

// Notification Store - Syncs with database
export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,
      lastFetch: null,
      
      // Load notifications from database for a user
      loadNotifications: async (userId) => {
        if (!userId) return;
        
        set({ loading: true });
        try {
          const db = (await import('../lib/db')).default;
          const notifications = await db.getByField('notifications', 'user_id', userId);
          
          // Sort by created_at descending
          const sorted = (notifications || [])
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 50);
          
          const unreadCount = sorted.filter(n => !n.is_read).length;
          
          set({ 
            notifications: sorted, 
            unreadCount,
            loading: false,
            lastFetch: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to load notifications:', error);
          set({ loading: false });
        }
      },
      
      // Add notification (for local use, not for sending to others)
      addNotification: (notification) => {
        const newNotification = {
          id: `notif-${Date.now()}`,
          created_at: new Date().toISOString(),
          is_read: false,
          read: false,
          ...notification,
        };
        set(state => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }));
        return newNotification;
      },
      
      // Mark single notification as read
      markAsRead: async (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId ? { ...n, is_read: true, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
        
        // Also update in database
        try {
          const db = (await import('../lib/db')).default;
          await db.update('notifications', notificationId, { is_read: true });
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      },
      
      // Mark all notifications as read
      markAllAsRead: async (userId) => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, is_read: true, read: true })),
          unreadCount: 0,
        }));
        
        // Also update in database
        if (userId) {
          try {
            const db = (await import('../lib/db')).default;
            const notifications = await db.getByField('notifications', 'user_id', userId);
            for (const notif of notifications || []) {
              if (!notif.is_read) {
                await db.update('notifications', notif.id, { is_read: true });
              }
            }
          } catch (error) {
            console.error('Failed to mark all as read:', error);
          }
        }
      },
      
      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },
      
      removeNotification: async (notificationId) => {
        set(state => {
          const notification = state.notifications.find(n => n.id === notificationId);
          return {
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: notification && !notification.is_read ? state.unreadCount - 1 : state.unreadCount,
          };
        });
        
        // Also delete from database
        try {
          const db = (await import('../lib/db')).default;
          await db.delete('notifications', notificationId);
        } catch (error) {
          console.error('Failed to delete notification:', error);
        }
      },
      
      // Refresh notifications (poll for new ones)
      refresh: async (userId) => {
        if (!userId) return;
        await get().loadNotifications(userId);
      },
    }),
    {
      name: 'amani-notifications',
      partialize: (state) => ({ 
        // Only persist essential data, not loading state
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// Global search store for dashboard
export const useSearchStore = create((set, get) => ({
  searchQuery: '',
  searchResults: {
    orders: [],
    customers: [],
    drivers: [],
  },
  isSearching: false,
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  search: async (query) => {
    if (!query || query.length < 2) {
      set({ searchResults: { orders: [], customers: [], drivers: [] }, isSearching: false });
      return;
    }
    
    set({ isSearching: true });
    try {
      const [allOrders, allUsers] = await Promise.all([
        db.getAll('orders'),
        db.getAll('users'),
      ]);
      
      const queryLower = query.toLowerCase();
      
      // Search orders by reference code, customer name, phone
      const orders = allOrders.filter(o => 
        o.reference_code?.toLowerCase().includes(queryLower) ||
        o.customer_name?.toLowerCase().includes(queryLower) ||
        o.customer_phone?.includes(query)
      ).slice(0, 5);
      
      // Search customers
      const customers = allUsers.filter(u => 
        u.role === 'customer' && (
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(queryLower) ||
          u.email?.toLowerCase().includes(queryLower) ||
          u.phone?.includes(query)
        )
      ).slice(0, 5);
      
      // Search drivers
      const drivers = allUsers.filter(u => 
        u.role === 'driver' && (
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(queryLower) ||
          u.email?.toLowerCase().includes(queryLower) ||
          u.phone?.includes(query)
        )
      ).slice(0, 5);
      
      set({ searchResults: { orders, customers, drivers }, isSearching: false });
    } catch (error) {
      console.error('Search error:', error);
      set({ isSearching: false });
    }
  },
  
  clearSearch: () => set({ searchQuery: '', searchResults: { orders: [], customers: [], drivers: [] } }),
}));
