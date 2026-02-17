import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Search, Phone, Mail, MapPin, Star, Eye, Edit,
  UserPlus, X, ChevronLeft, ChevronRight, Download, Clock,
  CheckCircle, Package, Calendar, Navigation, RefreshCcw,
  Send, Key, Copy, LogIn, MapPinned
} from 'lucide-react';
import db from '../../lib/db';
import { generateTempPassword, sendEmail, emailTemplates, sendSMS, smsTemplates } from '../../lib/utils';
import toast from 'react-hot-toast';

const AdminDrivers = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [editingDriver, setEditingDriver] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [todayCheckins, setTodayCheckins] = useState([]);
  const driversPerPage = 10;

  // Form state for adding new driver
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    vehicle: '',
    license_plate: '',
    password: '',
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch drivers
  useEffect(() => {
    fetchDrivers();
    fetchTodayCheckins();
  }, []);

  const fetchTodayCheckins = async () => {
    try {
      const checkins = await db.getAllTodayCheckins();
      const driverCheckins = checkins.filter(c => c.user?.role === 'driver');
      setTodayCheckins(driverCheckins);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
    }
  };

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // Get users from database
      const allUsers = await db.getAll('users');
      const driverUsers = allUsers.filter(u => u.role === 'driver');
      
      // Enrich driver data
      const enrichedDrivers = driverUsers.map(driver => ({
        ...driver,
        vehicle: driver.vehicle || 'Not assigned',
        license_plate: driver.license_plate || 'N/A',
        status: driver.is_active ? 'active' : 'inactive',
        on_duty: driver.on_duty || false,
        rating: driver.rating || 4.5,
        total_deliveries: driver.total_deliveries || 0,
      }));
      
      setDrivers(enrichedDrivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
    setLoading(false);
  };

  // Filter drivers
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone?.includes(searchQuery) ||
      driver.license_plate?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'on_duty' && driver.on_duty) ||
      (statusFilter === 'off_duty' && !driver.on_duty) ||
      driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: drivers.length,
    active: drivers.filter(d => d.status === 'active').length,
    onDuty: drivers.filter(d => d.on_duty).length,
    avgRating: drivers.length > 0 ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1) : '0',
  };

  // Pagination
  const totalPages = Math.ceil(filteredDrivers.length / driversPerPage);
  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * driversPerPage,
    currentPage * driversPerPage
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleGeneratePassword = () => {
    const pwd = generateTempPassword(10);
    setGeneratedPassword(pwd);
    setFormData({ ...formData, password: pwd });
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    // Password only required for new drivers
    if (!editingDriver && !formData.password) {
      toast.error('Please generate or enter a password');
      return;
    }

    setFormLoading(true);
    try {
      // Check for duplicate email
      const existingUser = await db.getUserByEmail(formData.email);
      if (existingUser && (!editingDriver || existingUser.id !== editingDriver.id)) {
        toast.error('A user with this email already exists');
        setFormLoading(false);
        return;
      }

      // Check for duplicate phone if provided
      if (formData.phone) {
        const existingPhone = await db.getUserByPhone(formData.phone);
        if (existingPhone && (!editingDriver || existingPhone.id !== editingDriver.id)) {
          toast.error('A user with this phone number already exists');
          setFormLoading(false);
          return;
        }
      }

      if (editingDriver) {
        // Update existing driver - only send fields that exist in users schema
        const updates = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        };
        
        await db.update('users', editingDriver.id, updates);
        toast.success('Driver updated successfully!');
      } else {
        // Create new driver with password - only schema fields
        const userData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: 'driver',
          is_active: true,
        };

        await db.createUserWithPassword(userData, formData.password);
        toast.success('Driver created successfully!');
      }
      
      fetchDrivers();
      setShowAddModal(false);
      setEditingDriver(null);
      resetForm();
    } catch (err) {
      console.error('Error saving driver:', err);
      toast.error('Failed to save driver: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendCredentials = async (driver) => {
    // Generate a new temp password
    const tempPassword = generateTempPassword(10);
    
    try {
      // Update user's password using proper hashing
      await db.updatePassword(driver.id, tempPassword);

      // Send via SMS
      if (driver.phone) {
        await sendSMS(driver.phone, smsTemplates.loginCredentials(driver.email, tempPassword));
      }
      
      // Send via Email
      if (driver.email) {
        const template = emailTemplates.loginCredentials(driver, tempPassword);
        await sendEmail(driver.email, template.subject, template.html);
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
      vehicle: '',
      license_plate: '',
      password: '',
    });
    setGeneratedPassword('');
    setEditingDriver(null);
  };

  const getDriverCheckin = (driverId) => {
    return todayCheckins.find(c => c.user_id === driverId);
  };

  // Export drivers to CSV
  const handleExportCSV = () => {
    if (drivers.length === 0) {
      toast.error('No drivers to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Vehicle', 'License Plate', 'Status', 'Rating', 'Total Deliveries', 'Joined'];
    const rows = filteredDrivers.map(driver => [
      `${driver.first_name} ${driver.last_name}`,
      driver.email || '',
      driver.phone || '',
      driver.vehicle || '',
      driver.license_plate || '',
      driver.status || 'active',
      driver.rating || '4.5',
      driver.total_deliveries || '0',
      driver.created_at ? formatDate(driver.created_at) : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `drivers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success('Drivers exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Driver Management</h1>
          <p className="text-gray-600">Manage your delivery team</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Add Driver
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Drivers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
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
              <Navigation className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.onDuty}</p>
              <p className="text-xs text-gray-500">On Duty</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.avgRating}</p>
              <p className="text-xs text-gray-500">Avg Rating</p>
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
              placeholder="Search drivers..."
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
            <option value="on_duty">On Duty</option>
            <option value="off_duty">Off Duty</option>
          </select>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedDrivers.map((driver) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {driver.first_name?.[0] || ''}{driver.last_name?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900">{driver.first_name} {driver.last_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${driver.on_duty ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-xs text-gray-500">{driver.on_duty ? 'On Duty' : 'Off Duty'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-amber-700">{driver.rating}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="w-4 h-4" />
                  <span>{driver.vehicle}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4" />
                  <span>{driver.total_deliveries} deliveries</span>
                </div>
              </div>

              {/* Check-in Status */}
              {(() => {
                const checkin = getDriverCheckin(driver.id);
                return checkin ? (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-green-700">
                      <LogIn className="w-3 h-3" />
                      <span>Checked in at {new Date(checkin.check_time || checkin.created_at).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {checkin.location_address && (
                      <p className="text-xs text-green-600 mt-1 truncate flex items-center gap-1">
                        <MapPinned className="w-3 h-3 flex-shrink-0" />
                        {checkin.location_address.substring(0, 40)}...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Not checked in today
                    </p>
                  </div>
                );
              })()}

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => setSelectedDriver(driver)}
                  className="flex-1 btn-secondary text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button 
                  onClick={() => handleSendCredentials(driver)}
                  className="flex-1 btn-primary text-sm"
                  title="Send login credentials"
                >
                  <Send className="w-4 h-4" />
                  Credentials
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-navy-900 mb-1">No drivers found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Driver Details Modal */}
      <AnimatePresence>
        {selectedDriver && !showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedDriver(null)}
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
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {selectedDriver.first_name?.[0] || ''}{selectedDriver.last_name?.[0] || ''}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-navy-900">
                        {selectedDriver.first_name} {selectedDriver.last_name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedDriver.on_duty ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedDriver.on_duty ? 'On Duty' : 'Off Duty'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedDriver.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedDriver.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDriver(null)} className="p-2 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <Star className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-navy-900">{selectedDriver.rating}</p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Package className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-navy-900">{selectedDriver.total_deliveries}</p>
                    <p className="text-xs text-gray-500">Deliveries</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-navy-900">{formatDate(selectedDriver.created_at).split(' ')[0]}</p>
                    <p className="text-xs text-gray-500">Joined</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{selectedDriver.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{selectedDriver.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{selectedDriver.vehicle} • {selectedDriver.license_plate}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 flex gap-3">
                <button 
                  onClick={() => {
                    setFormData({
                      first_name: selectedDriver.first_name || '',
                      last_name: selectedDriver.last_name || '',
                      email: selectedDriver.email || '',
                      phone: selectedDriver.phone || '',
                      vehicle: selectedDriver.vehicle || '',
                      license_plate: selectedDriver.license_plate || '',
                      password: '',
                    });
                    setEditingDriver(selectedDriver);
                    setSelectedDriver(null);
                    setShowAddModal(true);
                  }}
                  className="flex-1 btn-secondary"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => {
                    setSelectedDriver(null);
                    navigate('/driver/routes');
                  }}
                  className="flex-1 btn-primary"
                >
                  <MapPin className="w-4 h-4" />
                  View Routes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Driver Modal */}
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
                    {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                  </h2>
                  <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateDriver} className="p-6 space-y-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    placeholder="john@amani.ca"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="2022 Honda Civic"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="ABCD 123"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  />
                </div>

                {/* Password Section - Only for new drivers */}
                {!editingDriver && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login Password *</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="input-field flex-1" 
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingDriver}
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
                        <p className="text-xs text-green-600 mt-1">Save this password - it will be used for login</p>
                      </div>
                    )}
                  </div>
                )}

                {!editingDriver && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> After creating the driver, you can send login credentials via email or SMS using the "Send Credentials" button in the driver list.
                    </p>
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
                    {formLoading ? 'Saving...' : (editingDriver ? 'Update Driver' : 'Add Driver')}
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

export default AdminDrivers;
