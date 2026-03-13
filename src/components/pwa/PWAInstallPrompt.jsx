import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share, Plus, ArrowUp } from 'lucide-react';

const PWAInstallPrompt = ({ canInstall, isIOS, isInstalled, onInstall }) => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or user dismissed recently
    if (isInstalled) return;
    const lastDismissed = localStorage.getItem('pwa-install-dismissed');
    if (lastDismissed) {
      const elapsed = Date.now() - parseInt(lastDismissed);
      // Show again after 3 days
      if (elapsed < 3 * 24 * 60 * 60 * 1000) return;
    }

    // Show after 30 seconds of browsing
    const timer = setTimeout(() => {
      if (canInstall || isIOS) {
        setShow(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS) return; // iOS shows instructions instead
    const accepted = await onInstall();
    if (accepted) setShow(false);
  };

  if (dismissed || isInstalled || !show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-4 left-4 right-4 z-[60] md:left-auto md:right-6 md:bottom-6 md:w-96"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-amani-600 p-4 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <img src="/logo.png" alt="Amani's" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Get the App</h3>
                  <p className="text-white/70 text-xs">Amani's Cleaners</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 -mt-3">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {isIOS ? (
                <>
                  <p className="text-sm text-gray-700 font-medium">Install on your iPhone/iPad:</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-7 h-7 rounded-full bg-amani-100 flex items-center justify-center flex-shrink-0">
                        <Share className="w-3.5 h-3.5 text-amani-600" />
                      </div>
                      <span>Tap the <strong>Share</strong> button in Safari</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-7 h-7 rounded-full bg-amani-100 flex items-center justify-center flex-shrink-0">
                        <ArrowUp className="w-3.5 h-3.5 text-amani-600" />
                      </div>
                      <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-7 h-7 rounded-full bg-amani-100 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-3.5 h-3.5 text-amani-600" />
                      </div>
                      <span>Tap <strong>"Add"</strong> to install</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Smartphone className="w-4 h-4 text-amani-500" />
                    <span>Works offline, fast & always up to date</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Download className="w-4 h-4 text-amani-500" />
                    <span>No app store needed — installs in seconds</span>
                  </div>
                </>
              )}
            </div>

            {!isIOS && (
              <button
                onClick={handleInstall}
                className="w-full mt-4 bg-gradient-to-r from-amani-500 to-amani-600 hover:from-amani-600 hover:to-amani-700 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-amani-500/25"
              >
                <Download className="w-5 h-5" />
                Install App
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="w-full mt-2 text-gray-500 text-sm py-2 hover:text-gray-700 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
