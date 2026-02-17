import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, MapPin, Users, Calendar, Search, Filter,
  LogIn, LogOut, RefreshCw, Download, ChevronLeft,
  ChevronRight, User, Truck, Building2, Eye
} from 'lucide-react';
import db from '../../lib/db';
import { format, parseISO, isToday, differenceInHours, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';

const AdminCheckins = () => {
  const [checkins, setCheckins] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get all check-ins for the selected date
      const allCheckins = await db.getAll('checkins');
      const users = await db.getAll('users');
      
      // Filter by date
      const dateCheckins = allCheckins.filter(c => c.check_date === selectedDate);
      
      // Map user info
      const checkinsWithUsers = dateCheckins.map(c => ({
        ...c,
        user: users.find(u => u.id === c.user_id)
      })).sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time));
      
      setCheckins(checkinsWithUsers);
      setAllUsers(users.filter(u => ['staff', 'driver'].includes(u.role)));
    } catch (err) {
      console.error('Failed to load check-ins:', err);
      toast.error('Failed to load check-in data');
    } finally {
      setLoading(false);
    }
  };

  // Get staff/drivers who haven't checked in today
  const notCheckedIn = allUsers.filter(user => 
    !checkins.some(c => c.user_id === user.id)
  );

  // Filter check-ins
  const filteredCheckins = checkins.filter(c => {
    if (roleFilter !== 'all' && c.user?.role !== roleFilter) return false;
    if (searchQuery) {
      const fullName = `${c.user?.first_name} ${c.user?.last_name}`.toLowerCase();
      if (!fullName.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCheckins.length / itemsPerPage);
  const paginatedCheckins = filteredCheckins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    totalCheckedIn: checkins.length,
    staffCheckedIn: checkins.filter(c => c.user?.role === 'staff').length,
    driversCheckedIn: checkins.filter(c => c.user?.role === 'driver').length,
    avgWorkHours: checkins.filter(c => c.check_out_time).length > 0
      ? (checkins
          .filter(c => c.check_out_time)
          .reduce((sum, c) => sum + differenceInHours(parseISO(c.check_out_time), parseISO(c.check_in_time)), 0) / 
          checkins.filter(c => c.check_out_time).length).toFixed(1)
      : '—',
  };

  const formatDuration = (checkin) => {
    if (!checkin.check_out_time) {
      const mins = differenceInMinutes(new Date(), parseISO(checkin.check_in_time));
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m (ongoing)`;
    }
    const mins = differenceInMinutes(parseISO(checkin.check_out_time), parseISO(checkin.check_in_time));
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Role', 'Check In Time', 'Check In Location', 'Check Out Time', 'Check Out Location', 'Duration'];
    const rows = filteredCheckins.map(c => [
      `${c.user?.first_name} ${c.user?.last_name}`,
      c.user?.role,
      format(parseISO(c.check_in_time), 'yyyy-MM-dd HH:mm:ss'),
      c.check_in_location?.address || '',
      c.check_out_time ? format(parseISO(c.check_out_time), 'yyyy-MM-dd HH:mm:ss') : '',
      c.check_out_location?.address || '',
      formatDuration(c)
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkins-${selectedDate}.csv`;
    a.click();
    toast.success('Check-ins exported!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-amani-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading check-ins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">
            Staff & Driver Check-ins
          </h1>
          <p className="text-gray-500">Track attendance and work hours</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={exportToCSV} className="btn-primary">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <LogIn className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.totalCheckedIn}</p>
              <p className="text-sm text-gray-500">Checked In</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.staffCheckedIn}</p>
              <p className="text-sm text-gray-500">Staff</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.driversCheckedIn}</p>
              <p className="text-sm text-gray-500">Drivers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.avgWorkHours}h</p>
              <p className="text-sm text-gray-500">Avg Hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Not Checked In Alert */}
      {isToday(new Date(selectedDate)) && notCheckedIn.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                {notCheckedIn.length} team member{notCheckedIn.length > 1 ? 's' : ''} haven't checked in today
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {notCheckedIn.slice(0, 5).map(user => (
                  <span key={user.id} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm">
                    {user.first_name} {user.last_name} ({user.role})
                  </span>
                ))}
                {notCheckedIn.length > 5 && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm">
                    +{notCheckedIn.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amani-500/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amani-500/50"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amani-500/50"
            >
              <option value="all">All Roles</option>
              <option value="staff">Staff Only</option>
              <option value="driver">Drivers Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Check-ins Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check In</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check Out</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedCheckins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                    No check-ins found for this date
                  </td>
                </tr>
              ) : (
                paginatedCheckins.map((checkin) => (
                  <motion.tr
                    key={checkin.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amani-100 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-amani-600">
                            {checkin.user?.first_name?.charAt(0)}{checkin.user?.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-navy-900">
                            {checkin.user?.first_name} {checkin.user?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{checkin.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        checkin.user?.role === 'driver' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {checkin.user?.role === 'driver' ? <Truck className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {checkin.user?.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <LogIn className="w-4 h-4 text-green-500" />
                        <span className="text-navy-900">
                          {format(parseISO(checkin.check_in_time), 'h:mm a')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {checkin.check_out_time ? (
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-orange-500" />
                          <span className="text-navy-900">
                            {format(parseISO(checkin.check_out_time), 'h:mm a')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-green-600 font-medium">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-medium ${checkin.check_out_time ? 'text-navy-900' : 'text-green-600'}`}>
                        {formatDuration(checkin)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-600 truncate" title={checkin.check_in_location?.address}>
                          <MapPin className="w-3 h-3 inline mr-1 text-gray-400" />
                          {checkin.check_in_location?.address?.substring(0, 40) || 'N/A'}...
                        </p>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCheckins.length)} of {filteredCheckins.length}
            </p>
            <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCheckins;
