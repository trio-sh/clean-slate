import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone, Download, Share2, Copy, Check, QrCode,
  Apple, Chrome, Monitor, Wifi, Bell, Shield, Zap
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { generateQRCode } from '../../lib/utils';

const GetAppPage = () => {
  const { t } = useLanguage();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState('unknown');
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPlayStoreHelp, setShowPlayStoreHelp] = useState(false);

  const appUrl = window.location.origin + '/get-app';
  const shareUrl = window.location.origin;

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isMac = /Macintosh/.test(ua) && !isIOS;
    const isWindows = /Windows/.test(ua);

    // Auto-show Play Store help on Android
    if (isAndroid) {
      setShowPlayStoreHelp(true);
    }

    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else if (isMac) setPlatform('mac');
    else if (isWindows) setPlatform('windows');
    else setPlatform('desktop');

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    setIsInstalled(!!isStandalone);

    // Generate QR code
    generateQRCode(shareUrl, 280).then(setQrCodeUrl);

    // Listen for install prompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [shareUrl]);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Amani's Cleaners",
          text: "Get the Amani's Cleaners app for easy laundry pickup & delivery!",
          url: shareUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'amanis-cleaners-app-qr.png';
    link.click();
  };

  const features = [
    { icon: Zap, title: 'Instant Ordering', desc: 'Place orders in seconds' },
    { icon: Bell, title: 'Push Notifications', desc: 'Real-time order updates' },
    { icon: Wifi, title: 'Works Offline', desc: 'Browse even without internet' },
    { icon: Shield, title: 'Secure & Private', desc: 'Your data stays safe' },
  ];

  const iosSteps = [
    { step: 1, text: 'Open this page in Safari' },
    { step: 2, text: 'Tap the Share button at the bottom' },
    { step: 3, text: 'Scroll down and tap "Add to Home Screen"' },
    { step: 4, text: 'Tap "Add" to install' },
  ];

  const androidSteps = [
    { step: 1, text: 'Open this page in Chrome' },
    { step: 2, text: 'Tap the menu (3 dots) at the top right' },
    { step: 3, text: 'Tap "Install app" or "Add to Home Screen"' },
    { step: 4, text: 'Tap "Install" to confirm' },
  ];

  const desktopSteps = [
    { step: 1, text: 'Open this page in Chrome or Edge' },
    { step: 2, text: 'Look for the install icon in the address bar' },
    { step: 3, text: 'Click "Install" to add to your desktop' },
  ];

  const getSteps = () => {
    if (platform === 'ios') return iosSteps;
    if (platform === 'android') return androidSteps;
    return desktopSteps;
  };

  const getPlatformIcon = () => {
    if (platform === 'ios') return Apple;
    if (platform === 'android') return Smartphone;
    return Monitor;
  };

  const PlatformIcon = getPlatformIcon();

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-900 via-navy-800 to-amani-900">
      {/* Hero */}
      <section className="pt-16 pb-8 md:pt-24 md:pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
              <img src="/logo.png" alt="Amani's Cleaners" className="w-14 h-14 object-contain" />
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
              Get the App
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Install Amani's Cleaners on your device for the best experience. No app store needed — install directly from your browser.
            </p>
          </motion.div>

          {/* Install Status */}
          {isInstalled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-6 py-3 rounded-full text-sm font-medium mb-8"
            >
              <Check className="w-5 h-5" />
              App is already installed on this device!
            </motion.div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: QR Code & Share */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* QR Code Card */}
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="w-5 h-5 text-amani-600" />
                <h2 className="text-lg font-semibold text-navy-900">Scan to Install</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Point your phone's camera at this QR code
              </p>
              {qrCodeUrl ? (
                <div className="inline-block p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-inner">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code to install app"
                    className="w-56 h-56 md:w-64 md:h-64"
                  />
                </div>
              ) : (
                <div className="inline-block w-64 h-64 bg-gray-100 rounded-2xl animate-pulse" />
              )}
              <p className="text-xs text-gray-400 mt-4">{shareUrl}</p>

              {/* Download QR button */}
              <button
                onClick={handleDownloadQR}
                className="mt-4 inline-flex items-center gap-2 text-sm text-amani-600 hover:text-amani-700 font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>
            </div>

            {/* Share Link Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amani-400" />
                Share Install Link
              </h3>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white/80 text-sm truncate font-mono">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-colors"
                  title="Copy link"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {navigator.share && (
                <button
                  onClick={handleShare}
                  className="w-full mt-3 bg-amani-500 hover:bg-amani-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share with Friends
                </button>
              )}
            </div>
          </motion.div>

          {/* Right: Install Instructions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Install (if browser supports it) */}
            {canInstall && !isInstalled && (
              <div className="bg-gradient-to-r from-amani-500 to-amani-600 rounded-2xl p-6 shadow-xl">
                <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Quick Install
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  Your browser supports instant installation!
                </p>
                <button
                  onClick={handleInstall}
                  className="w-full bg-white text-amani-600 py-3 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg"
                >
                  Install Now
                </button>
              </div>
            )}

            {/* Platform-specific Steps */}
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amani-100 rounded-xl flex items-center justify-center">
                  <PlatformIcon className="w-5 h-5 text-amani-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">
                    {platform === 'ios' ? 'Install on iPhone / iPad' :
                     platform === 'android' ? 'Install on Android' :
                     'Install on Desktop'}
                  </h3>
                  <p className="text-sm text-gray-500">Manual installation steps</p>
                </div>
              </div>
              <div className="space-y-4">
                {getSteps().map(({ step, text }) => (
                  <div key={step} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-amani-100 text-amani-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {step}
                    </div>
                    <p className="text-gray-700 pt-1">{text}</p>
                  </div>
                ))}
              </div>

              {/* Show other platform tabs */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-3">Instructions for other devices:</p>
                <div className="flex gap-2">
                  {platform !== 'ios' && (
                    <button onClick={() => setPlatform('ios')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <Apple className="w-3 h-3" /> iPhone / iPad
                    </button>
                  )}
                  {platform !== 'android' && (
                    <button onClick={() => setPlatform('android')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> Android
                    </button>
                  )}
                  {!['windows', 'mac', 'desktop'].includes(platform) && (
                    <button onClick={() => setPlatform('desktop')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <Monitor className="w-3 h-3" /> Desktop
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Play Store Protect Warning Help */}
            {platform === 'android' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900">
                      Play Store Protect Warning?
                    </h3>
                    <p className="text-sm text-gray-500">
                      Here's how to resolve it
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-700">
                    If you see a warning from Play Store Protect during installation, don't worry! 
                    This is a standard security message for apps not from the Play Store. Our app is safe.
                  </p>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-orange-900 mb-3">
                      To continue installation:
                    </p>
                    <ol className="space-y-2 text-sm text-orange-800">
                      <li className="flex gap-2">
                        <span className="font-bold">1.</span>
                        <span>When you see the Play Store Protect warning, tap <strong>"Install anyway"</strong></span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold">2.</span>
                        <span>If prompted, confirm by tapping <strong>"OK"</strong> or <strong>"Continue"</strong></span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold">3.</span>
                        <span>The app will then install normally</span>
                      </li>
                    </ol>
                  </div>

                  {/* Toggle to show screenshots */}
                  <button
                    onClick={() => setShowPlayStoreHelp(!showPlayStoreHelp)}
                    className="w-full text-sm text-amani-600 hover:text-amani-700 font-medium flex items-center justify-center gap-2 py-2"
                  >
                    {showPlayStoreHelp ? 'Hide' : 'Show'} Visual Guide
                    <svg
                      className={`w-4 h-4 transition-transform ${showPlayStoreHelp ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Screenshots */}
                  {showPlayStoreHelp && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <img
                          src="/install-error.jpeg"
                          alt="Play Store Protect warning screenshot"
                          className="w-full rounded-xl border-2 border-gray-200 shadow-md"
                        />
                        <p className="text-xs text-gray-500 text-center">Warning screen</p>
                      </div>
                      <div className="space-y-2">
                        <img
                          src="/fixinstallerror.jpeg"
                          alt="Install anyway button screenshot"
                          className="w-full rounded-xl border-2 border-gray-200 shadow-md"
                        />
                        <p className="text-xs text-gray-500 text-center">Click Install Anyway</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* App Features */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Why Install?</h3>
              <div className="grid grid-cols-2 gap-4">
                {features.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="w-9 h-9 bg-amani-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-amani-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{title}</p>
                      <p className="text-white/50 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GetAppPage;
