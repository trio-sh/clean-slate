import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shirt, Truck, Clock, Bell, MapPin, CreditCard,
  ChevronRight, ChevronLeft, X, Sparkles
} from 'lucide-react';

const slides = [
  {
    icon: Shirt,
    color: 'from-amani-500 to-amani-600',
    title: 'Premium Garment Care',
    description: 'Professional dry cleaning & laundry with eco-friendly products. Your clothes deserve the best.',
    accent: 'amani',
  },
  {
    icon: Truck,
    color: 'from-blue-500 to-indigo-600',
    title: 'Free Pickup & Delivery',
    description: 'We come to you. Schedule a pickup and we\'ll handle the rest — right to your door.',
    accent: 'blue',
  },
  {
    icon: Clock,
    color: 'from-emerald-500 to-teal-600',
    title: '48-Hour Turnaround',
    description: 'Fast, reliable service. Most orders are cleaned and returned within 48 hours.',
    accent: 'emerald',
  },
  {
    icon: MapPin,
    color: 'from-purple-500 to-violet-600',
    title: 'Real-Time Tracking',
    description: 'Track your order from pickup to delivery. Know exactly where your clothes are.',
    accent: 'purple',
  },
  {
    icon: Bell,
    color: 'from-rose-500 to-pink-600',
    title: 'Smart Notifications',
    description: 'Get notified at every step — pickup confirmed, cleaning done, out for delivery.',
    accent: 'rose',
  },
  {
    icon: CreditCard,
    color: 'from-navy-800 to-navy-900',
    title: 'Easy Payments',
    description: 'Pay securely online. Save your payment methods for even faster checkout next time.',
    accent: 'navy',
  },
];

const PWAOnboarding = () => {
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('pwa-onboarding-seen');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

    // Show onboarding on first launch in standalone mode, or first ever visit
    if (!seen && (isStandalone || !localStorage.getItem('pwa-visited'))) {
      setShow(true);
      localStorage.setItem('pwa-visited', 'true');
    }
  }, []);

  const handleComplete = () => {
    setShow(false);
    localStorage.setItem('pwa-onboarding-seen', 'true');
  };

  const handleNext = () => {
    if (current === slides.length - 1) {
      handleComplete();
    } else {
      setCurrent(current + 1);
    }
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  if (!show) return null;

  const slide = slides[current];
  const Icon = slide.icon;
  const isLast = current === slides.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-white flex flex-col"
      >
        {/* Top bar with logo + skip */}
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Amani's Cleaners" className="h-8 w-auto object-contain" />
          </div>
          <button
            onClick={handleComplete}
            className="text-gray-400 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm text-center"
            >
              {/* Icon */}
              <div className="relative mx-auto mb-8">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className={`w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-xl`}
                >
                  <Icon className="w-16 h-16 text-white" />
                </motion.div>

                {/* Decorative dots */}
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-amani-400" />
                </motion.div>
              </div>

              {/* Text */}
              <h2 className="text-2xl font-bold text-navy-900 mb-3 font-display">
                {slide.title}
              </h2>
              <p className="text-gray-500 leading-relaxed">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        <div className="p-6 pb-8 space-y-5">
          {/* Dots */}
          <div className="flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-8 bg-amani-500'
                    : 'w-2 bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {current > 0 && (
              <button
                onClick={handlePrev}
                className="px-5 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className={`flex-1 py-3.5 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg ${
                isLast
                  ? 'bg-gradient-to-r from-amani-500 to-amani-600 text-white shadow-amani-500/25'
                  : 'bg-navy-900 text-white shadow-navy-900/25'
              }`}
            >
              {isLast ? (
                <>
                  Get Started
                  <Sparkles className="w-5 h-5" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAOnboarding;
