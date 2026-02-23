import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

import {
  Shirt, Mail, Lock, Eye, EyeOff, User, Phone,
  ArrowRight, ArrowLeft, CheckCircle, AlertCircle, MapPin
} from 'lucide-react';
import { useAuthStore, useAppStore } from '../../stores';
import { useLanguage } from '../../i18n/LanguageContext';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { register, isLoading } = useAuthStore();
  const { mode } = useAppStore();
  
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Address fields
    address: '',
    unit: '',
    city: '',
    postalCode: '',
    acceptTerms: false,
    receiveUpdates: true,
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    updateField('phone', formatted);
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) return t('auth.validation.firstNameRequired');
    if (!formData.lastName.trim()) return t('auth.validation.lastNameRequired');
    if (!formData.phone.trim()) return t('auth.validation.phoneRequired');
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) return t('auth.validation.phoneInvalid');
    if (!formData.email.trim()) return t('auth.validation.emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t('validation.invalidEmail');
    return null;
  };

  const validateStep2 = () => {
    if (!formData.address.trim()) return t('auth.validation.addressRequired');
    if (!formData.city.trim()) return t('auth.validation.cityRequired');
    if (!formData.postalCode.trim()) return t('auth.validation.postalCodeRequired');
    if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(formData.postalCode.trim())) {
      return t('auth.validation.postalCodeInvalid');
    }
    return null;
  };

  const validateStep3 = () => {
    if (formData.password.length < 6) return t('auth.validation.passwordTooShort');
    if (formData.password !== formData.confirmPassword) return t('validation.passwordMismatch');
    if (!formData.acceptTerms) return t('auth.validation.termsRequired');
    return null;
  };

  const handleNext = () => {
    let validationError;
    if (step === 1) {
      validationError = validateStep1();
    } else if (step === 2) {
      validationError = validateStep2();
    }
    
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateStep3();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: phoneDigits.length === 10 ? '1' + phoneDigits : phoneDigits,
        default_address: {
          street: formData.address,
          unit: formData.unit,
          city: formData.city,
          postal_code: formData.postalCode.toUpperCase(),
          province: 'ON',
          country: 'Canada',
        }
      });
      toast.success(t('auth.accountCreated'));
      navigate('/');
    } catch (err) {
      setError(err.message || t('auth.registrationFailed'));
    }
  };

  const benefits = [
    t('auth.benefits.trackOrders'),
    t('auth.benefits.earnRewards'),
    t('auth.benefits.schedulePickups'),
    t('auth.benefits.firstOrderDiscount'),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amani-500/20 to-maple-500/20" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-amani-500 to-maple-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Shirt className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white">Amani's</h1>
                <p className="text-amani-400">{t('auth.premiumCleaners')}</p>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-display font-bold text-white mb-6 leading-tight">
              {t('auth.joinOur')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amani-400 to-maple-400">
                {t('auth.laundryFamily')}
              </span>
            </h2>

            <p className="text-xl text-gray-300 mb-10 max-w-md">
              {t('auth.registerDescription')}
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-gray-300">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-navy-900/80 to-transparent" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amani-500/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-maple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amani-500 to-maple-500 rounded-xl flex items-center justify-center">
              <Shirt className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">Amani's</h1>
              <p className="text-xs text-gray-400">{t('auth.premiumCleaners')}</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s ? 'bg-amani-500 text-white' : 'bg-white/10 text-gray-500'
                  }`}>
                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-12 h-1 rounded-full mx-1 ${step > s ? 'bg-amani-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-display font-bold text-white mb-2 text-center">
              {step === 1 && t('auth.steps.step1Title')}
              {step === 2 && t('auth.steps.step2Title')}
              {step === 3 && t('auth.steps.step3Title')}
            </h2>
            <p className="text-gray-400 text-center mb-6">
              {step === 1 && t('auth.steps.step1Desc')}
              {step === 2 && t('auth.steps.step2Desc')}
              {step === 3 && t('auth.steps.step3Desc')}
            </p>

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

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('auth.firstName')} *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => updateField('firstName', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20"
                          placeholder="John"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('auth.lastName')} *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('auth.phone')} *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20"
                        placeholder="(416) 555-0123"
                        maxLength={14}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('auth.email')} *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-amani-500 to-maple-500 text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    {t('common.continue')}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('order.streetAddress')} *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20"
                        placeholder="123 Maple Street"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('order.unit')}
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => updateField('unit', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20"
                      placeholder="Suite 100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('order.city')} *
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20"
                        placeholder="Toronto"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('order.postalCode')} *
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => updateField('postalCode', e.target.value.toUpperCase())}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20"
                        placeholder="M5V 2H1"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      {t('common.back')}
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 bg-gradient-to-r from-amani-500 to-maple-500 text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      {t('common.continue')}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('auth.password')} *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20"
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
                    <p className="text-xs text-gray-500 mt-1">{t('auth.passwordHint')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('auth.confirmPassword')} *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-amani-500/50 focus:ring-2 focus:ring-amani-500/20"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => updateField('acceptTerms', e.target.checked)}
                        className="mt-0.5 rounded border-gray-600 bg-white/5 text-amani-500 focus:ring-amani-500/20"
                      />
                      <span className="text-sm text-gray-400">
                        {t('auth.agreeToTermsStart')} <a href="#" className="text-amani-400 hover:underline">{t('auth.termsOfService')}</a> {t('auth.and')} <a href="#" className="text-amani-400 hover:underline">{t('auth.privacyPolicy')}</a> *
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.receiveUpdates}
                        onChange={(e) => updateField('receiveUpdates', e.target.checked)}
                        className="mt-0.5 rounded border-gray-600 bg-white/5 text-amani-500 focus:ring-amani-500/20"
                      />
                      <span className="text-sm text-gray-400">
                        {t('auth.receiveUpdates')}
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      {t('common.back')}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-amani-500 to-maple-500 text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t('auth.creating')}
                        </span>
                      ) : (
                        <>
                          {t('auth.createAccount')}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>

            <p className="text-center text-gray-400 mt-8">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-amani-400 hover:text-amani-300 font-medium">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
