import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Users, Truck, Settings, LogOut,
  Menu, X, Bell, Search, ChevronDown, User,
  MapPin, ClipboardList, BarChart3, UserCog, Wrench,
  Calendar, Clock, CheckCircle, AlertCircle, ChevronRight,
  Trash2, Eye, Megaphone, MessageSquare, CreditCard, Building2
} from 'lucide-react';
import { useAuthStore, useAppStore, useNotificationStore, useSearchStore } from '../../stores';
import { format } from 'date-fns';

const DashboardLayout = ({ type }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  
  const { user, logout } = useAuthStore();
  const { mode, demoEnabled } = useAppStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, loadNotifications } = useNotificationStore();
  const { searchQuery, setSearchQuery, searchResults, isSearching, search, clearSearch } = useSearchStore();
  const location = useLocation();

  // Load notifications from database
  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id);
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications(user.id);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, loadNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        search(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  // Navigation items based on type
  const getNavigation = () => {
    switch (type) {
      case 'driver':
        return [
          { name: 'Dashboard', href: '/driver', icon: LayoutDashboard },
          { name: 'My Routes', href: '/driver/routes', icon: MapPin },
        ];
      case 'staff':
        return [
          { name: 'Dashboard', href: '/staff', icon: LayoutDashboard },
          { name: 'Orders', href: '/staff/orders', icon: Package },
          { name: 'Processing', href: '/staff/processing', icon: ClipboardList },
          { name: 'Applications', href: '/staff/applications', icon: Users },
          { name: 'Depots', href: '/staff/depots', icon: Building2 },
          { name: 'Messaging', href: '/staff/messaging', icon: MessageSquare },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
          { name: 'Orders', href: '/admin/orders', icon: Package },
          { name: 'Customers', href: '/admin/customers', icon: Users },
          { name: 'Drivers', href: '/admin/drivers', icon: Truck },
          { name: 'Staff', href: '/admin/staff', icon: UserCog },
          { name: 'Applications', href: '/admin/applications', icon: Users },
          { name: 'Depots', href: '/admin/depots', icon: Building2 },
          { name: 'Check-ins', href: '/admin/checkins', icon: Clock },
          { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
          { name: 'Services', href: '/admin/services', icon: Wrench },
          { name: 'Messaging', href: '/admin/messaging', icon: MessageSquare },
          { name: 'Notifications', href: '/admin/notifications', icon: Megaphone },
          { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
          { name: 'Settings', href: '/admin/settings', icon: Settings },
        ];
      case 'partner':
        return [
          { name: 'Dashboard', href: '/partner-portal', icon: LayoutDashboard },
          { name: 'My Orders', href: '/partner-portal/orders', icon: Package },
          { name: 'Depot Info', href: '/partner-portal/depot', icon: Building2 },
        ];
      default:
        return [];
    }
  };

  const navigation = getNavigation();
  const isActive = (href) => location.pathname === href;

  const getRoleLabel = () => {
    switch (type) {
      case 'driver':  return 'Driver Portal';
      case 'staff':   return 'Staff Portal';
      case 'admin':   return 'Admin Panel';
      case 'partner': return 'Partner Portal';
      default: return 'Dashboard';
    }
  };

  const getRoleColor = () => {
    switch (type) {
      case 'driver':  return 'from-purple-500 to-indigo-600';
      case 'staff':   return 'from-emerald-500 to-teal-600';
      case 'admin':   return 'from-amani-500 to-maple-500';
      case 'partner': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getNotificationIcon = (notifType) => {
    switch (notifType) {
      case 'order': return Package;
      case 'driver': return Truck;
      case 'alert': return AlertCircle;
      default: return Bell;
    }
  };

  const handleSearchSelect = (type, item) => {
    setShowSearch(false);
    clearSearch();
    
    switch (type) {
      case 'order':
        navigate(`/admin/orders?id=${item.id}`);
        break;
      case 'customer':
        navigate(`/admin/customers?id=${item.id}`);
        break;
      case 'driver':
        navigate(`/admin/drivers?id=${item.id}`);
        break;
    }
  };

  const hasSearchResults = searchResults.orders.length > 0 || searchResults.customers.length > 0 || searchResults.drivers.length > 0;

  return (
    <div className={`min-h-screen bg-gray-50 ${demoEnabled && mode === 'demo' ? 'pt-8' : ''}`}>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${demoEnabled && mode === 'demo' ? 'pt-8' : ''}`}
      >
        <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Amani's Cleaners" 
                className="w-10 h-10 rounded-xl object-contain shadow-lg"
              />
              <div>
                <h1 className="font-display font-bold text-navy-900">Amani's</h1>
                <p className="text-xs text-gray-500">{getRoleLabel()}</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'sidebar-link-active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${getRoleColor()} rounded-full flex items-center justify-center text-white font-semibold`}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-navy-900 truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/" className="flex-1 btn-ghost text-sm justify-center">
                <img src="/logo.png" alt="" className="w-4 h-4 rounded object-contain" />
                Store
              </Link>
              <button onClick={() => { logout(); navigate('/login'); }} className="flex-1 btn-ghost text-sm justify-center text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className={`${demoEnabled && mode === 'demo' ? 'pt-8' : ''}`}>
            <div className="flex items-center justify-between px-6 h-16">
              {/* Left */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Search */}
                <div className="relative hidden md:block" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders, customers, drivers..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearch(true);
                    }}
                    onFocus={() => setShowSearch(true)}
                    className="w-80 pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-amani-500 focus:ring-2 focus:ring-amani-500/20 transition-all"
                  />
                  
                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {showSearch && searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden max-h-96 overflow-y-auto"
                      >
                        {isSearching ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin w-5 h-5 border-2 border-amani-500 border-t-transparent rounded-full mx-auto mb-2" />
                            Searching...
                          </div>
                        ) : hasSearchResults ? (
                          <div className="divide-y divide-gray-100">
                            {/* Orders */}
                            {searchResults.orders.length > 0 && (
                              <div className="p-2">
                                <p className="text-xs font-semibold text-gray-500 px-2 py-1">ORDERS</p>
                                {searchResults.orders.map(order => (
                                  <button
                                    key={order.id}
                                    onClick={() => handleSearchSelect('order', order)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left"
                                  >
                                    <Package className="w-4 h-4 text-amani-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-navy-900">#{order.reference_code}</p>
                                      <p className="text-xs text-gray-500 truncate">{order.customer_name}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {/* Customers */}
                            {searchResults.customers.length > 0 && (
                              <div className="p-2">
                                <p className="text-xs font-semibold text-gray-500 px-2 py-1">CUSTOMERS</p>
                                {searchResults.customers.map(customer => (
                                  <button
                                    key={customer.id}
                                    onClick={() => handleSearchSelect('customer', customer)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left"
                                  >
                                    <User className="w-4 h-4 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-navy-900">{customer.first_name} {customer.last_name}</p>
                                      <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {/* Drivers */}
                            {searchResults.drivers.length > 0 && (
                              <div className="p-2">
                                <p className="text-xs font-semibold text-gray-500 px-2 py-1">DRIVERS</p>
                                {searchResults.drivers.map(driver => (
                                  <button
                                    key={driver.id}
                                    onClick={() => handleSearchSelect('driver', driver)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left"
                                  >
                                    <Truck className="w-4 h-4 text-purple-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-navy-900">{driver.first_name} {driver.last_name}</p>
                                      <p className="text-xs text-gray-500 truncate">{driver.phone}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No results found for "{searchQuery}"
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-4">
                {/* Quick stats */}
                <div className="hidden lg:flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  {type === 'driver' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success-500" />
                      <span className="text-success-600 font-medium">On Duty</span>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="font-semibold text-navy-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <button 
                              onClick={() => markAllAsRead(user?.id)}
                              className="text-xs text-amani-600 hover:text-amani-700"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.slice(0, 10).map(notif => {
                              const Icon = getNotificationIcon(notif.type);
                              const isRead = notif.is_read || notif.read;
                              const timestamp = notif.created_at || notif.timestamp;
                              return (
                                <div 
                                  key={notif.id}
                                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!isRead ? 'bg-amani-50/50' : ''}`}
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    if (notif.link) navigate(notif.link);
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      notif.type === 'alert' ? 'bg-red-100 text-red-600' :
                                      notif.type === 'order' ? 'bg-blue-100 text-blue-600' :
                                      notif.type === 'promo' ? 'bg-purple-100 text-purple-600' :
                                      notif.type === 'reminder' ? 'bg-orange-100 text-orange-600' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm ${!isRead ? 'font-semibold' : ''} text-navy-900`}>{notif.title}</p>
                                      <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {timestamp ? format(new Date(timestamp), 'MMM d, h:mm a') : ''}
                                      </p>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                                      className="p-1 hover:bg-gray-200 rounded"
                                    >
                                      <X className="w-3 h-3 text-gray-400" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-4 border-l border-gray-200"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-br ${getRoleColor()} rounded-full flex items-center justify-center text-white text-sm font-semibold`}>
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* User Menu Dropdown */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100">
                          <p className="font-semibold text-navy-900">{user?.first_name} {user?.last_name}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full capitalize ${
                            user?.role === 'admin' ? 'bg-amani-100 text-amani-700' :
                            user?.role === 'driver' ? 'bg-purple-100 text-purple-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {user?.role}
                          </span>
                        </div>
                        
                        <div className="p-2">
                          <Link 
                            to="/account"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-gray-700"
                          >
                            <User className="w-4 h-4" />
                            My Account
                          </Link>
                          <Link 
                            to="/"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-gray-700"
                          >
                            <img src="/logo.png" alt="" className="w-4 h-4 rounded object-contain" />
                            View Store
                          </Link>
                          <button 
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-full flex items-center gap-3 p-2 hover:bg-red-50 rounded-lg text-red-600"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
