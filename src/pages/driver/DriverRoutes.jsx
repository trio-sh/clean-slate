import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

import { 
  MapPin, Navigation, Package, CheckCircle, Clock,
  Phone, RefreshCw, List, Map as MapIcon,
  Truck, Eye, X, ExternalLink, ChevronRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '../../stores';
import db from '../../lib/db';
import { format, parseISO } from 'date-fns';
import { formatAddress } from '../../lib/utils';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createNumberedIcon = (number, color, isCompleted = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${isCompleted ? '#10b981' : color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${isCompleted ? 'opacity: 0.7;' : ''}
      ">
        ${isCompleted ? '✓' : number}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Component to fit map to bounds
const FitBounds = ({ stops }) => {
  const map = useMap();
  
  useEffect(() => {
    if (stops.length > 0) {
      const validStops = stops.filter(s => s.lat && s.lng);
      if (validStops.length > 0) {
        const bounds = L.latLngBounds(validStops.map(s => [s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [stops, map]);
  
  return null;
};

// Component to recenter map
const RecenterButton = ({ center }) => {
  const map = useMap();
  
  const handleRecenter = () => {
    map.setView(center, 13);
  };
  
  return (
    <button
      onClick={handleRecenter}
      className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100"
      title="Recenter Map"
    >
      <Navigation className="w-5 h-5 text-gray-600" />
    </button>
  );
};

const DriverRoutes = () => {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState('map');
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Toronto coordinates for demo data
  const torontoLocations = [
    { lat: 43.6532, lng: -79.3832, name: 'Downtown' },
    { lat: 43.6677, lng: -79.3948, name: 'Yorkville' },
    { lat: 43.6426, lng: -79.4002, name: 'Queen West' },
    { lat: 43.6547, lng: -79.3623, name: 'Distillery' },
    { lat: 43.6789, lng: -79.4103, name: 'Midtown' },
    { lat: 43.6384, lng: -79.4243, name: 'Parkdale' },
  ];

  useEffect(() => {
    loadRouteData();
  }, [user, selectedDate]);

  const loadRouteData = async () => {
    setLoading(true);
    try {
      const orders = await db.getOrdersWithDetails();
      
      // Get pickup tasks
      const pickupOrders = orders.filter(o => 
        o.status === 'pending_pickup' && 
        o.pickup_date === selectedDate
      ).map((o, idx) => {
        const loc = torontoLocations[idx % torontoLocations.length];
        return {
          ...o,
          taskType: 'pickup',
          address: formatAddress(o.pickup_address),
          timeSlot: o.pickup_time_slot,
          sequence: getTimeSequence(o.pickup_time_slot),
          lat: loc.lat + (Math.random() - 0.5) * 0.02,
          lng: loc.lng + (Math.random() - 0.5) * 0.02,
        };
      });
      
      // Get delivery tasks
      const deliveryOrders = orders.filter(o => 
        ['ready', 'out_for_delivery'].includes(o.status) &&
        o.delivery_date === selectedDate
      ).map((o, idx) => {
        const loc = torontoLocations[(idx + 2) % torontoLocations.length];
        return {
          ...o,
          taskType: 'delivery',
          address: formatAddress(o.delivery_address),
          timeSlot: o.delivery_time_slot,
          sequence: getTimeSequence(o.delivery_time_slot),
          lat: loc.lat + (Math.random() - 0.5) * 0.02,
          lng: loc.lng + (Math.random() - 0.5) * 0.02,
        };
      });

      // Combine and sort
      const allStops = [...pickupOrders, ...deliveryOrders]
        .sort((a, b) => a.sequence - b.sequence);
      
      setStops(allStops);
    } catch (err) {
      console.error('Failed to load route:', err);
      toast.error('Failed to load route data');
    } finally {
      setLoading(false);
    }
  };

  const getTimeSequence = (timeSlot) => {
    if (!timeSlot) return 99;
    if (timeSlot.includes('7am') || timeSlot.includes('7:00')) return 1;
    if (timeSlot.includes('11am') || timeSlot.includes('11:00')) return 2;
    if (timeSlot.includes('2pm') || timeSlot.includes('14:00')) return 3;
    if (timeSlot.includes('6pm') || timeSlot.includes('18:00')) return 4;
    if (timeSlot.includes('10pm') || timeSlot.includes('22:00')) return 5;
    return 99;
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await db.update('orders', orderId, { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      });
      toast.success(`Order updated to ${newStatus.replace('_', ' ')}`);
      loadRouteData();
      setSelectedStop(null);
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  const openNavigation = (address, lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
    } else {
      toast.error('No address available');
    }
  };

  const openFullRoute = () => {
    const addresses = filteredStops.map(s => s.address).filter(Boolean);
    if (addresses.length > 0) {
      const origin = addresses[0];
      const destination = addresses[addresses.length - 1];
      const waypoints = addresses.slice(1, -1).join('|');
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}`;
      window.open(url, '_blank');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_pickup: 'bg-amber-100 text-amber-700',
      picked_up: 'bg-indigo-100 text-indigo-700',
      ready: 'bg-green-100 text-green-700',
      out_for_delivery: 'bg-cyan-100 text-cyan-700',
      delivered: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredStops = useMemo(() => {
    return stops.filter(stop => {
      if (filter === 'all') return true;
      if (filter === 'pickups') return stop.taskType === 'pickup';
      if (filter === 'deliveries') return stop.taskType === 'delivery';
      return true;
    });
  }, [stops, filter]);

  // Route polyline coordinates
  const routeCoordinates = useMemo(() => {
    return filteredStops
      .filter(s => s.lat && s.lng)
      .map(s => [s.lat, s.lng]);
  }, [filteredStops]);

  // Map center
  const mapCenter = useMemo(() => {
    if (filteredStops.length > 0 && filteredStops[0].lat) {
      return [filteredStops[0].lat, filteredStops[0].lng];
    }
    return [43.6532, -79.3832]; // Toronto default
  }, [filteredStops]);

  const stats = {
    total: stops.length,
    pickups: stops.filter(s => s.taskType === 'pickup').length,
    deliveries: stops.filter(s => s.taskType === 'delivery').length,
    completed: stops.filter(s => ['delivered', 'picked_up'].includes(s.status)).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-amani-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading route...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">My Routes</h1>
          <p className="text-gray-500">Manage your pickups and deliveries</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <button onClick={loadRouteData} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Stops</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.pickups}</p>
              <p className="text-sm text-gray-500">Pickups</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.deliveries}</p>
              <p className="text-sm text-gray-500">Deliveries</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Stops' },
            { id: 'pickups', label: 'Pickups Only' },
            { id: 'deliveries', label: 'Deliveries Only' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-amani-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-amani-100 text-amani-600' : 'bg-gray-100 text-gray-500'}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-amani-100 text-amani-600' : 'bg-gray-100 text-gray-500'}`}
          >
            <MapIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredStops.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No stops scheduled</h3>
          <p className="text-gray-400 mt-1">
            {selectedDate === format(new Date(), 'yyyy-MM-dd') 
              ? 'No pickups or deliveries scheduled for today'
              : `No stops scheduled for ${format(parseISO(selectedDate), 'MMMM d, yyyy')}`
            }
          </p>
        </div>
      ) : viewMode === 'map' ? (
        /* Map View */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="relative h-[500px]">
            <MapContainer
              center={mapCenter}
              zoom={12}
              className="h-full w-full"
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <FitBounds stops={filteredStops} />
              
              {/* Route Line */}
              {routeCoordinates.length > 1 && (
                <Polyline
                  positions={routeCoordinates}
                  color="#6366f1"
                  weight={4}
                  opacity={0.7}
                  dashArray="10, 10"
                />
              )}
              
              {/* Stop Markers */}
              {filteredStops.map((stop, idx) => (
                stop.lat && stop.lng && (
                  <Marker
                    key={stop.id}
                    position={[stop.lat, stop.lng]}
                    icon={createNumberedIcon(
                      idx + 1,
                      stop.taskType === 'pickup' ? '#f59e0b' : '#06b6d4',
                      ['delivered', 'picked_up'].includes(stop.status)
                    )}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            stop.taskType === 'pickup' ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
                          }`}>
                            {stop.taskType}
                          </span>
                          <span className="font-mono font-bold">#{stop.reference_code}</span>
                        </div>
                        <p className="font-medium text-gray-900">{stop.customer_name || 'Customer'}</p>
                        <p className="text-sm text-gray-500 mt-1">{stop.address}</p>
                        <p className="text-sm text-gray-500">{stop.timeSlot}</p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => openNavigation(stop.address, stop.lat, stop.lng)}
                            className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600"
                          >
                            Navigate
                          </button>
                          <button
                            onClick={() => setSelectedStop(stop)}
                            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>

          {/* Stops List Below Map */}
          <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
            {filteredStops.map((stop, idx) => (
              <div 
                key={stop.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                onClick={() => setSelectedStop(stop)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  stop.taskType === 'pickup' ? 'bg-amber-500' : 'bg-cyan-500'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-900 truncate">{stop.customer_name || 'Customer'}</p>
                  <p className="text-sm text-gray-500 truncate">{stop.address || 'No address'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(stop.status)}`}>
                    {stop.status?.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredStops.map((stop, idx) => (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    stop.taskType === 'pickup' ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-navy-900">#{stop.reference_code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        stop.taskType === 'pickup' ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {stop.taskType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(stop.status)}`}>
                        {stop.status?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="font-medium text-navy-900">{stop.customer_name || 'Customer'}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {stop.address || 'No address'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {stop.timeSlot || 'No time set'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {stop.customer_phone && (
                      <a
                        href={`tel:${stop.customer_phone}`}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                        title="Call"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                    <button
                      onClick={() => openNavigation(stop.address, stop.lat, stop.lng)}
                      className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                      title="Navigate"
                    >
                      <Navigation className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedStop(stop)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    
                    {stop.status === 'pending_pickup' && stop.taskType === 'pickup' && (
                      <button
                        onClick={() => handleStatusUpdate(stop.id, 'picked_up')}
                        className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200"
                      >
                        Pick Up
                      </button>
                    )}
                    {stop.status === 'ready' && stop.taskType === 'delivery' && (
                      <button
                        onClick={() => handleStatusUpdate(stop.id, 'out_for_delivery')}
                        className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg text-sm font-medium hover:bg-cyan-200"
                      >
                        Start
                      </button>
                    )}
                    {stop.status === 'out_for_delivery' && (
                      <button
                        onClick={() => handleStatusUpdate(stop.id, 'delivered')}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                      >
                        Deliver
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Route Actions */}
      {filteredStops.length > 0 && (
        <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-6 text-white">
          <h3 className="font-display font-bold text-lg mb-4">Route Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-sm">First Stop</p>
              <p className="font-medium">{filteredStops[0]?.timeSlot || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Last Stop</p>
              <p className="font-medium">{filteredStops[filteredStops.length - 1]?.timeSlot || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pickups</p>
              <p className="font-medium text-amber-400">{stats.pickups}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Deliveries</p>
              <p className="font-medium text-cyan-400">{stats.deliveries}</p>
            </div>
          </div>
          
          <button
            onClick={openFullRoute}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Open Full Route in Google Maps
          </button>
        </div>
      )}

      {/* Stop Details Modal */}
      {selectedStop && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedStop(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-display font-bold text-navy-900">
                      #{selectedStop.reference_code}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      selectedStop.taskType === 'pickup' ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      {selectedStop.taskType}
                    </span>
                  </div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedStop.status)}`}>
                    {selectedStop.status?.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedStop(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-navy-900 mb-2">Customer</h3>
                <p className="font-medium">{selectedStop.customer_name || 'N/A'}</p>
                {selectedStop.customer_phone && (
                  <a href={`tel:${selectedStop.customer_phone}`} className="text-amani-600 text-sm">
                    {selectedStop.customer_phone}
                  </a>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-navy-900 mb-2">Address</h3>
                <p className="text-gray-600">{selectedStop.address || 'No address provided'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-navy-900 mb-2">Time Slot</h3>
                <p className="text-gray-600">{selectedStop.timeSlot || 'Not specified'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-navy-900 mb-2">Order Total</h3>
                <p className="text-2xl font-bold text-amani-600">${(selectedStop.total || 0).toFixed(2)}</p>
              </div>

              {selectedStop.customer_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="font-semibold text-amber-800 mb-1">Customer Notes</h3>
                  <p className="text-sm text-amber-700">{selectedStop.customer_notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => openNavigation(selectedStop.address, selectedStop.lat, selectedStop.lng)}
                  className="flex-1 btn-secondary"
                >
                  <Navigation className="w-4 h-4" />
                  Navigate
                </button>
                {selectedStop.customer_phone && (
                  <a
                    href={`tel:${selectedStop.customer_phone}`}
                    className="flex-1 btn-secondary flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                )}
              </div>
              
              {selectedStop.status === 'pending_pickup' && selectedStop.taskType === 'pickup' && (
                <button
                  onClick={() => handleStatusUpdate(selectedStop.id, 'picked_up')}
                  className="w-full btn-primary bg-amber-500 hover:bg-amber-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Picked Up
                </button>
              )}
              {selectedStop.status === 'ready' && selectedStop.taskType === 'delivery' && (
                <button
                  onClick={() => handleStatusUpdate(selectedStop.id, 'out_for_delivery')}
                  className="w-full btn-primary bg-cyan-500 hover:bg-cyan-600"
                >
                  <Truck className="w-4 h-4" />
                  Start Delivery
                </button>
              )}
              {selectedStop.status === 'out_for_delivery' && (
                <button
                  onClick={() => handleStatusUpdate(selectedStop.id, 'delivered')}
                  className="w-full btn-primary bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Delivered
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DriverRoutes;
