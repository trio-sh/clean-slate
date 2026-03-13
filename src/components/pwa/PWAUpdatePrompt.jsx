import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';

const PWAUpdatePrompt = ({ needRefresh, onUpdate, onDismiss }) => {
  const [updating, setUpdating] = useState(false);

  if (!needRefresh) return null;

  const handleUpdate = async () => {
    setUpdating(true);
    await onUpdate(true);
    // The page will reload
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-navy-900/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Animated header */}
          <div className="bg-gradient-to-br from-amani-500 via-amani-600 to-maple-500 p-8 text-center relative overflow-hidden">
            {/* Floating sparkles */}
            <div className="absolute inset-0">
              <motion.div
                animate={{ y: [-10, 10, -10], x: [5, -5, 5] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-4 left-8"
              >
                <Sparkles className="w-5 h-5 text-white/30" />
              </motion.div>
              <motion.div
                animate={{ y: [10, -10, 10], x: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-8 right-12"
              >
                <Sparkles className="w-4 h-4 text-white/20" />
              </motion.div>
              <motion.div
                animate={{ y: [-5, 15, -5] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute bottom-4 left-1/3"
              >
                <Sparkles className="w-6 h-6 text-white/25" />
              </motion.div>
            </div>

            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className={`w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center ${updating ? '' : 'hidden'}`}
            >
              <RefreshCw className="w-8 h-8 text-white" />
            </motion.div>

            {!updating && (
              <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="" className="w-10 h-10 object-contain" />
              </div>
            )}

            <h2 className="text-white font-bold text-xl relative">
              {updating ? 'Updating...' : 'Update Available'}
            </h2>
            <p className="text-white/80 text-sm mt-2 relative">
              {updating
                ? "Hang tight, we're making things better"
                : "A fresh version of Amani's is ready"}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {!updating && (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Performance improvements
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Bug fixes & stability
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amani-500" />
                    New features
                  </p>
                </div>

                <button
                  onClick={handleUpdate}
                  className="w-full bg-gradient-to-r from-amani-500 to-amani-600 hover:from-amani-600 hover:to-amani-700 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-amani-500/25"
                >
                  <RefreshCw className="w-5 h-5" />
                  Update Now
                </button>

                <button
                  onClick={onDismiss}
                  className="w-full mt-2 text-gray-500 text-sm py-2 hover:text-gray-700 transition-colors"
                >
                  Remind me later
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAUpdatePrompt;
