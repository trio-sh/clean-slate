import { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Edit2, Trash2, Mail, Phone,
  Shield, Clock, Calendar, MoreVertical, CheckCircle,
  XCircle, AlertTriangle, Filter, Download, UserPlus,
  Key, Copy, Send, LogIn, MapPinned
} from 'lucide-react';
import db from '../../lib/db';
import { generateTempPassword, sendEmail, emailTemplates, sendSMS, smsTemplates } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [todayCheckins, setTodayCheckins] = useState([]);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'staff',
    status: 'active',
    hire_date: new Date().toISOString().split('T')[0],
    hourly_rate: '',
    notes: '',
    password: ''
  });

  useEffect(() => {
    loadStaff();
    fetchTodayCheckins();
  }, []);

  const fetchTodayCheckins = async () => {
    try {
      const checkins = await db.getAllTodayCheckins();
      const staffCheckins = checkins.filter(c => c.user?.role === 'staff' || c.user?.role === 'admin');
      setTodayCheckins(staffCheckins);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
    }
  };

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      // Use users table - derive status from is_active field
      const allUsers = await db.getAll('users');
      const staffMembers = allUsers
        .filter(u => u.role === 'staff' || u.role === 'admin')
        .map(u => ({
          ...u,
          status: u.is_active === false ? 'inactive' : 'active',
        }));
      setStaff(staffMembers);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const pwd = generateTempPassword(10);
    setGeneratedPassword(pwd);
    setFormData({ ...formData, password: pwd });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    setFormLoading(true);
    try {
      // Check for duplicate email
      const existingUser = await db.getUserByEmail(formData.email);
      if (existingUser && (!editingStaff || existingUser.id !== editingStaff.id)) {
        toast.error('A user with this email already exists');
        setFormLoading(false);
        return;
      }

      // Check for duplicate phone if provided
      if (formData.phone) {
        const existingPhone = await db.getUserByPhone(formData.phone);
        if (existingPhone && (!editingStaff || existingPhone.id !== editingStaff.id)) {
          toast.error('A user with this phone number already exists');
          setFormLoading(false);
          return;
        }
      }

      if (editingStaff) {
        // Only send fields that exist in users schema
        const updates = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          is_active: formData.status === 'active',
          updated_at: new Date().toISOString()
        };
        await db.update('users', editingStaff.id, updates);
        toast.success('Staff member updated!');
      } else {
        if (!formData.password) {
          toast.error('Please generate or enter a password');
          setFormLoading(false);
          return;
        }
        
        // Only send fields that exist in users schema
        const userData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          is_active: formData.status === 'active',
        };

        await db.createUserWithPassword(userData, formData.password);
        toast.success('Staff member created!');
      }
      loadStaff();
      closeModal();
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error('Failed to save: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendCredentials = async (member) => {
    const tempPassword = generateTempPassword(10);
    
    try {
      // Update password using proper hashing
      await db.updatePassword(member.id, tempPassword);

      if (member.phone) {
        await sendSMS(member.phone, smsTemplates.loginCredentials(member.email, tempPassword));
      }
      
      if (member.email) {
        const template = emailTemplates.loginCredentials(member, tempPassword);
        await sendEmail(member.email, template.subject, template.html);
      }

      toast.success('Login credentials sent!');
    } catch (err) {
      console.error('Error sending credentials:', err);
      toast.error('Failed to send credentials');
    }
  };

  const getStaffCheckin = (staffId) => {
    return todayCheckins.find(c => c.user_id === staffId);
  };

  const handleDelete = async (id) => {
    try {
      await db.delete('users', id);
      loadStaff();
      setShowDeleteConfirm(null);
      toast.success('Staff member deleted');
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to delete');
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingStaff(null);
    setGeneratedPassword('');
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'staff',
      status: 'active',
      hire_date: new Date().toISOString().split('T')[0],
      hourly_rate: '',
      notes: '',
      password: ''
    });
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setFormData({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'staff',
      status: member.is_active === false ? 'inactive' : 'active',
      hire_date: new Date().toISOString().split('T')[0],
      hourly_rate: '',
      notes: '',
      password: ''
    });
    setShowAddModal(true);
  };

  const filteredStaff = staff.filter(member => {
    const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
    const matchesSearch = 
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (member.is_active === false ? 'inactive' : 'active') === statusFilter ||
      member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      on_leave: 'bg-yellow-100 text-yellow-800'
    };
    return styles[status] || styles.active;
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800',
      staff: 'bg-blue-100 text-blue-800'
    };
    return styles[role] || styles.staff;
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
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage your team members and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {staff.filter(s => s.status === 'active').length}
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
              <p className="text-sm text-gray-500">On Leave</p>
              <p className="text-2xl font-bold text-yellow-600">
                {staff.filter(s => s.status === 'on_leave').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-purple-600">
                {staff.filter(s => s.role === 'admin').length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
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
              placeholder="Search staff members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hire Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No staff members found
                  </td>
                </tr>
              ) : (
                filteredStaff.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-amani-green/10 flex items-center justify-center">
                          <span className="text-amani-green font-medium">
                            {member.first_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{member.first_name} {member.last_name}</p>
                          <p className="text-sm text-gray-500">ID: {member.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(member.status)}`}>
                        {member.status?.replace('_', ' ') || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {member.hire_date 
                        ? new Date(member.hire_date).toLocaleDateString()
                        : new Date(member.created_at).toLocaleDateString()
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleSendCredentials(member)}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Send Login Credentials"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-2 text-gray-400 hover:text-amani-green transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(member)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
            <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>

                {/* Password Section - Only for new staff */}
                {!editingStaff && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login Password *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="w-full flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
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
                        <p className="text-xs text-green-600 mt-1">Save this password — staff will use it to log in</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
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
                    disabled={formLoading}
                    className="flex-1 px-4 py-2 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark transition-colors disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : (editingStaff ? 'Update' : 'Add')} Staff
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
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Staff Member?</h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to remove {showDeleteConfirm.first_name} {showDeleteConfirm.last_name}? This action cannot be undone.
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
