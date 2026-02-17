import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Car, Building2, Briefcase, 
  Mail, Phone, Eye, Check, X, Filter,
  Download, Search, Calendar, Clock
} from 'lucide-react';
import db from '../../lib/db';
import toast from 'react-hot-toast';

const AdminApplications = () => {
  const [applications, setApplications] = useState({
    driver: [],
    partner: [],
    career: []
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      const [driverApps, partnerApps, careerApps] = await Promise.all([
        db.getAll('driver_applications'),
        db.getAll('laundry_partner_applications'),
        db.getAll('career_applications')
      ]);

      setApplications({
        driver: driverApps || [],
        partner: partnerApps || [],
        career: careerApps || []
      });
    } catch (error) {
      console.error('Failed to load applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, tableName, newStatus) => {
    try {
      await db.update(tableName, applicationId, { status: newStatus });
      toast.success('Application status updated successfully');
      loadApplications(); // Refresh the data
    } catch (error) {
      console.error('Failed to update application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const getFilteredApplications = () => {
    let allApps = [];
    
    if (activeTab === 'all') {
      allApps = [
        ...applications.driver.map(app => ({ ...app, type: 'driver' })),
        ...applications.partner.map(app => ({ ...app, type: 'partner' })),
        ...applications.career.map(app => ({ ...app, type: 'career' }))
      ];
    } else {
      if (activeTab === 'driver') {
        allApps = applications.driver.map(app => ({ ...app, type: 'driver' }));
      } else if (activeTab === 'partner') {
        allApps = applications.partner.map(app => ({ ...app, type: 'partner' }));
      } else if (activeTab === 'career') {
        allApps = applications.career.map(app => ({ ...app, type: 'career' }));
      }
    }

    if (filterStatus !== 'all') {
      allApps = allApps.filter(app => app.status === filterStatus);
    }

    // Sort by creation date (newest first)
    allApps.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return allApps;
  };

  const getTypeInfo = (type) => {
    switch (type) {
      case 'driver':
        return { icon: Car, color: 'text-blue-600', bgColor: 'bg-blue-100', name: 'Driver' };
      case 'partner':
        return { icon: Building2, color: 'text-green-600', bgColor: 'bg-green-100', name: 'Partner' };
      case 'career':
        return { icon: Briefcase, color: 'text-purple-600', bgColor: 'bg-purple-100', name: 'Career' };
      default:
        return { icon: Users, color: 'text-gray-600', bgColor: 'bg-gray-100', name: 'Application' };
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="h-12 bg-gray-300 rounded mb-6"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white rounded-lg shadow-sm"></div>
              ))}
            </div>
          </div>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-navy-900">
                  {applications.driver.length + applications.partner.length + applications.career.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Driver Apps</p>
                <p className="text-2xl font-bold text-navy-900">{applications.driver.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Partner Apps</p>
                <p className="text-2xl font-bold text-navy-900">{applications.partner.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Career Apps</p>
                <p className="text-2xl font-bold text-navy-900">{applications.career.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-amani-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Applications
              </button>
              <button
                onClick={() => setActiveTab('driver')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'driver'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Car className="w-4 h-4" />
                Drivers
              </button>
              <button
                onClick={() => setActiveTab('partner')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'partner'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Partners
              </button>
              <button
                onClick={() => setActiveTab('career')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'career'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Careers
              </button>
            </div>

            <div className="flex items-center gap-3">
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
                            {app.type === 'driver' 
                              ? `${app.first_name} ${app.last_name}`
                              : app.type === 'partner'
                              ? app.business_name
                              : `${app.first_name} ${app.last_name}`
                            }
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(app.status)}`}>
                            {app.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{app.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{app.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                          
                          {app.type === 'driver' && app.vehicle_type && (
                            <div className="flex items-center gap-1">
                              <Car className="w-4 h-4" />
                              <span>{app.vehicle_type}</span>
                            </div>
                          )}
                          
                          {app.type === 'partner' && app.position_applied && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{app.position_applied}</span>
                            </div>
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
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateApplicationStatus(app.id, `${app.type}_applications`, 'approved')}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(app.id, `${app.type}_applications`, 'rejected')}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-navy-900">Application Details</h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-2">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedApplication.first_name} {selectedApplication.last_name}</div>
                      <div><span className="font-medium">Email:</span> {selectedApplication.email}</div>
                      <div><span className="font-medium">Phone:</span> {selectedApplication.phone}</div>
                      <div><span className="font-medium">Applied:</span> {new Date(selectedApplication.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-navy-900 mb-2">Status & Actions</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedApplication.status)}`}>
                          {selectedApplication.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            updateApplicationStatus(selectedApplication.id, `${selectedApplication.type}_applications`, 'approved');
                            setSelectedApplication(null);
                          }}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            updateApplicationStatus(selectedApplication.id, `${selectedApplication.type}_applications`, 'rejected');
                            setSelectedApplication(null);
                          }}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Application-Specific Fields */}
                {selectedApplication.type === 'driver' && (
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-2">Driver Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Vehicle Type:</span> {selectedApplication.vehicle_type || 'N/A'}</div>
                      <div><span className="font-medium">License Number:</span> {selectedApplication.license_number || 'N/A'}</div>
                      <div><span className="font-medium">Experience:</span> {selectedApplication.years_of_experience || 0} years</div>
                      <div><span className="font-medium">Availability:</span> {selectedApplication.availability || 'N/A'}</div>
                      {selectedApplication.resume_url && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Resume:</span>
                          <a href={selectedApplication.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                            View Resume
                          </a>
                        </div>
                      )}
                    </div>
                    {selectedApplication.message && (
                      <div className="mt-4">
                        <span className="font-medium">Message:</span>
                        <p className="mt-1 text-gray-700">{selectedApplication.message}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedApplication.type === 'partner' && (
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-2">Partner Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Business Name:</span> {selectedApplication.business_name}</div>
                      <div><span className="font-medium">Contact Person:</span> {selectedApplication.contact_person_first_name} {selectedApplication.contact_person_last_name}</div>
                      <div><span className="font-medium">Business License:</span> {selectedApplication.business_license || 'N/A'}</div>
                      <div><span className="font-medium">Years Operating:</span> {selectedApplication.years_operating || 0}</div>
                      <div><span className="font-medium">Capacity:</span> {selectedApplication.capacity_per_day || 0} lbs/day</div>
                      <div><span className="font-medium">Address:</span> {selectedApplication.business_address}</div>
                      {selectedApplication.business_documents_url && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Documents:</span>
                          <a href={selectedApplication.business_documents_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                            View Documents
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="font-medium">Services Offered:</span>
                      <p className="mt-1 text-gray-700">{selectedApplication.services_offered}</p>
                    </div>
                    {selectedApplication.message && (
                      <div className="mt-4">
                        <span className="font-medium">Message:</span>
                        <p className="mt-1 text-gray-700">{selectedApplication.message}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedApplication.type === 'career' && (
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-2">Career Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Position Applied:</span> {selectedApplication.position_applied}</div>
                      <div><span className="font-medium">Salary Expectation:</span> ${selectedApplication.salary_expectation || 'N/A'}</div>
                      <div><span className="font-medium">Availability:</span> {selectedApplication.availability || 'N/A'}</div>
                      <div><span className="font-medium">References:</span> {selectedApplication.references || 'N/A'}</div>
                      {selectedApplication.resume_url && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Resume:</span>
                          <a href={selectedApplication.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                            View Resume
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="font-medium">Cover Letter:</span>
                      <p className="mt-1 text-gray-700">{selectedApplication.cover_letter}</p>
                    </div>
                    {selectedApplication.message && (
                      <div className="mt-4">
                        <span className="font-medium">Additional Info:</span>
                        <p className="mt-1 text-gray-700">{selectedApplication.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;