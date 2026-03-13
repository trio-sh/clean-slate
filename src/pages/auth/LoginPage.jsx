import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

import {
  Shirt, Mail, Lock, Eye, EyeOff, Sparkles,
  ArrowRight, Leaf, AlertCircle, Database, Cloud,
  Phone
} from 'lucide-react';
import { useAuthStore, useAppStore } from '../../stores';
import { useLanguage } from '../../i18n/LanguageContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { login, loginWithPhone, loginAsRole, isLoading } = useAuthStore();
  const { mode, setMode, demoEnabled } = useAppStore();
  
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [formData, setFormData] = useState({ 
    email: '', 
    phone: '',
    password: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const validateForm = () => {
    if (loginMethod === 'email') {
      if (!formData.email.trim()) {
        setError(t('validation.emailRequired'));
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError(t('validation.invalidEmail'));
        return false;
      }
    } else {
      if (!formData.phone.trim()) {
        setError(t('validation.phoneRequired'));
        return false;
      }
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 10) {
        setError(t('validation.invalidPhone'));
        return false;
      }
    }
    if (!formData.password) {
      setError(t('validation.passwordRequired'));
      return false;
    }
    return true;
  };

  const getRoleRoute = (role) => {
    const routes = {
      customer: '/',
      driver: '/driver',
      staff: '/staff',
      admin: '/admin',
      partner: '/partner-portal',
    };
    return routes[role] || '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      let result;
      if (loginMethod === 'email') {
        result = await login(formData.email, formData.password);
      } else {
        const phone = formData.phone.replace(/\D/g, '');
        result = await loginWithPhone(phone, formData.password);
      }
      toast.success(t('auth.welcomeBack'));
      navigate(getRoleRoute(result?.user?.role));
    } catch (err) {
      setError(err.message || t('auth.invalidCredentials'));
    }
  };

  const handleDemoLogin = async (role) => {
    try {
      await loginAsRole(role);
      toast.success(t('auth.demoLoginSuccess', { role }));
      navigate(getRoleRoute(role));
    } catch (err) {
      setError(err.message || t('auth.demoLoginFailed'));
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'demo' ? 'live' : 'demo';
    setMode(newMode);
    toast.success(newMode === 'demo' ? t('auth.switchedToDemoMode') : t('auth.switchedToLiveMode'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amani-500/20 to-maple-500/20" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <Link to="/" className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-2xl shadow-2xl">
                  <img src="/logo.png" alt="Amani's Cleaners" className="h-12 w-auto object-contain" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold text-white">{t('auth.brandName')}</h1>
                  <p className="text-amani-400">{t('auth.brandTagline')}</p>
                </div>
              </Link>
            </div>
            
            <h2 className="text-4xl xl:text-5xl font-display font-bold text-white mb-6 leading-tight">
              {t('auth.heroTitle1')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amani-400 to-maple-400">
                {t('auth.heroTitle2')}
              </span>
            </h2>

            <p className="text-xl text-gray-300 mb-8 max-w-md">
              {t('auth.heroDescription')}
            </p>

            <div className="flex items-center gap-6 text-gray-400">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-400" />
                <span>{t('auth.ecoFriendly')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍁</span>
                <span>{t('auth.canadianOwned')}</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-navy-900/80 to-transparent" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amani-500/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-maple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mode Toggle - Only show when demo mode is enabled by admin */}
          {demoEnabled && (
            <div className="flex justify-center mb-8">
              <button
                onClick={toggleMode}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all duration-300 ${
                  mode === 'demo'
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    : 'bg-green-500/10 border-green-500/30 text-green-400'
                }`}
              >
                {mode === 'demo' ? (
                  <>
                    <Database className="w-5 h-5" />
                    <span className="font-medium">{t('auth.demoMode')}</span>
                    <span className="text-xs opacity-70">{t('auth.localData')}</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-5 h-5" />
                    <span className="font-medium">{t('auth.liveMode')}</span>
                    <span className="text-xs opacity-70">{t('auth.supabase')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Amani's Cleaners" className="h-14 w-auto object-contain" />
            </Link>
            <Link to="/" className="text-xs text-gray-400 hover:text-amani-400 transition-colors flex items-center gap-1">
              <ArrowRight className="w-3 h-3 rotate-180" />
              {t('navigation.home')}
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <h2 className="text-2xl font-display font-bold text-white mb-2 text-center">
              {t('auth.welcome')}
            </h2>
            <p className="text-gray-400 text-center mb-6">
              {t('auth.signInDesc')}
            </p>

            {/* Login Method Tabs */}
            <div className="flex mb-6 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => { setLoginMethod('email'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                  loginMethod === 'email'
                    ? 'bg-gradient-to-r from-amani-500 to-maple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4" />
                {t('auth.email')}
              </button>
              <button
                onClick={() => { setLoginMethod('phone'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                  loginMethod === 'phone'
                    ? 'bg-gradient-to-r from-amani-500 to-maple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Phone className="w-4 h-4" />
                {t('auth.phone')}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {loginMethod === 'email' ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('auth.email')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20 transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('auth.phoneNumber')}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20 transition-all"
                        placeholder="(416) 555-0123"
                        maxLength={14}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-400">
                  <input type="checkbox" className="rounded border-gray-600 bg-white/5 text-amani-500 focus:ring-amani-500/20" />
                  {t('auth.rememberMe')}
                </label>
                <a href="#" className="text-amani-400 hover:text-amani-300">
                  {t('auth.forgotPassword')}
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amani-500 to-maple-500 text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t('auth.signingIn')}
                  </span>
                ) : (
                  <>
                    {t('auth.signIn')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Quick Login - Only show when demo mode is enabled by admin */}
            {demoEnabled && mode === 'demo' && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-center text-sm text-gray-400 mb-2">
                  {t('auth.quickDemoAccess')}
                </p>
                <p className="text-center text-xs text-gray-500 mb-4">
                  {t('auth.demoPassword')}: <code className="bg-white/10 px-2 py-0.5 rounded">demo123</code>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { role: 'customer', label: t('auth.roleCustomer') },
                    { role: 'driver', label: t('auth.roleDriver') },
                    { role: 'staff', label: t('auth.roleStaff') },
                    { role: 'admin', label: t('auth.roleAdmin') },
                    { role: 'partner', label: t('auth.rolePartner') },
                  ].map((item) => (
                    <button
                      key={item.role}
                      onClick={() => handleDemoLogin(item.role)}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-white hover:bg-white/5 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-gray-400 mt-8">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-amani-400 hover:text-amani-300 font-medium">
                {t('auth.signUp')}
              </Link>
            </p>
          </div>

          {/* Promo Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-gradient-to-r from-amani-500/20 to-maple-500/20 rounded-2xl p-4 border border-amani-500/20 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-amani-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-amani-400" />
            </div>
            <div>
              <p className="text-white font-medium">{t('auth.promoTitle')}</p>
              <p className="text-gray-400 text-sm">{t('auth.promoDescription')}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
