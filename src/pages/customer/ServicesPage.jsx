import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import {
  Shirt, Search, Plus, Minus, ShoppingCart, Filter,
  Sparkles, Clock, CheckCircle2, Info, ChevronDown
} from 'lucide-react';
import { useServicesStore, useCartStore, useAppStore } from '../../stores';
import { useLanguage } from '../../i18n/LanguageContext';

const ServicesPage = () => {
  const { t } = useLanguage();
  const { categories, services, fetchServices, loading } = useServicesStore();
  const { addItem, items } = useCartStore();
  const { mode } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const categoryIcons = {
    'shirts-blouses': '👔',
    'pants-shorts': '👖',
    'skirts': '👗',
    'dresses': '👗',
    'jackets': '🧥',
    'sweaters': '🧶',
    'wedding-formal': '👰',
    'suits': '🤵',
    'tie-scarf': '🧣',
    'coats-winter': '🧥',
    'bedding': '🛏️',
    'culinary-linen': '🍽️',
    'laundry': '🧺',
  };

  const filteredServices = services.filter(service => {
    const matchesCategory = !selectedCategory || service.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedServices = filteredServices.reduce((acc, service) => {
    const categoryName = categories.find(c => c.id === service.category_id)?.name || 'Other';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(service);
    return acc;
  }, {});

  const updateQuantity = (serviceId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [serviceId]: Math.max(0, (prev[serviceId] || 0) + delta)
    }));
  };

  const handleAddToCart = (service) => {
    const qty = quantities[service.id] || 1;
    addItem({
      id: service.id,
      name: service.name,
      price: service.base_price || service.price || 0,
      quantity: qty,
      type: 'service'
    });
    setQuantities(prev => ({ ...prev, [service.id]: 0 }));
  };

  const getItemInCart = (serviceId) => {
    return items.find(item => item.id === serviceId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amani-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - hidden on mobile for app-like feel */}
      <section className="relative hidden md:block bg-gradient-to-br from-navy-900 to-amani-900 py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://api.a0.dev/assets/image?text=professional dry cleaning laundry service, rows of clean pressed garments on hangers, bright organized premium clothing care facility&aspect=16:9&seed=601"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900/75 to-amani-900/75" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-amani-400" />
              <span className="text-white font-medium">{t('services.premiumQuality')}</span>
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
              {t('services.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {t('services.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-amani-500" />
              {t('services.turnaround')}
            </span>
            <span className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {t('services.qualityGuaranteed')}
            </span>
            <span className="flex items-center gap-2 text-amani-600 font-medium">
              <Sparkles className="w-4 h-4" />
              {t('services.firstOrderDiscount')}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-32 space-y-6">
              {/* Search */}
              <div className="card p-4">
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  {t('services.searchServices')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('services.searchPlaceholder')}
                    className="input pl-10"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="card p-4">
                <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  {t('services.categories')}
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedCategory
                        ? 'bg-amani-100 text-amani-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {t('services.allServices')}
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        selectedCategory === category.id
                          ? 'bg-amani-100 text-amani-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{categoryIcons[category.slug] || '📦'}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Summary */}
              {items.length > 0 && (
                <div className="card p-4 bg-amani-50 border-amani-200">
                  <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amani-600" />
                    {t('services.yourCart')}
                  </h3>
                  <div className="space-y-2 mb-4">
                    {items.slice(0, 3).map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate">{item.quantity}x {item.name}</span>
                        <span className="text-navy-900 font-medium">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-sm text-gray-500">+{items.length - 3} {t('services.moreItems')}</p>
                    )}
                  </div>
                  <Link to="/order" className="btn-primary w-full text-center text-sm">
                    {t('services.viewCartCheckout')}
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* Services Grid */}
          <main className="flex-1">
            {Object.keys(groupedServices).length === 0 ? (
              <div className="card p-12 text-center">
                <Shirt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-navy-900 mb-2">{t('services.noServicesFound')}</h3>
                <p className="text-gray-600">{t('services.tryAdjusting')}</p>
              </div>
            ) : (
              Object.entries(groupedServices).map(([categoryName, categoryServices]) => (
                <motion.div
                  key={categoryName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <h2 className="text-2xl font-display font-bold text-navy-900 mb-6 flex items-center gap-3">
                    <span className="text-2xl">
                      {categoryIcons[categories.find(c => c.name === categoryName)?.slug] || '📦'}
                    </span>
                    {categoryName}
                  </h2>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryServices.map(service => {
                      const cartItem = getItemInCart(service.id);
                      const qty = quantities[service.id] || 0;
                      
                      return (
                        <div
                          key={service.id}
                          className="card p-5 hover:shadow-lg transition-all duration-300 group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-navy-900 group-hover:text-amani-600 transition-colors">
                                {service.name}
                              </h3>
                              {service.description && (
                                <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                              )}
                            </div>
                            <span className="text-lg font-bold text-amani-600">
                              ${(service.base_price || service.price || 0).toFixed(2)}
                            </span>
                          </div>

                          {service.unit && (
                            <p className="text-xs text-gray-400 mb-3">{t('services.perUnit', { unit: service.unit })}</p>
                          )}

                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-gray-200 rounded-lg">
                              <button
                                onClick={() => updateQuantity(service.id, -1)}
                                className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                                disabled={qty === 0}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 text-center font-medium">{qty}</span>
                              <button
                                onClick={() => updateQuantity(service.id, 1)}
                                className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleAddToCart(service)}
                              disabled={qty === 0}
                              className={`flex-1 btn-primary text-sm py-2 ${
                                qty === 0 ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              {t('common.add')}
                            </button>
                          </div>

                          {cartItem && (
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {t('services.inCart', { quantity: cartItem.quantity })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))
            )}

            {/* Laundry Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12"
            >
              <div className="card p-8 bg-gradient-to-br from-amani-50 to-blue-50 border-amani-100">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-bold text-navy-900 mb-3 flex items-center gap-3">
                      <span className="text-3xl">🧺</span>
                      {t('services.washFoldLaundry')}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {t('services.washFoldDescription')}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4">
                        <h4 className="font-semibold text-navy-900">{t('services.regular')}</h4>
                        <p className="text-2xl font-bold text-amani-600">$2.45<span className="text-sm font-normal text-gray-500">/lb</span></p>
                        <p className="text-sm text-gray-500">{t('services.forHousehold')}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4">
                        <h4 className="font-semibold text-navy-900">{t('services.commercial')}</h4>
                        <p className="text-2xl font-bold text-amani-600">$2.29<span className="text-sm font-normal text-gray-500">/lb</span></p>
                        <p className="text-sm text-gray-500">{t('services.forBusiness')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-48 text-center">
                    <Link to="/order" className="btn-primary w-full inline-flex items-center justify-center gap-2">
                      {t('services.orderLaundry')}
                      <ShoppingCart className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Info Box */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex gap-4">
                <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">{t('services.priceNotes')}</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {t('services.priceNote1')}</li>
                    <li>• {t('services.priceNote2')}</li>
                    <li>• {t('services.priceNote3')}</li>
                    <li>• {t('services.priceNote4')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
