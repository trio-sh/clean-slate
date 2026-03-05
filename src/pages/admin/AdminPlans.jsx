import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit, Trash2, Star, Crown, GraduationCap,
  Search, Check, X, DollarSign, Calendar, Package,
  AlertCircle, Eye, EyeOff, RefreshCw, Loader2
} from 'lucide-react';
import db from '../../lib/db';
import toast from 'react-hot-toast';

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // all | active | inactive
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    pounds_included: '',
    validity_days: 30,
    billing_interval: 'month',
    duration_months: 1,
    monthly_weight_limit: '',
    is_active: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const allPlans = await db.getAll('subscription_plans');
      setPlans(allPlans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWithStripe = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/stripe/sync-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync with Stripe');
      }

      const result = await response.json();

      toast.success(
        `Successfully synced ${result.synced} plan(s) from Stripe!` +
        (result.errors?.length ? ` (${result.errors.length} error(s))` : '')
      );

      if (result.errors?.length > 0) {
        console.error('Sync errors:', result.errors);
      }

      await loadPlans();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error.message || 'Failed to sync with Stripe');
    } finally {
      setSyncing(false);
    }
  };

  const getPlanIcon = (slug) => {
    if (slug?.includes('student')) return GraduationCap;
    if (slug?.includes('gold')) return Crown;
    return Star;
  };

  const getPlanColor = (slug) => {
    if (slug?.includes('student')) return 'purple';
    if (slug?.includes('gold')) return 'amber';
    if (slug?.includes('silver')) return 'gray';
    return 'blue';
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = !searchTerm ||
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && plan.is_active) ||
      (filterActive === 'inactive' && !plan.is_active);

    return matchesSearch && matchesActive;
  });

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Plan name is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';
    if (!formData.description?.trim()) errors.description = 'Description is required';

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    const pounds = parseInt(formData.pounds_included);
    if (!formData.pounds_included || isNaN(pounds) || pounds <= 0) {
      errors.pounds_included = 'Pounds must be greater than 0';
    }

    const validityDays = parseInt(formData.validity_days);
    if (!formData.validity_days || isNaN(validityDays) || validityDays <= 0) {
      errors.validity_days = 'Validity days must be greater than 0';
    }

    const monthlyLimit = parseInt(formData.monthly_weight_limit);
    if (formData.monthly_weight_limit && (isNaN(monthlyLimit) || monthlyLimit <= 0)) {
      errors.monthly_weight_limit = 'Monthly weight limit must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      // Edit mode
      setEditingPlan(plan);
      setFormData({
        name: plan.name || '',
        slug: plan.slug || '',
        description: plan.description || '',
        price: plan.price || '',
        pounds_included: plan.pounds_included || '',
        validity_days: plan.validity_days || 30,
        billing_interval: plan.billing_interval || 'month',
        duration_months: plan.duration_months || 1,
        monthly_weight_limit: plan.monthly_weight_limit || plan.pounds_included || '',
        is_active: plan.is_active !== undefined ? plan.is_active : true
      });
    } else {
      // Create mode
      setEditingPlan(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        pounds_included: '',
        validity_days: 30,
        billing_interval: 'month',
        duration_months: 1,
        monthly_weight_limit: '',
        is_active: true
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      pounds_included: '',
      validity_days: 30,
      billing_interval: 'month',
      duration_months: 1,
      monthly_weight_limit: '',
      is_active: true
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-generate slug from name
    if (name === 'name' && !editingPlan) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      const planData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        pounds_included: parseInt(formData.pounds_included),
        validity_days: parseInt(formData.validity_days),
        billing_interval: formData.billing_interval || 'month',
        duration_months: parseInt(formData.duration_months) || 1,
        monthly_weight_limit: parseInt(formData.monthly_weight_limit) || parseInt(formData.pounds_included),
        is_active: formData.is_active
      };

      // Create or update in Stripe
      let stripeProductId = editingPlan?.stripe_product_id;
      let stripePriceId = editingPlan?.stripe_price_id;

      if (editingPlan && stripeProductId) {
        // Update existing Stripe product
        const stripeResponse = await fetch('/api/stripe/manage-products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: stripeProductId,
            name: planData.name,
            description: planData.description,
            metadata: {
              pounds_included: planData.pounds_included.toString(),
              validity_days: planData.validity_days.toString(),
            },
            active: planData.is_active,
          }),
        });

        if (!stripeResponse.ok) {
          console.error('Failed to update Stripe product');
        }
      } else if (!editingPlan) {
        // Create new Stripe product
        const stripeResponse = await fetch('/api/stripe/manage-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: planData.name,
            description: planData.description,
            poundsIncluded: planData.pounds_included,
            validityDays: planData.validity_days,
            price: planData.price,
            interval: planData.billing_interval,
            currency: 'cad',
          }),
        });

        if (stripeResponse.ok) {
          const stripeData = await stripeResponse.json();
          stripeProductId = stripeData.product.id;
          stripePriceId = stripeData.product.default_price?.id || stripeData.product.default_price;
        } else {
          console.error('Failed to create Stripe product');
          toast.error('Warning: Plan will be saved locally but Stripe product creation failed');
        }
      }

      // Save to database
      const dbData = {
        ...planData,
        ...(stripeProductId && { stripe_product_id: stripeProductId }),
        ...(stripePriceId && { stripe_price_id: stripePriceId }),
      };

      if (editingPlan) {
        // Update existing plan
        await db.update('subscription_plans', editingPlan.id, dbData);
        toast.success('Plan updated successfully!');
      } else {
        // Create new plan
        await db.create('subscription_plans', dbData);
        toast.success('Plan created successfully!');
      }

      handleCloseModal();
      loadPlans();
    } catch (error) {
      console.error('Failed to save plan:', error);
      toast.error(editingPlan ? 'Failed to update plan' : 'Failed to create plan');
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await db.update('subscription_plans', plan.id, {
        is_active: !plan.is_active
      });
      toast.success(`Plan ${!plan.is_active ? 'activated' : 'deactivated'}`);
      loadPlans();
    } catch (error) {
      console.error('Failed to toggle plan status:', error);
      toast.error('Failed to update plan status');
    }
  };

  const handleDelete = async (plan) => {
    // Check if any active subscriptions use this plan
    try {
      const subscriptions = await db.getAll('customer_subscriptions');
      const activeSubscriptions = subscriptions.filter(
        sub => sub.plan_id === plan.id && ['active', 'pending_payment'].includes(sub.status)
      );

      if (activeSubscriptions.length > 0) {
        toast.error(
          `Cannot delete plan: ${activeSubscriptions.length} active subscription(s) are using this plan. ` +
          `Please cancel those subscriptions first or wait for them to expire.`
        );
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete "${plan.name}"?\n\n` +
        `This action cannot be undone.`
      );

      if (!confirmed) return;

      // Archive in Stripe if product exists
      if (plan.stripe_product_id) {
        try {
          await fetch(`/api/stripe/manage-products?productId=${plan.stripe_product_id}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.error('Failed to archive Stripe product:', error);
          // Continue with local deletion even if Stripe archiving fails
        }
      }

      await db.delete('subscription_plans', plan.id);
      toast.success('Plan deleted successfully');
      loadPlans();
    } catch (error) {
      console.error('Failed to delete plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const handleDuplicate = async (plan) => {
    const newPlan = {
      name: `${plan.name} (Copy)`,
      slug: `${plan.slug}-copy-${Date.now()}`,
      description: plan.description,
      price: plan.price,
      pounds_included: plan.pounds_included,
      validity_days: plan.validity_days,
      duration_months: plan.duration_months,
      monthly_weight_limit: plan.monthly_weight_limit,
      is_active: false // Inactive by default for safety
    };

    try {
      await db.create('subscription_plans', newPlan);
      toast.success('Plan duplicated! (Set to inactive - activate when ready)');
      loadPlans();
    } catch (error) {
      console.error('Failed to duplicate plan:', error);
      toast.error('Failed to duplicate plan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amani-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-900">Subscription Plans</h1>
          <p className="text-gray-600 mt-1">Create and manage subscription plans for customers</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSyncWithStripe}
            disabled={syncing}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Sync with Stripe
              </>
            )}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold text-gray-900">
                {plans.filter(p => p.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <EyeOff className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive Plans</p>
              <p className="text-2xl font-bold text-gray-900">
                {plans.filter(p => !p.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ${plans.length > 0 ? (plans.reduce((sum, p) => sum + (p.price || 0), 0) / plans.length).toFixed(0) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500"
              />
            </div>
          </div>

          <div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500"
            >
              <option value="all">All Plans</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
          const PlanIcon = getPlanIcon(plan.slug);
          const color = getPlanColor(plan.slug);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl border-2 p-6 relative ${
                plan.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {plan.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    <Check className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                    <EyeOff className="w-3 h-3" />
                    Inactive
                  </span>
                )}
              </div>

              {/* Icon */}
              <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center mb-4`}>
                <PlanIcon className={`w-6 h-6 text-${color}-600`} />
              </div>

              {/* Plan Details */}
              <h3 className="text-xl font-display font-bold text-navy-900 mb-2">
                {plan.name}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {plan.description || 'No description'}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price</span>
                  <span className="font-bold text-navy-900">${plan.price}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pounds Included</span>
                  <span className="font-semibold text-navy-900">{plan.pounds_included} lbs</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Validity</span>
                  <span className="font-semibold text-navy-900">{plan.validity_days} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Billing</span>
                  <span className="font-semibold text-navy-900 capitalize">
                    {plan.billing_interval || 'month'}ly
                  </span>
                </div>
              </div>

              {/* Stripe Integration Badge */}
              {plan.stripe_product_id && (
                <div className="mb-4 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <Check className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-900">Stripe Connected</span>
                  </div>
                  <p className="text-xs text-purple-700 font-mono truncate" title={plan.stripe_product_id}>
                    {plan.stripe_product_id}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(plan)}
                  className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(plan)}
                  className={`py-2 px-3 rounded-lg transition-colors text-sm font-medium ${
                    plan.is_active
                      ? 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                  title={plan.is_active ? 'Deactivate' : 'Activate'}
                >
                  {plan.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDuplicate(plan)}
                  className="py-2 px-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                  title="Duplicate plan"
                >
                  <Package className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan)}
                  className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  title="Delete plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPlans.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No plans found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterActive !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first subscription plan'}
          </p>
          {!searchTerm && filterActive === 'all' && (
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Plan
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-display font-bold text-navy-900">
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingPlan ? 'Update plan details below' : 'Fill in the details for your new subscription plan'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Plan Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Gold Monthly, Student Semester"
                  className={`input w-full ${formErrors.name ? 'border-red-500' : ''}`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug * <span className="text-gray-500">(URL-friendly identifier)</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g., gold-monthly, student-semester"
                  className={`input w-full ${formErrors.slug ? 'border-red-500' : ''}`}
                />
                {formErrors.slug && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.slug}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the plan and its benefits..."
                  rows={3}
                  className={`input w-full ${formErrors.description ? 'border-red-500' : ''}`}
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Price & Pounds (Side by side) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`input w-full pl-10 ${formErrors.price ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formErrors.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pounds Included *
                  </label>
                  <input
                    type="number"
                    name="pounds_included"
                    value={formData.pounds_included}
                    onChange={handleInputChange}
                    placeholder="50"
                    min="1"
                    className={`input w-full ${formErrors.pounds_included ? 'border-red-500' : ''}`}
                  />
                  {formErrors.pounds_included && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.pounds_included}
                    </p>
                  )}
                </div>
              </div>

              {/* Billing Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Interval *
                </label>
                <select
                  name="billing_interval"
                  value={formData.billing_interval}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  How often customers will be charged
                </p>
              </div>

              {/* Validity Days & Duration Months */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validity Days *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="validity_days"
                      value={formData.validity_days}
                      onChange={handleInputChange}
                      placeholder="30"
                      min="1"
                      className={`input w-full pl-10 ${formErrors.validity_days ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formErrors.validity_days && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.validity_days}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    How long the plan is valid after purchase
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    name="duration_months"
                    value={formData.duration_months}
                    onChange={handleInputChange}
                    placeholder="1"
                    min="1"
                    className="input w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Billing cycle length (1 = monthly)
                  </p>
                </div>
              </div>

              {/* Monthly Weight Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Weight Limit (optional)
                </label>
                <input
                  type="number"
                  name="monthly_weight_limit"
                  value={formData.monthly_weight_limit}
                  onChange={handleInputChange}
                  placeholder="Same as pounds included"
                  min="1"
                  className={`input w-full ${formErrors.monthly_weight_limit ? 'border-red-500' : ''}`}
                />
                {formErrors.monthly_weight_limit && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.monthly_weight_limit}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  If different from pounds included (for multi-month plans)
                </p>
              </div>

              {/* Is Active Toggle */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-amani-600 rounded focus:ring-amani-500"
                />
                <label htmlFor="is_active" className="flex-1">
                  <span className="block text-sm font-medium text-gray-900">
                    Active Plan
                  </span>
                  <span className="text-xs text-gray-500">
                    {formData.is_active
                      ? 'This plan will be visible to customers'
                      : 'This plan will be hidden from customers'}
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-amani-500 text-white rounded-xl hover:bg-amani-600 font-medium"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
