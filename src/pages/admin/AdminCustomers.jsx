import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Mail, Phone, MapPin, Calendar, Package,
  DollarSign, Star, Eye, Edit, Trash2, Plus, X, ChevronLeft,
  ChevronRight, Download, UserPlus, RefreshCcw, Clock,
  Key, Copy, Send
} from 'lucide-react';
import db from '../../lib/db';
import { generateTempPassword, sendEmail, emailTemplates, sendSMS, smsTemplates } from '../../lib/utils';
import toast from 'react-hot-toast';

const AdminCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const customersPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Get users from database
      const allUsers = await db.getAll('users');
      const customerUsers = allUsers.filter(u => u.role === 'customer');
      
      // Get orders to calculate stats
      const allOrders = await db.getAll('orders');
      
      // Enrich customer data with order stats
      const enrichedCustomers = customerUsers.map(customer => {
        const customerOrders = allOrders.filter(o => o.customer_id === customer.id);
        const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = customerOrders.length;
        
        let status = 'active';
        if (totalOrders === 0) status = 'new';
        else if (!customer.is_active) status = 'inactive';
        
        return {
          ...customer,
          total_orders: totalOrders,
          total_spent: totalSpent,
          status,
          address: customer.address || 'No address on file',
        };
      });
      
      setCustomers(enrichedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
    setLoading(false);
  };

  const handleGeneratePassword = () => {
    const pwd = generateTempPassword(10);
    setGeneratedPassword(pwd);
    setFormData({ ...formData, password: pwd });
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    // Password only required for new customers
    if (!selectedCustomer && !formData.password) {
      toast.error('Please generate or enter a password');
      return;
    }

    setFormLoading(true);
    try {
      // Check for duplicate email
      const existingUser = await db.getUserByEmail(formData.email);
      if (existingUser && (!selectedCustomer || existingUser.id !== selectedCustomer.id)) {
        toast.error('A user with this email already exists');
        setFormLoading(false);
        return;
      }

      // Check for duplicate phone if provided
      if (formData.phone) {
        const existingPhone = await db.getUserByPhone(formData.phone);
        if (existingPhone && (!selectedCustomer || existingPhone.id !== selectedCustomer.id)) {
          toast.error('A user with this phone number already exists');
          setFormLoading(false);
          return;
        }
      }

      if (selectedCustomer) {
        // Update existing customer - only send fields that exist in users schema
        const updates = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        };
        
        await db.update('users', selectedCustomer.id, updates);
        toast.success('Customer updated successfully!');
      } else {
        // Create new customer - only schema fields
        const userData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: 'customer',
          is_active: true,
        };

        await db.createUserWithPassword(userData, formData.password);
        toast.success('Customer created successfully!');
      }
      
      fetchCustomers();
      setShowAddModal(false);
      setSelectedCustomer(null);
      resetForm();
    } catch (err) {
      console.error('Error saving customer:', err);
      toast.error('Failed to save customer: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendCredentials = async (customer) => {
    const tempPassword = generateTempPassword(10);
    
    try {
      // Update password using proper hashing
      await db.updatePassword(customer.id, tempPassword);

      if (customer.phone) {
        await sendSMS(customer.phone, smsTemplates.loginCredentials(customer.email, tempPassword));
      }
      
      if (customer.email) {
        const template = emailTemplates.loginCredentials(customer, tempPassword);
        await sendEmail(customer.email, template.subject, template.html);
      }

      toast.success('Login credentials sent!');
    } catch (err) {
      console.error('Error sending credentials:', err);
      toast.error('Failed to send credentials');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      password: '',
    });
    setGeneratedPassword('');
    setSelectedCustomer(null);
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    new: customers.filter(c => c.status === 'new').length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
  };

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * customersPerPage,
    currentPage * customersPerPage
  );

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      new: 'bg-blue-100 text-blue-700'
    };
    return config[status] || config.active;
  };

  // Export customers
  const exportCustomers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Address', 'Orders', 'Total Spent', 'Status', 'Joined'].join(','),
      ...filteredCustomers.map(c => [
        `${c.first_name} ${c.last_name}`,
        c.email,
        c.phone,
        `"${c.address}"`,
        c.total_orders,
        c.total_spent.toFixed(2),
        c.status,
        c.created_at
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Customer Management</h1>
          <p className="text-gray-600">View and manage your customer database</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCustomers} className="btn-secondary">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amani-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-amani-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Customers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.new}</p>
              <p className="text-xs text-gray-500">New This Month</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">${stats.totalRevenue.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field md:w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="new">New</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Spent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amani-500 to-maple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {customer.first_name?.[0] || ''}{customer.last_name?.[0] || ''}
                      </div>
                      <div>
                        <p className="font-medium text-navy-900">{customer.first_name} {customer.last_name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-navy-900 font-medium">{customer.total_orders}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-navy-900 font-semibold">${customer.total_spent.toFixed(2)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600">{formatDate(customer.created_at)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        onClick={() => {
                          setFormData({
                            first_name: customer.first_name || '',
                            last_name: customer.last_name || '',
                            email: customer.email || '',
                            phone: customer.phone || '',
                            address: customer.address || '',
                            password: '',
                          });
                          setSelectedCustomer(customer);
                          setShowAddModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100" 
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-navy-900 mb-1">No customers found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * customersPerPage + 1} to {Math.min(currentPage * customersPerPage, filteredCustomers.length)} of {filteredCustomers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      <AnimatePresence>
        {selectedCustomer && !showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amani-500 to-maple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {selectedCustomer.first_name?.[0] || ''}{selectedCustomer.last_name?.[0] || ''}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-navy-900">
                        {selectedCustomer.first_name} {selectedCustomer.last_name}
                      </h2>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(selectedCustomer.status)}`}>
                        {selectedCustomer.status}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amani-50 rounded-xl p-4 text-center">
                    <Package className="w-6 h-6 text-amani-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-navy-900">{selectedCustomer.total_orders}</p>
                    <p className="text-xs text-gray-500">Total Orders</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-navy-900">${selectedCustomer.total_spent.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Total Spent</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <span className="text-gray-700">{selectedCustomer.address}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">Customer since {formatDate(selectedCustomer.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 flex gap-3">
                <button 
                  onClick={() => handleSendCredentials(selectedCustomer)}
                  className="flex-1 btn-secondary"
                >
                  <Mail className="w-4 h-4" />
                  Send Login
                </button>
                <button 
                  onClick={() => {
                    setSelectedCustomer(null);
                    navigate(`/admin/orders?customer=${selectedCustomer.id}`);
                  }}
                  className="flex-1 btn-primary"
                >
                  <Package className="w-4 h-4" />
                  View Orders
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Customer Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => { setShowAddModal(false); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-navy-900">
                    {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
                  </h2>
                  <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="John"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="613-555-0100"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea 
                    className="input-field" 
                    rows="2" 
                    placeholder="123 Main St, Ottawa, ON"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Password Section - Only for new customers */}
                {!selectedCustomer && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login Password *</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="input-field flex-1" 
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        Generate
                      </button>
                    </div>
                    {generatedPassword && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-800 font-mono">{generatedPassword}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedPassword);
                              toast.success('Password copied!');
                            }}
                            className="p-1 hover:bg-green-100 rounded"
                          >
                            <Copy className="w-4 h-4 text-green-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setShowAddModal(false); resetForm(); }} 
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={formLoading}
                    className="flex-1 btn-primary"
                  >
                    {formLoading ? 'Saving...' : (selectedCustomer ? 'Update Customer' : 'Add Customer')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCustomers;
