import { useState, useEffect } from 'react';
import { 
  Shirt, Search, Plus, Edit2, Trash2, DollarSign,
  Tag, Clock, Package, MoreVertical, CheckCircle,
  XCircle, AlertTriangle, Eye, EyeOff, GripVertical
} from 'lucide-react';
import db from '../../lib/db';
import toast from 'react-hot-toast';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('services'); // services | categories

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    base_price: '',
    price_type: 'fixed', // 'fixed', 'per_lb', 'starting_from'
    service_type: 'dry_clean', // 'wash_fold', 'dry_clean', 'hang_dry', 'specialty'
    processing_days: '1',
    is_active: true,
    display_order: 0
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    icon: 'shirt',
    display_order: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const servicesData = await db.getAll('services');
      const categoriesData = await db.getAll('service_categories');
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set default categories if none exist
      if (categories.length === 0) {
        setCategories([
          { id: '1', name: 'Wash & Fold', icon: 'shirt' },
          { id: '2', name: 'Dry Cleaning', icon: 'sparkles' },
          { id: '3', name: 'Ironing', icon: 'iron' },
          { id: '4', name: 'Specialty', icon: 'star' }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id || null,
        base_price: parseFloat(formData.base_price) || 0,
        price_type: formData.price_type,
        service_type: formData.service_type,
        processing_days: parseInt(formData.processing_days) || 1,
        is_active: formData.is_active,
        display_order: parseInt(formData.display_order) || 0
      };

      if (editingService) {
        await db.update('services', editingService.id, {
          ...serviceData,
          updated_at: new Date().toISOString()
        });
        toast.success('Service updated!');
      } else {
        await db.create('services', {
          id: crypto.randomUUID(),
          ...serviceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        toast.success('Service created!');
      }
      loadData();
      closeModal();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      // Generate slug from name
      const slug = categoryFormData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      await db.create('service_categories', {
        id: crypto.randomUUID(),
        name: categoryFormData.name,
        slug,
        description: categoryFormData.description,
        icon: categoryFormData.icon,
        display_order: parseInt(categoryFormData.display_order) || 0,
        is_active: true,
        created_at: new Date().toISOString()
      });
      toast.success('Category created!');
      loadData();
      setCategoryFormData({ name: '', description: '', icon: 'shirt', display_order: 0 });
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteCategory = async (category) => {
    // Check if category has services
    const categoryServices = services.filter(s => s.category_id === category.id);
    if (categoryServices.length > 0) {
      toast.error(`Cannot delete "${category.name}" - it has ${categoryServices.length} services`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the "${category.name}" category?`)) {
      try {
        await db.delete('service_categories', category.id);
        toast.success('Category deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  const toggleServiceStatus = async (service) => {
    try {
      await db.update('services', service.id, {
        is_active: !service.is_active,
        updated_at: new Date().toISOString()
      });
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await db.delete('services', id);
      loadData();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category_id: '',
      base_price: '',
      price_type: 'fixed',
      service_type: 'dry_clean',
      processing_days: '1',
      is_active: true,
      display_order: 0
    });
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      category_id: service.category_id || '',
      base_price: service.base_price?.toString() || '',
      price_type: service.price_type || 'fixed',
      service_type: service.service_type || 'dry_clean',
      processing_days: service.processing_days?.toString() || '1',
      is_active: service.is_active ?? true,
      display_order: service.display_order || 0
    });
    setShowAddModal(true);
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getPriceTypeLabel = (type) => {
    const labels = {
      fixed: '/item',
      per_lb: '/lb',
      starting_from: 'starting from'
    };
    return labels[type] || '/item';
  };

  // Helper to get category name from ID
  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amani-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-500 mt-1">Manage your service catalog and pricing</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('services')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'services'
                ? 'border-amani-green text-amani-green'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'categories'
                ? 'border-amani-green text-amani-green'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Categories ({categories.length})
          </button>
        </nav>
      </div>

      {activeTab === 'services' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Services</p>
                  <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {services.filter(s => s.is_active).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Categories</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {categories.length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Tag className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${services.length > 0 
                      ? (services.reduce((sum, s) => sum + (parseFloat(s.base_price) || 0), 0) / services.length).toFixed(2)
                      : '0.00'
                    }
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-100">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No services found</p>
              </div>
            ) : (
              filteredServices.map(service => (
                <div 
                  key={service.id} 
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                    service.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
                  }`}
                >
                  {/* Service Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{getCategoryName(service.category_id)}</p>
                      </div>
                      <button
                        onClick={() => toggleServiceStatus(service)}
                        className={`p-2 rounded-lg transition-colors ${
                          service.is_active 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={service.is_active ? 'Active' : 'Inactive'}
                      >
                        {service.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Service Body */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {service.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-amani-green">
                          ${parseFloat(service.base_price || 0).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          {getPriceTypeLabel(service.price_type)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {service.processing_days || 1} day{(service.processing_days || 1) > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Service Actions */}
                  <div className="px-4 py-3 bg-gray-50 flex justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(service)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-amani-green transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(service)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Service Categories</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {categories.map((category, index) => (
                <div key={category.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="p-2 bg-amani-green/10 rounded-lg mr-3">
                      <Shirt className="w-5 h-5 text-amani-green" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-500">
                        {services.filter(s => s.category_id === category.id).length} services
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteCategory(category)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Category Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Add New Category</h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g., Alterations"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark transition-colors"
              >
                Add Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
            <div className="relative bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Type
                    </label>
                    <select
                      value={formData.price_type}
                      onChange={(e) => setFormData({ ...formData, price_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    >
                      <option value="fixed">Fixed (Per Item)</option>
                      <option value="per_lb">Per Pound</option>
                      <option value="starting_from">Starting From</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Type
                    </label>
                    <select
                      value={formData.service_type}
                      onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    >
                      <option value="dry_clean">Dry Clean</option>
                      <option value="wash_fold">Wash & Fold</option>
                      <option value="hang_dry">Hang Dry</option>
                      <option value="specialty">Specialty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processing Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.processing_days}
                      onChange={(e) => setFormData({ ...formData, processing_days: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark transition-colors"
                  >
                    {editingService ? 'Update' : 'Add'} Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
            <div className="relative bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Service?</h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete "{showDeleteConfirm.name}"? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
