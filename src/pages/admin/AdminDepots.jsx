import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, MapPin, Phone, Clock, Users,
  Edit2, X, Check, Plus, Loader2, Package,
  TrendingUp, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import db from '../../lib/db';
import toast from 'react-hot-toast';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

const defaultHours = () =>
  Object.fromEntries(DAYS.map(d => [d, { open: '08:00', close: '18:00', closed: d === 'sun' }]));

const StatusBadge = ({ status }) => {
  if (status === 'active') return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
  if (status === 'inactive') return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactive</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{status}</span>;
};

const AdminDepots = () => {
  const [depots, setDepots] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDepot, setEditingDepot] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewOrders, setViewOrders] = useState(null);
  const [depotOrders, setDepotOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [depotsData, usersData] = await Promise.all([
        db.getDepots(),
        db.getAll('users'),
      ]);
      setDepots(depotsData);
      setPartners(usersData.filter(u => u.role === 'partner'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load depots');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (depot) => {
    setEditForm({
      name: depot.name || '',
      code: depot.code || '',
      street_address: depot.street_address || '',
      city: depot.city || '',
      postal_code: depot.postal_code || '',
      phone: depot.phone || '',
      capacity_per_day: String(depot.capacity_per_day || 300),
      status: depot.status || 'active',
      manager_id: depot.manager_id || '',
      operating_hours: depot.operating_hours || defaultHours(),
    });
    setEditingDepot(depot);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.update('depots', editingDepot.id, {
        ...editForm,
        capacity_per_day: parseInt(editForm.capacity_per_day) || 0,
      });
      toast.success('Depot updated successfully');
      setEditingDepot(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update depot');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (depot) => {
    const newStatus = depot.status === 'active' ? 'inactive' : 'active';
    try {
      await db.update('depots', depot.id, { status: newStatus });
      toast.success(`Depot ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const openDepotOrders = async (depot) => {
    setViewOrders(depot);
    setOrdersLoading(true);
    try {
      const orders = await db.getOrdersByDepot(depot.id);
      setDepotOrders(orders);
    } catch (err) {
      toast.error('Failed to load depot orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateHours = (day, field, value) => {
    setEditForm(p => ({
      ...p,
      operating_hours: {
        ...p.operating_hours,
        [day]: { ...p.operating_hours[day], [field]: value },
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-6" />
          {[1,2].map(i => <div key={i} className="h-40 bg-white rounded-xl shadow-sm mb-4" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy-900 mb-1">Depot Management</h1>
            <p className="text-gray-600">Manage all laundry partner depots and their operations</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              {depots.filter(d => d.status === 'active').length} Active
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
              {depots.length} Total
            </span>
          </div>
        </div>

        {/* Depots Grid */}
        {depots.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No depots yet</h3>
            <p className="text-gray-500">Approve a partner application to create the first depot.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {depots.map(depot => {
              const manager = partners.find(p => p.id === depot.manager_id);
              const hours = depot.operating_hours || {};

              return (
                <motion.div
                  key={depot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Depot header */}
                  <div className="bg-gradient-to-r from-navy-800 to-navy-900 px-6 py-4 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg truncate">{depot.name}</h3>
                          <p className="text-white/70 text-sm font-mono">{depot.code}</p>
                        </div>
                      </div>
                      <StatusBadge status={depot.status} />
                    </div>
                  </div>

                  {/* Depot details */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-500 text-xs">Address</p>
                          <p className="font-medium text-gray-800">{depot.street_address}</p>
                          <p className="text-gray-600">{depot.city}{depot.postal_code ? `, ${depot.postal_code}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-500 text-xs">Daily Capacity</p>
                          <p className="font-bold text-2xl text-navy-900">{depot.capacity_per_day || '—'}</p>
                          <p className="text-gray-500 text-xs">lbs/day</p>
                        </div>
                      </div>
                    </div>

                    {depot.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{depot.phone}</span>
                      </div>
                    )}

                    {manager && (
                      <div className="flex items-center gap-2 text-sm p-3 bg-green-50 rounded-lg">
                        <Users className="w-4 h-4 text-green-600" />
                        <div>
                          <span className="text-green-700 font-medium">Partner: </span>
                          <span className="text-green-800">{manager.first_name} {manager.last_name}</span>
                          <span className="text-green-600 text-xs ml-2">({manager.email})</span>
                        </div>
                      </div>
                    )}

                    {/* Operating Hours summary */}
                    {Object.keys(hours).length > 0 && (
                      <div className="text-sm">
                        <p className="text-gray-500 text-xs mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Operating Hours</p>
                        <div className="grid grid-cols-7 gap-1">
                          {DAYS.map(day => (
                            <div key={day} className="text-center">
                              <p className="text-xs text-gray-400 font-medium">{DAY_LABELS[day]}</p>
                              {hours[day]?.closed ? (
                                <p className="text-xs text-red-400 font-medium">Closed</p>
                              ) : (
                                <p className="text-xs text-green-600 font-medium">{hours[day]?.open?.slice(0,5) || '—'}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => openEdit(depot)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-navy-50 text-navy-700 rounded-lg hover:bg-navy-100 transition-colors text-sm font-medium"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => openDepotOrders(depot)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-amani-50 text-amani-700 rounded-lg hover:bg-amani-100 transition-colors text-sm font-medium"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Orders
                      </button>
                      <button
                        onClick={() => handleToggleStatus(depot)}
                        className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                          depot.status === 'active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {depot.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Depot Modal */}
      <AnimatePresence>
        {editingDepot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-navy-900">Edit Depot — {editingDepot.name}</h2>
                  <button onClick={() => setEditingDepot(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Depot Name</label>
                      <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Depot Code</label>
                      <input value={editForm.code} onChange={e => setEditForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent font-mono" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input value={editForm.street_address} onChange={e => setEditForm(p => ({ ...p, street_address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input value={editForm.postal_code} onChange={e => setEditForm(p => ({ ...p, postal_code: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Daily Capacity (lbs)</label>
                      <input type="number" min="0" value={editForm.capacity_per_day} onChange={e => setEditForm(p => ({ ...p, capacity_per_day: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Partner Manager</label>
                      <select value={editForm.manager_id} onChange={e => setEditForm(p => ({ ...p, manager_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent">
                        <option value="">No partner assigned</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div>
                    <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amani-500" />
                      Operating Hours
                    </h3>
                    <div className="space-y-2">
                      {DAYS.map(day => {
                        const h = editForm.operating_hours?.[day] || { open: '08:00', close: '18:00', closed: false };
                        return (
                          <div key={day} className="flex items-center gap-3 text-sm">
                            <span className="w-10 font-medium text-gray-600">{DAY_LABELS[day]}</span>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={h.closed}
                                onChange={e => updateHours(day, 'closed', e.target.checked)}
                                className="rounded" />
                              <span className="text-gray-500 text-xs">Closed</span>
                            </label>
                            {!h.closed && (
                              <>
                                <input type="time" value={h.open} onChange={e => updateHours(day, 'open', e.target.value)}
                                  className="px-2 py-1 border border-gray-200 rounded text-sm" />
                                <span className="text-gray-400">—</span>
                                <input type="time" value={h.close} onChange={e => updateHours(day, 'close', e.target.value)}
                                  className="px-2 py-1 border border-gray-200 rounded text-sm" />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setEditingDepot(null)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 py-3 bg-amani-500 text-white rounded-xl hover:bg-amani-600 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Depot Orders Drawer */}
      <AnimatePresence>
        {viewOrders && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-navy-900">Orders — {viewOrders.name}</h2>
                  <p className="text-sm text-gray-500">{depotOrders.length} orders assigned to this depot</p>
                </div>
                <button onClick={() => setViewOrders(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-6">
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amani-500" />
                  </div>
                ) : depotOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>No orders assigned to this depot yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {depotOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl text-sm">
                        <div>
                          <p className="font-medium text-navy-900">#{order.reference_code}</p>
                          <p className="text-gray-600">{order.customer_name}</p>
                          <p className="text-gray-500 text-xs">{order.pickup_date}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'ready' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                          <p className="text-gray-700 font-semibold mt-1">${(order.total || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDepots;
