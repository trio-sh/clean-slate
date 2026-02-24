import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, DollarSign, Package, Shirt, Sparkles,
  X, Search, Filter, Loader2, Check
} from 'lucide-react';
import db from '../../lib/db';
import { useAuthStore } from '../../stores';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'laundry', label: 'Laundry', icon: Package, color: 'bg-blue-50 text-blue-600' },
  { value: 'dry-cleaning', label: 'Dry Cleaning', icon: Shirt, color: 'bg-purple-50 text-purple-600' },
  { value: 'specialty', label: 'Specialty', icon: Sparkles, color: 'bg-amber-50 text-amber-600' },
];

const UNITS = [
  { value: 'lb', label: 'Per Pound' },
  { value: 'item', label: 'Per Item' },
];

const PartnerServices = () => {
  const { user } = useAuthStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'laundry',
    price: '',
    unit: 'lb',
    is_active: true,
  });

  useEffect(() => {
    loadServices();
  }, [user]);

  const loadServices = async () => {
    try {
      if (!user?.depot_id) {
        setLoading(false);
        return;
      }
      const data = await db.getPartnerServices(user.depot_id);
      setServices(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: 'laundry',
      price: '',
      unit: 'lb',
      is_active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      category: service.category || 'laundry',
      price: service.base_price || service.price || '',
      unit: service.price_type === 'per_lb' ? 'lb' : 'item',
      is_active: service.is_active ?? true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: 'laundry',
      price: '',
      unit: 'lb',
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const serviceData = {
        depot_id: user.depot_id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        base_price: parseFloat(formData.price),
        price: parseFloat(formData.price),
        price_type: formData.unit === 'lb' ? 'per_lb' : 'fixed',
        unit: formData.unit,
        is_active: formData.is_active,
        service_type: formData.category === 'laundry' ? 'wash_fold' : formData.category === 'dry-cleaning' ? 'dry_clean' : 'specialty',
      };

      if (editingService) {
        await db.updatePartnerService(editingService.id, serviceData);
        toast.success('Service updated successfully');
      } else {
        await db.createPartnerService(serviceData);
        toast.success('Service created successfully');
      }

      closeModal();
      loadServices();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${editingService ? 'update' : 'create'} service`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(service.id);
    try {
      await db.deletePartnerService(service.id);
      toast.success('Service deleted successfully');
      loadServices();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete service');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = services.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q);
    const matchCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">My Services</h1>
          <p className="text-gray-500">{services.length} services at your depot</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-amani-500 text-white rounded-lg hover:bg-amani-600 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent text-sm bg-white appearance-none min-w-[180px]"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium mb-1">No services found</p>
          <p className="text-sm">
            {services.length === 0
              ? 'Get started by adding your first service'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service, idx) => {
            const category = CATEGORIES.find((c) => c.value === service.category) || CATEGORIES[0];
            const Icon = category.icon;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(service)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit service"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      disabled={deleting === service.id}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete service"
                    >
                      {deleting === service.id ? (
                        <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-navy-900 mb-1 line-clamp-2">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                )}

                {/* Price & Status */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-amani-600" />
                    <span className="font-bold text-navy-900">
                      ${parseFloat(service.base_price || service.price || 0).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">
                      / {service.unit || (service.price_type === 'per_lb' ? 'lb' : 'item')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        service.is_active ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-xs text-gray-600">
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 ${category.color} rounded-md text-xs font-medium`}>
                    {category.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-navy-900">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Service Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Wash & Fold, Dry Cleaning"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the service..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent text-sm resize-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = formData.category === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: cat.value })}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? `${cat.color} border-current font-medium`
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price & Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent text-sm bg-white"
                        required
                      >
                        {UNITS.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Active Status</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formData.is_active
                          ? 'Service is visible to customers'
                          : 'Service is hidden from customers'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-amani-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amani-500"></div>
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-amani-500 text-white rounded-lg hover:bg-amani-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {editingService ? 'Update Service' : 'Create Service'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerServices;
