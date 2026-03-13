import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share, Plus, ArrowDown, ChevronRight } from 'lucide-react';

const PWAInstallPrompt = ({ canInstall, isIOS, isInstalled, onInstall }) => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [iosStep, setIosStep] = useState(0); // 0=prompt, 1=step1, 2=step2, 3=step3

  useEffect(() => {
    if (isInstalled) return;
    const lastDismissed = localStorage.getItem('pwa-install-dismissed');
    if (lastDismissed) {
      const elapsed = Date.now() - parseInt(lastDismissed);
      if (elapsed < 3 * 24 * 60 * 60 * 1000) return;
    }

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
    setIosStep(0);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS) {
      setIosStep(1); // Start guided walkthrough
      return;
    }
    const accepted = await onInstall();
    if (accepted) setShow(false);
  };

  if (dismissed || isInstalled || !show) return null;

  // iOS guided walkthrough - full screen overlay
  if (isIOS && iosStep > 0) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex flex-col"
        >
          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-full backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Step 1: Tap Share button */}
          {iosStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-end h-full pb-16 px-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <img src="/logo.png" alt="" className="w-10 h-10 object-contain" />
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">Step 1 of 3</h2>
                <p className="text-white text-lg mb-1">
                  Tap the <strong>Share</strong> button below
                </p>
                <p className="text-white/60 text-sm">It's the square with an arrow pointing up</p>
              </div>

              {/* Animated arrow pointing down to Safari share button */}
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-4"
              >
                <ArrowDown className="w-10 h-10 text-amani-400" />
              </motion.div>

              {/* Mock Safari bottom bar */}
              <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                <div className="flex items-center justify-around">
                  <div className="p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <div className="p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {/* Highlighted Share button */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="p-2.5 bg-amani-500 rounded-xl shadow-lg shadow-amani-500/40 cursor-pointer"
                    onClick={() => setIosStep(2)}
                  >
                    <Share className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIosStep(2)}
                className="mt-6 text-white/60 text-sm flex items-center gap-1 hover:text-white transition-colors"
              >
                Next step <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Scroll and tap "Add to Home Screen" */}
          {iosStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full px-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-white text-2xl font-bold mb-2">Step 2 of 3</h2>
                <p className="text-white text-lg mb-1">
                  Scroll down and tap
                </p>
                <p className="text-white/60 text-sm">Find it in the share menu options</p>
              </div>

              {/* Mock share sheet option */}
              <div className="w-full max-w-sm space-y-2">
                {/* Fake options above */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 flex items-center gap-3 border border-white/10">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-2" />
                      <path d="M16 3h5v5M10 14L20.2 3.8" />
                    </svg>
                  </div>
                  <span className="text-white/40 text-sm">Copy Link</span>
                </div>

                {/* Highlighted option */}
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-xl shadow-amani-500/20 cursor-pointer border-2 border-amani-500"
                  onClick={() => setIosStep(3)}
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gray-800" />
                  </div>
                  <div>
                    <span className="text-gray-900 font-semibold text-sm">Add to Home Screen</span>
                    <p className="text-gray-400 text-xs">Install as app</p>
                  </div>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="ml-auto"
                  >
                    <ChevronRight className="w-5 h-5 text-amani-500" />
                  </motion.div>
                </motion.div>

                {/* Fake options below */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 flex items-center gap-3 border border-white/10">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <span className="text-white/40 text-sm">Add Bookmark</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setIosStep(1)}
                  className="text-white/40 text-sm hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setIosStep(3)}
                  className="text-white/60 text-sm flex items-center gap-1 hover:text-white transition-colors"
                >
                  Next step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Tap "Add" to confirm */}
          {iosStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full px-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-white text-2xl font-bold mb-2">Step 3 of 3</h2>
                <p className="text-white text-lg mb-1">
                  Tap <strong>"Add"</strong> to install
                </p>
                <p className="text-white/60 text-sm">Almost done!</p>
              </div>

              {/* Mock confirmation dialog */}
              <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <button className="text-blue-500 text-sm font-medium">Cancel</button>
                  <span className="text-gray-900 font-semibold text-sm">Add to Home Screen</span>
                  <motion.button
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    onClick={handleDismiss}
                    className="text-blue-500 text-sm font-bold bg-blue-50 px-4 py-1.5 rounded-lg"
                  >
                    Add
                  </motion.button>
                </div>
                {/* App preview */}
                <div className="p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-white border border-gray-100">
                    <img src="/logo.png" alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Amani's Cleaners</div>
                    <div className="text-gray-400 text-xs mt-0.5">amanicleaners.com</div>
                  </div>
                </div>
              </div>

              {/* Animated arrow */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="mt-4"
              >
                <svg className="w-8 h-8 text-amani-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </motion.div>

              <p className="text-white/50 text-sm mt-4 text-center">
                Tap the blue <strong className="text-white/70">"Add"</strong> button in the top right corner
              </p>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setIosStep(2)}
                  className="text-white/40 text-sm hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-amani-400 text-sm font-medium hover:text-amani-300 transition-colors"
                >
                  Done, I installed it!
                </button>
              </div>
            </motion.div>
          )}

          {/* Step dots */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setIosStep(s)}
                className={`w-2 h-2 rounded-full transition-all ${
                  iosStep === s ? 'bg-amani-400 w-6' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default banner prompt (both iOS and Android/Desktop)
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
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Smartphone className="w-4 h-4 text-amani-500 flex-shrink-0" />
                <span>Works offline, fast & always up to date</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Download className="w-4 h-4 text-amani-500 flex-shrink-0" />
                <span>No app store needed — installs in seconds</span>
              </div>
            </div>

            <button
              onClick={handleInstall}
              className="w-full mt-4 bg-gradient-to-r from-amani-500 to-amani-600 hover:from-amani-600 hover:to-amani-700 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-amani-500/25"
            >
              <Download className="w-5 h-5" />
              {isIOS ? 'Install on iPhone' : 'Install App'}
            </button>

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
