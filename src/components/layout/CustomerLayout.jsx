import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ShoppingCart, User, MapPin, Phone, Mail,
  Facebook, Instagram, Twitter, ChevronDown, Sparkles,
  Shirt, Clock, Truck, Star, Leaf, Bell, CheckCircle, Trash2, LogOut
} from 'lucide-react';
import { useAuthStore, useCartStore, useAppStore, useNotificationStore } from '../../stores';
import { format } from 'date-fns';
import LanguageSwitcher from '../LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';

const CustomerLayout = () => {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { mode, demoEnabled } = useAppStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, loadNotifications } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Load notifications for logged-in customers
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadNotifications(user.id);
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications(user.id);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.id, loadNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const handleNotificationClick = (notification) => {
    if (!notification.is_read && !notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setShowNotifications(false);
    }
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'alert': return 'bg-red-100 text-red-600';
      case 'order': return 'bg-blue-100 text-blue-600';
      case 'promo': return 'bg-purple-100 text-purple-600';
      case 'reminder': return 'bg-amber-100 text-amber-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const navigation = [
    { name: t('navigation.home'), href: '/' },
    { name: t('navigation.services'), href: '/services' },
    { name: t('navigation.pricing'), href: '/pricing' },
    { name: t('navigation.subscriptions'), href: '/subscriptions' },
    { name: t('navigation.trackOrder'), href: '/track' },
    { name: t('navigation.driveWithUs'), href: '/drive-with-us' },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className={`min-h-screen flex flex-col ${demoEnabled && mode === 'demo' ? 'pt-8' : ''}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        {/* Top bar */}
        <div className="hidden md:block bg-navy-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-6">
                <a href="tel:437-215-6321" className="flex items-center gap-2 hover:text-amani-400 transition-colors">
                  <Phone className="w-4 h-4" />
                  437-215-6321
                </a>
                <a href="mailto:amaniscleaners@gmail.com" className="flex items-center gap-2 hover:text-amani-400 transition-colors">
                  <Mail className="w-4 h-4" />
                  amaniscleaners@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-400" />
                  {t('hero.proudlyCanadian')}
                </span>
                <span className="text-amani-400 font-medium">{t('header.firstOrderPromo')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Amani's Cleaners" 
                className="h-20 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-amani-600 bg-amani-50'
                      : 'text-navy-600 hover:text-amani-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Cart */}
              <button
                onClick={() => navigate('/order')}
                className="relative p-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ShoppingCart className="w-6 h-6 text-navy-700" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amani-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>

              {/* Notifications - Only show for logged in customers */}
              {isAuthenticated && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Bell className="w-6 h-6 text-navy-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed sm:absolute right-4 sm:right-0 top-20 sm:top-full sm:mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50"
                      >
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                          <h3 className="font-semibold text-navy-900 truncate">{t('notifications.title')}</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead(user?.id)}
                              className="text-xs text-amani-600 hover:text-amani-700 whitespace-nowrap flex-shrink-0"
                            >
                              {t('notifications.markAllRead')}
                            </button>
                          )}
                        </div>

                        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                              <p>{t('notifications.noNotifications')}</p>
                            </div>
                          ) : (
                            notifications.slice(0, 10).map(notif => (
                              <div
                                key={notif.id}
                                className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group ${
                                  !notif.is_read && !notif.read ? 'bg-blue-50/50' : ''
                                }`}
                                onClick={() => handleNotificationClick(notif)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationTypeColor(notif.type)}`}>
                                    <Bell className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-navy-900 text-sm truncate">{notif.title}</p>
                                    <p className="text-gray-600 text-xs mt-0.5 line-clamp-2 break-words">{notif.message}</p>
                                    <p className="text-gray-400 text-xs mt-1 truncate">
                                      {notif.created_at ? format(new Date(notif.created_at), 'MMM d, h:mm a') :
                                       notif.timestamp ? format(new Date(notif.timestamp), 'MMM d, h:mm a') : ''}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeNotification(notif.id);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4 text-gray-400" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {notifications.length > 10 && (
                          <div className="p-3 border-t border-gray-100 text-center flex-shrink-0">
                            <Link
                              to="/account"
                              onClick={() => setShowNotifications(false)}
                              className="text-sm text-amani-600 hover:text-amani-700 whitespace-nowrap"
                            >
                              {t('notifications.viewAll')}
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Language Switcher */}
              <LanguageSwitcher variant="button" />

              {/* Auth */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-amani-100 rounded-full flex items-center justify-center">
                      <span className="text-amani-600 font-semibold text-sm">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed sm:absolute right-4 sm:right-0 left-4 sm:left-auto top-20 sm:top-full sm:mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50"
                      >
                        <div className="py-2 max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden">
                          <Link
                            to="/account"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                          >
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{t('userMenu.myAccount')}</span>
                          </Link>
                          {user?.role !== 'customer' && (
                            <Link
                              to={`/${user?.role}`}
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <User className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{user?.role === 'admin' ? t('userMenu.adminPanel') : user?.role === 'driver' ? t('userMenu.driverDashboard') : t('userMenu.staffDashboard')}</span>
                            </Link>
                          )}
                          <button
                            onClick={() => { logout(); setShowUserMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{t('userMenu.signOut')}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost text-sm">{t('auth.signIn')}</Link>
                  <Link to="/order" className="btn-primary text-sm">
                    <Sparkles className="w-4 h-4" />
                    {t('navigation.orderNow')}
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100"
            >
              <div className="px-4 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl font-medium ${
                      isActive(item.href)
                        ? 'text-amani-600 bg-amani-50'
                        : 'text-navy-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <img 
                    src="/logo.png" 
                    alt="Amani's Cleaners" 
                    className="h-14 w-auto object-contain"
                  />
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                {t('footer.description')}
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-amani-500 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-amani-500 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-amani-500 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Language */}
            <div>
              <h4 className="font-semibold text-lg mb-6">{t('footer.language')}</h4>
              <LanguageSwitcher variant="menu" />
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-6">{t('footer.quickLinks')}</h4>
              <ul className="space-y-3">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link to={item.href} className="text-gray-400 hover:text-amani-400 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/partner" className="text-gray-400 hover:text-amani-400 transition-colors">
                    {t('footer.becomePartner')}
                  </Link>
                </li>
                <li>
                  <Link to="/driver" className="text-gray-400 hover:text-amani-400 transition-colors">
                    {t('footer.becomeDriver')}
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="text-gray-400 hover:text-amani-400 transition-colors">
                    {t('navigation.careers')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Service Areas */}
            <div>
              <h4 className="font-semibold text-lg mb-6">{t('footer.serviceAreas')}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>{t('locations.toronto')}</li>
                <li>{t('locations.northYork')}</li>
                <li>{t('locations.brampton')}</li>
                <li>{t('locations.mississauga')}</li>
                <li>{t('locations.vaughan')}</li>
                <li>{t('locations.richmondHill')}</li>
                <li>{t('locations.markham')}</li>
                <li>{t('footer.moreAreas')}</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-lg mb-6">{t('footer.contactUs')}</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amani-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-sm">325 Weston Road, Unit 5D</p>
                    <p className="text-gray-400 text-sm">Toronto, ON M6N 3P1</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-amani-500" />
                  <div>
                    <a href="tel:437-215-6321" className="text-gray-400 hover:text-amani-400 text-sm">437-215-6321</a>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amani-500" />
                  <a href="mailto:amaniscleaners@gmail.com" className="text-gray-400 hover:text-amani-400 text-sm">
                    amaniscleaners@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amani-500" />
                  <div className="text-gray-400 text-sm">
                    <p>{t('footer.pickupHours')}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                {t('footer.googleRating')}
              </span>
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amani-500" />
                {t('footer.freeDelivery')}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
