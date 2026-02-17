import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, CheckCircle, AlertTriangle, 
  Loader2, X, LogIn, LogOut, Navigation
} from 'lucide-react';
import { useAuthStore } from '../stores';
import db from '../lib/db';
import { getCurrentLocation } from '../lib/utils';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CheckInModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      checkTodayStatus();
    }
  }, [isOpen, user]);

  const checkTodayStatus = async () => {
    setCheckingStatus(true);
    try {
      const checkin = await db.getTodayCheckin(user.id);
      setTodayCheckin(checkin);
    } catch (err) {
      console.error('Failed to check status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const requestLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      toast.success('Location retrieved!');
    } catch (err) {
      setLocationError(err.message);
      toast.error(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!location) {
      toast.error('Please enable location first');
      return;
    }

    setLoading(true);
    try {
      await db.checkIn(user.id, {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        accuracy: location.accuracy,
      });
      
      toast.success('Checked in successfully! 🎉');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Failed to check in: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!location) {
      toast.error('Please enable location first');
      return;
    }

    setLoading(true);
    try {
      await db.checkOut(user.id, {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        accuracy: location.accuracy,
      });
      
      toast.success('Checked out successfully! See you next time! 👋');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Failed to check out: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isCheckedIn = todayCheckin && !todayCheckin.check_out_time;
  const isCheckedOut = todayCheckin && todayCheckin.check_out_time;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amani-500 to-maple-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {isCheckedIn ? <LogOut className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {isCheckedIn ? 'Check Out' : 'Daily Check-In'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-14 h-14 bg-amani-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-amani-600">
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-navy-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Today's Status */}
            {checkingStatus ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-amani-500" />
              </div>
            ) : (
              <>
                {isCheckedOut && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Already checked out today!</p>
                      <p className="text-sm text-green-600">
                        In: {format(new Date(todayCheckin.check_in_time), 'h:mm a')} • 
                        Out: {format(new Date(todayCheckin.check_out_time), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                )}

                {isCheckedIn && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <Clock className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Currently checked in</p>
                      <p className="text-sm text-blue-600">
                        Since {format(new Date(todayCheckin.check_in_time), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Location Section */}
            {!isCheckedOut && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Your Location</label>
                
                {!location && !locationError && (
                  <button
                    onClick={requestLocation}
                    disabled={locationLoading}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-amani-400 hover:text-amani-600 transition-colors"
                  >
                    {locationLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Getting location...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-5 h-5" />
                        Enable Location
                      </>
                    )}
                  </button>
                )}

                {locationError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">{locationError}</p>
                        <button 
                          onClick={requestLocation}
                          className="text-sm text-red-600 underline mt-1"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {location && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">Location captured!</p>
                        <p className="text-sm text-green-600 mt-1">{location.address}</p>
                        <p className="text-xs text-green-500 mt-1">
                          Accuracy: ±{Math.round(location.accuracy)}m
                        </p>
                      </div>
                      <button 
                        onClick={requestLocation}
                        className="text-xs text-green-600 underline"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Time Display */}
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-navy-900">
                {format(new Date(), 'h:mm a')}
              </p>
              <p className="text-sm text-gray-500 mt-1">Current Time</p>
            </div>
          </div>

          {/* Footer */}
          {!isCheckedOut && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {isCheckedIn ? (
                <button
                  onClick={handleCheckOut}
                  disabled={loading || !location}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5" />
                      Check Out
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleCheckIn}
                  disabled={loading || !location}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amani-500 text-white rounded-xl font-semibold hover:bg-amani-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Check In Now
                    </>
                  )}
                </button>
              )}
              
              {!location && (
                <p className="text-xs text-center text-gray-500 mt-3">
                  Location is required to {isCheckedIn ? 'check out' : 'check in'}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheckInModal;
