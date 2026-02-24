import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car, User, Mail, Phone, IdCard, Calendar,
  FileText, Upload, CheckCircle, Loader2, ArrowLeft
} from 'lucide-react';
import db from '../lib/db';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

const DriverApplicationPage = () => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    vehicle_type: '',
    license_number: '',
    years_of_experience: '',
    availability: '',
    message: '',
    resume_url: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const applicationData = {
        ...formData,
        years_of_experience: parseInt(formData.years_of_experience) || 0
      };

      // Submit to database
      await db.create('driver_applications', applicationData);

      // Show success message
      toast.success(t('driverApplication.successMessage'));
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(t('driverApplication.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-50 to-gray-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-navy-900 mb-4">{t('driverApplication.submitted')}</h2>
            <p className="text-gray-600 mb-6">
              {t('driverApplication.thankYouMessage')}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-amani-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amani-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('driverApplication.backToHome')}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amani-500 to-maple-500 px-8 py-12 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <Car className="w-16 h-16 mx-auto mb-6 text-white/80" />
              <h1 className="text-4xl font-display font-bold mb-4">
                {t('driverApplication.title')}
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                {t('driverApplication.subtitle')}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driverApplication.firstName')} *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('driverApplication.firstNamePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driverApplication.lastName')} *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('driverApplication.lastNamePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driverApplication.emailAddress')} *
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('driverApplication.emailPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driverApplication.phoneNumber')} *
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('driverApplication.phonePlaceholder')}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <div className="relative">
                    <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent resize-none"
                      placeholder="Your full address"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle and Experience */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driverApplication.vehicleType')}
                  </label>
                  <div className="relative">
                    <Car className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('driverApplication.vehicleTypePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driverApplication.licenseNumber')}
                  </label>
                  <div className="relative">
                    <IdCard className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('driverApplication.licensePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driverApplication.yearsOfExperience')}
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                      min="0"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('driverApplication.experiencePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driverApplication.availability')}
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent appearance-none"
                    >
                      <option value="">{t('driverApplication.selectAvailability')}</option>
                      <option value="full_time">{t('driverApplication.fullTime')}</option>
                      <option value="part_time">{t('driverApplication.partTime')}</option>
                      <option value="weekends_only">{t('driverApplication.weekendsOnly')}</option>
                      <option value="evenings_only">{t('driverApplication.eveningsOnly')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driverApplication.resumeLink')}
                  </label>
                  <div className="relative">
                    <Upload className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="url"
                      name="resume_url"
                      value={formData.resume_url}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('driverApplication.resumePlaceholder')}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('driverApplication.resumeHint')}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driverApplication.whyDrive')}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent resize-none"
                    placeholder={t('driverApplication.messagePlaceholder')}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amani-500 to-maple-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('driverApplication.submitting')}
                    </>
                  ) : (
                    t('driverApplication.submitButton')
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DriverApplicationPage;