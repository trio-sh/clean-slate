import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, MapPin, Phone, Clock, Package,
  Edit2, Check, X, Loader2, ChevronDown
} from 'lucide-react';
import db from '../../lib/db';
import { useAuthStore } from '../../stores';
import toast from 'react-hot-toast';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

const PartnerDepotInfo = () => {
  const { user } = useAuthStore();
  const [depot, setDepot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { loadDepot(); }, [user]);

  const loadDepot = async () => {
    try {
      if (!user?.depot_id) { setLoading(false); return; }
      const data = await db.getById('depots', user.depot_id);
      setDepot(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    setEditForm({
      phone: depot?.phone || '',
      operating_hours: depot?.operating_hours || {},
    });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.update('depots', depot.id, editForm);
      toast.success('Depot info updated');
      setEditing(false);
      loadDepot();
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateHours = (day, field, value) => {
    setEditForm(p => ({
      ...p,
      operating_hours: { ...p.operating_hours, [day]: { ...p.operating_hours[day], [field]: value } },
    }));
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        <div className="h-48 bg-white rounded-xl" />
      </div>
    );
  }

  if (!depot) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
          <Building2 className="w-8 h-8 mb-3" />
          <h3 className="font-semibold mb-1">No depot linked to your account</h3>
          <p className="text-sm">Contact Amani's admin to link a depot to your partner account.</p>
        </div>
      </div>
    );
  }

  const hours = depot.operating_hours || {};

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900">My Depot</h1>
        {!editing && (
          <button onClick={openEdit}
            className="flex items-center gap-2 px-4 py-2 bg-amani-500 text-white rounded-lg hover:bg-amani-600 transition-colors text-sm font-medium">
            <Edit2 className="w-4 h-4" />
            Edit Info
          </button>
        )}
      </div>

      {/* Depot Header Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-navy-800 to-navy-900 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{depot.name}</h2>
            <p className="text-white/70 font-mono text-sm">{depot.code}</p>
            <div className="flex items-center gap-2 mt-2 text-white/80 text-sm">
              <div className={`w-2 h-2 rounded-full ${depot.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
              {depot.status === 'active' ? 'Active' : depot.status}
            </div>
          </div>
        </div>
      </motion.div>

      {!editing ? (
        <div className="space-y-4">
          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amani-500" /> Address
              </h3>
              <p className="text-gray-700">{depot.street_address}</p>
              <p className="text-gray-600">{depot.city}{depot.postal_code ? `, ${depot.postal_code}` : ''}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-amani-500" /> Capacity
              </h3>
              <p className="text-3xl font-bold text-navy-900">{depot.capacity_per_day || '—'}</p>
              <p className="text-gray-500 text-sm">lbs per day</p>
            </div>
          </div>

          {depot.phone && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-amani-500" /> Contact Phone
              </h3>
              <p className="text-gray-700 text-lg">{depot.phone}</p>
            </div>
          )}

          {/* Operating Hours */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amani-500" /> Operating Hours
            </h3>
            <div className="space-y-2">
              {DAYS.map(day => {
                const h = hours[day] || {};
                return (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 w-28">{DAY_LABELS[day]}</span>
                    {h.closed ? (
                      <span className="text-red-500">Closed</span>
                    ) : (
                      <span className="text-gray-600">{h.open || '—'} – {h.close || '—'}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-amani-500" /> Contact Phone
            </h3>
            <input
              type="text"
              value={editForm.phone}
              onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-transparent"
              placeholder="e.g. 437-215-6321"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amani-500" /> Operating Hours
            </h3>
            <div className="space-y-3">
              {DAYS.map(day => {
                const h = editForm.operating_hours?.[day] || { open: '08:00', close: '18:00', closed: false };
                return (
                  <div key={day} className="flex items-center gap-3 text-sm">
                    <span className="w-24 font-medium text-gray-600">{DAY_LABELS[day].slice(0, 3)}</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={h.closed}
                        onChange={e => updateHours(day, 'closed', e.target.checked)}
                        className="rounded" />
                      <span className="text-gray-500 text-xs">Closed</span>
                    </label>
                    {!h.closed && (
                      <>
                        <input type="time" value={h.open}
                          onChange={e => updateHours(day, 'open', e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded text-sm" />
                        <span className="text-gray-400">–</span>
                        <input type="time" value={h.close}
                          onChange={e => updateHours(day, 'close', e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded text-sm" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setEditing(false)}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-amani-500 text-white rounded-xl hover:bg-amani-600 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Check className="w-4 h-4" />Save Changes</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PartnerDepotInfo;
