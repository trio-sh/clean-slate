import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Car, Building2, Briefcase,
  Mail, Phone, Eye, Check, X, Filter,
  Search, Calendar, MapPin, Store, Key, Loader2, Copy, ExternalLink
} from 'lucide-react';
import db from '../../lib/db';
import toast from 'react-hot-toast';

const getTableName = (type) => {
  if (type === 'partner') return 'laundry_partner_applications';
  if (type === 'driver')  return 'driver_applications';
  if (type === 'career')  return 'career_applications';
  return `${type}_applications`;
};

const AdminApplications = () => {
  const [applications, setApplications] = useState({ driver: [], partner: [], career: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Partner approval modal state
  const [approvingPartner, setApprovingPartner] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approvedCredentials, setApprovedCredentials] = useState(null); // shown after success
  const [depotForm, setDepotForm] = useState({
    name: '', code: '', street_address: '', city: '',
    postal_code: '', phone: '', capacity_per_day: '',
    partner_first_name: '', partner_last_name: '',
    partner_email: '', partner_phone: '', temp_password: 'partner123',
  });

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const [driverApps, partnerApps, careerApps] = await Promise.all([
        db.getAll('driver_applications').catch(() => []),
        db.getAll('laundry_partner_applications').catch(() => []),
        db.getAll('career_applications').catch(() => []),
      ]);
      setApplications({ driver: driverApps || [], partner: partnerApps || [], career: careerApps || [] });
    } catch (error) {
      console.error('Failed to load applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, type, newStatus) => {
    try {
      await db.update(getTableName(type), applicationId, { status: newStatus });
      toast.success('Application status updated');
      loadApplications();
    } catch (error) {
      console.error('Failed to update application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const openPartnerApproval = (app) => {
    setDepotForm({
      name: app.business_name || '',
      code: '',
      street_address: app.business_address || '',
      city: '',
      postal_code: '',
      phone: app.phone || '',
      capacity_per_day: String(app.capacity_per_day || 300),
      partner_first_name: app.contact_person_first_name || '',
      partner_last_name: app.contact_person_last_name || '',
      partner_email: app.email || '',
      partner_phone: app.phone || '',
      temp_password: 'partner123',
    });
    setApprovingPartner(app);
    setSelectedApplication(null);
  };

  const handleApprovePartner = async (e) => {
    e.preventDefault();
    setApproveLoading(true);
    try {
      await db.approvePartnerApplication(approvingPartner.id, depotForm, depotForm.temp_password);
      toast.success(`Partner approved! Credentials sent via SMS if phone was provided.`);
      setApprovingPartner(null);
      setApprovedCredentials({
        depotName: depotForm.name,
        email: depotForm.partner_email,
        password: depotForm.temp_password,
        phone: depotForm.partner_phone,
        loginUrl: `${window.location.origin}/login`,
      });
      loadApplications();
    } catch (err) {
      console.error('Partner approval error:', err);
      toast.error('Failed to approve partner: ' + (err.message || 'Unknown error'));
    } finally {
      setApproveLoading(false);
    }
  };

  const getFilteredApplications = () => {
    let allApps = [];
    if (activeTab === 'all') {
      allApps = [
        ...applications.driver.map(a => ({ ...a, type: 'driver' })),
        ...applications.partner.map(a => ({ ...a, type: 'partner' })),
        ...applications.career.map(a => ({ ...a, type: 'career' })),
      ];
    } else if (activeTab === 'driver') {
      allApps = applications.driver.map(a => ({ ...a, type: 'driver' }));
    } else if (activeTab === 'partner') {
      allApps = applications.partner.map(a => ({ ...a, type: 'partner' }));
    } else if (activeTab === 'career') {
      allApps = applications.career.map(a => ({ ...a, type: 'career' }));
    }
    if (filterStatus !== 'all') allApps = allApps.filter(a => a.status === filterStatus);
    return allApps.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const getTypeInfo = (type) => {
    switch (type) {
      case 'driver':  return { icon: Car,       color: 'text-blue-600',   bgColor: 'bg-blue-100',   name: 'Driver' };
      case 'partner': return { icon: Building2,  color: 'text-green-600',  bgColor: 'bg-green-100',  name: 'Partner' };
      case 'career':  return { icon: Briefcase,  color: 'text-purple-600', bgColor: 'bg-purple-100', name: 'Career' };
      default:        return { icon: Users,      color: 'text-gray-600',   bgColor: 'bg-gray-100',   name: 'Application' };
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':  return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default:         return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-6" />
          <div className="h-12 bg-gray-300 rounded mb-6" />
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-lg shadow-sm mb-4" />)}
        </div>
      </div>
    );
  }

  const filteredApplications = getFilteredApplications();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Applications Management</h1>
          <p className="text-gray-600">Manage all applications from drivers, partners, and career seekers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Applications', value: applications.driver.length + applications.partner.length + applications.career.length, icon: Users, color: 'blue' },
            { label: 'Driver Apps', value: applications.driver.length, icon: Car, color: 'blue' },
            { label: 'Partner Apps', value: applications.partner.length, icon: Building2, color: 'green' },
            { label: 'Career Apps', value: applications.career.length, icon: Briefcase, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="text-2xl font-bold text-navy-900">{value}</p>
                </div>
                <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Applications', icon: null, color: 'amani' },
                { key: 'driver', label: 'Drivers', icon: Car, color: 'blue' },
                { key: 'partner', label: 'Partners', icon: Building2, color: 'green' },
                { key: 'career', label: 'Careers', icon: Briefcase, color: 'purple' },
              ].map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    activeTab === key
                      ? `bg-${color}-500 text-white`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-500">There are no applications matching your current filters.</p>
            </div>
          ) : (
            filteredApplications.map((app) => {
              const TypeInfo = getTypeInfo(app.type);
              const Icon = TypeInfo.icon;
              const isPending = app.status === 'pending' || app.status === 'reviewed';

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 ${TypeInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${TypeInfo.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-navy-900 truncate">
                            {app.type === 'partner'
                              ? app.business_name
                              : `${app.first_name} ${app.last_name}`}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(app.status)}`}>
                            {app.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${TypeInfo.bgColor} ${TypeInfo.color}`}>
                            {TypeInfo.name}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1"><Mail className="w-4 h-4" /><span>{app.email}</span></div>
                          <div className="flex items-center gap-1"><Phone className="w-4 h-4" /><span>{app.phone}</span></div>
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{new Date(app.created_at).toLocaleDateString()}</span></div>
                          {app.type === 'driver' && app.vehicle_type && (
                            <div className="flex items-center gap-1"><Car className="w-4 h-4" /><span>{app.vehicle_type}</span></div>
                          )}
                          {app.type === 'partner' && app.capacity_per_day && (
                            <div className="flex items-center gap-1"><Store className="w-4 h-4" /><span>{app.capacity_per_day} lbs/day</span></div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>

                      {isPending && (
                        <>
                          {app.type === 'partner' ? (
                            <button
                              onClick={() => openPartnerApproval(app)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                            >
                              <Building2 className="w-4 h-4" />
                              Approve & Create Depot
                            </button>
                          ) : (
                            <button
                              onClick={() => updateApplicationStatus(app.id, app.type, 'approved')}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => updateApplicationStatus(app.id, app.type, 'rejected')}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      <AnimatePresence>
        {selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-navy-900">Application Details</h2>
                  <button onClick={() => setSelectedApplication(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-navy-900 mb-3">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {selectedApplication.first_name || selectedApplication.contact_person_first_name} {selectedApplication.last_name || selectedApplication.contact_person_last_name}</div>
                        <div><span className="font-medium">Email:</span> {selectedApplication.email}</div>
                        <div><span className="font-medium">Phone:</span> {selectedApplication.phone}</div>
                        <div><span className="font-medium">Applied:</span> {new Date(selectedApplication.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-900 mb-3">Status & Actions</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-sm">Status: </span>
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedApplication.status)}`}>
                            {selectedApplication.status.toUpperCase()}
                          </span>
                        </div>
                        {(selectedApplication.status === 'pending' || selectedApplication.status === 'reviewed') && (
                          <div className="flex gap-2">
                            {selectedApplication.type === 'partner' ? (
                              <button
                                onClick={() => openPartnerApproval(selectedApplication)}
                                className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                              >
                                Approve & Create Depot
                              </button>
                            ) : (
                              <button
                                onClick={() => { updateApplicationStatus(selectedApplication.id, selectedApplication.type, 'approved'); setSelectedApplication(null); }}
                                className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => { updateApplicationStatus(selectedApplication.id, selectedApplication.type, 'rejected'); setSelectedApplication(null); }}
                              className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedApplication.type === 'driver' && (
                    <div>
                      <h3 className="font-semibold text-navy-900 mb-3">Driver Information</h3>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div><span className="font-medium">Vehicle Type:</span> {selectedApplication.vehicle_type || 'N/A'}</div>
                        <div><span className="font-medium">Experience:</span> {selectedApplication.years_of_experience || 0} years</div>
                        <div><span className="font-medium">Availability:</span> {selectedApplication.availability || 'N/A'}</div>
                        <div><span className="font-medium">City:</span> {selectedApplication.city || 'N/A'}</div>
                        <div><span className="font-medium">Has Insurance:</span> {selectedApplication.has_insurance ? 'Yes' : 'No'}</div>
                      </div>
                      {selectedApplication.experience_details && (
                        <div className="mt-3 text-sm"><span className="font-medium">Experience Details:</span><p className="mt-1 text-gray-700">{selectedApplication.experience_details}</p></div>
                      )}
                      {selectedApplication.message && (
                        <div className="mt-3 text-sm"><span className="font-medium">Message:</span><p className="mt-1 text-gray-700">{selectedApplication.message}</p></div>
                      )}
                    </div>
                  )}

                  {selectedApplication.type === 'partner' && (
                    <div>
                      <h3 className="font-semibold text-navy-900 mb-3">Partner Information</h3>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div><span className="font-medium">Business Name:</span> {selectedApplication.business_name}</div>
                        <div><span className="font-medium">Contact Person:</span> {selectedApplication.contact_person_first_name} {selectedApplication.contact_person_last_name}</div>
                        <div><span className="font-medium">Business License:</span> {selectedApplication.business_license || 'N/A'}</div>
                        <div><span className="font-medium">HST Number:</span> {selectedApplication.hst_number || 'N/A'}</div>
                        <div><span className="font-medium">Years Operating:</span> {selectedApplication.years_operating || 0}</div>
                        <div><span className="font-medium">Capacity:</span> {selectedApplication.capacity_per_day || 0} lbs/day</div>
                        <div className="md:col-span-2"><span className="font-medium">Address:</span> {selectedApplication.business_address}</div>
                        {selectedApplication.business_documents_url && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Documents:</span>
                            <a href={selectedApplication.business_documents_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">View Documents</a>
                          </div>
                        )}
                      </div>
                      {selectedApplication.services_offered && (
                        <div className="mt-3 text-sm"><span className="font-medium">Services Offered:</span><p className="mt-1 text-gray-700">{selectedApplication.services_offered}</p></div>
                      )}
                      {selectedApplication.message && (
                        <div className="mt-3 text-sm"><span className="font-medium">Message:</span><p className="mt-1 text-gray-700">{selectedApplication.message}</p></div>
                      )}
                    </div>
                  )}

                  {selectedApplication.type === 'career' && (
                    <div>
                      <h3 className="font-semibold text-navy-900 mb-3">Career Information</h3>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div><span className="font-medium">Position Applied:</span> {selectedApplication.position_applied}</div>
                        <div><span className="font-medium">Salary Expectation:</span> ${selectedApplication.salary_expectation || 'N/A'}</div>
                        <div><span className="font-medium">Availability:</span> {selectedApplication.availability || 'N/A'}</div>
                        <div><span className="font-medium">References:</span> {selectedApplication.applicant_references || 'N/A'}</div>
                      </div>
                      {selectedApplication.cover_letter && (
                        <div className="mt-3 text-sm"><span className="font-medium">Cover Letter:</span><p className="mt-1 text-gray-700">{selectedApplication.cover_letter}</p></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Approve Partner → Create Depot Modal */}
      <AnimatePresence>
        {approvingPartner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-navy-900">Approve Partner & Create Depot</h2>
                    <p className="text-sm text-gray-500 mt-1">This will create a depot and partner login for <strong>{approvingPartner.business_name}</strong></p>
                  </div>
                  <button onClick={() => setApprovingPartner(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleApprovePartner} className="space-y-6">
                  {/* Depot Info */}
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
                      <Store className="w-4 h-4 text-amani-500" />
                      Depot Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Depot Name *</label>
                        <input type="text" required value={depotForm.name}
                          onChange={e => setDepotForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                          placeholder="e.g. Amani Lawrence West" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Depot Code *</label>
                        <input type="text" required value={depotForm.code}
                          onChange={e => setDepotForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                          placeholder="e.g. AMN-LW01" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                        <input type="text" required value={depotForm.street_address}
                          onChange={e => setDepotForm(p => ({ ...p, street_address: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input type="text" required value={depotForm.city}
                          onChange={e => setDepotForm(p => ({ ...p, city: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                        <input type="text" value={depotForm.postal_code}
                          onChange={e => setDepotForm(p => ({ ...p, postal_code: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="text" value={depotForm.phone}
                          onChange={e => setDepotForm(p => ({ ...p, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Daily Capacity (lbs)</label>
                        <input type="number" min="0" value={depotForm.capacity_per_day}
                          onChange={e => setDepotForm(p => ({ ...p, capacity_per_day: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                      </div>
                    </div>
                  </div>

                  {/* Partner Login */}
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4 text-amani-500" />
                      Partner Portal Login
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <input type="text" required value={depotForm.partner_first_name}
                          onChange={e => setDepotForm(p => ({ ...p, partner_first_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                        <input type="text" required value={depotForm.partner_last_name}
                          onChange={e => setDepotForm(p => ({ ...p, partner_last_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Login Email *</label>
                        <input type="email" required value={depotForm.partner_email}
                          onChange={e => setDepotForm(p => ({ ...p, partner_email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Temp Password *</label>
                        <input type="text" required value={depotForm.temp_password}
                          onChange={e => setDepotForm(p => ({ ...p, temp_password: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                      </div>
                    </div>
                    <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg">
                      Share these credentials with the partner. They should change their password on first login.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setApprovingPartner(null)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={approveLoading}
                      className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                      {approveLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Check className="w-4 h-4" /> Approve & Create Depot</>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Credentials Panel — shown after partner is approved */}
      <AnimatePresence>
        {approvedCredentials && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-navy-900">Partner Approved!</h2>
                    <p className="text-sm text-gray-500">Depot: {approvedCredentials.depotName}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Portal Login Credentials</p>

                  {[
                    { label: 'Login URL', value: approvedCredentials.loginUrl },
                    { label: 'Email', value: approvedCredentials.email },
                    { label: 'Password', value: approvedCredentials.password },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-sm font-mono font-medium text-navy-900 truncate">{value}</p>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied!`); }}
                        className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 flex-shrink-0"
                        title={`Copy ${label}`}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {approvedCredentials.phone ? (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2 mb-4">
                    SMS with login credentials was sent to {approvedCredentials.phone}.
                  </p>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">
                    No phone number provided — please share these credentials manually with the partner.
                  </p>
                )}

                <div className="flex gap-3">
                  <a
                    href={approvedCredentials.loginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Login Page
                  </a>
                  <button
                    onClick={() => setApprovedCredentials(null)}
                    className="flex-1 py-2.5 bg-amani-500 text-white rounded-xl text-sm font-semibold hover:bg-amani-600 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminApplications;
