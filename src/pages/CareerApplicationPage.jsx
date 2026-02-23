import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, User, Mail, Phone, DollarSign, Calendar,
  FileText, Upload, CheckCircle, Loader2, ArrowLeft
} from 'lucide-react';
import db from '../lib/db';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

const CareerApplicationPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position_applied: '',
    cover_letter: '',
    resume_url: '',
    availability: '',
    salary_expectation: '',
    applicant_references: '',
    message: ''
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
        salary_expectation: parseFloat(formData.salary_expectation) || null
      };

      // Submit to database
      await db.create('career_applications', applicationData);

      // Show success message
      toast.success(t('careerApplication.submitSuccess'));
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(t('careerApplication.submitError'));
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
            <h2 className="text-2xl font-bold text-navy-900 mb-4">{t('careerApplication.submitted')}</h2>
            <p className="text-gray-600 mb-6">
              {t('careerApplication.thankYou')}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-amani-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amani-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('careerApplication.backToHome')}
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
              <Briefcase className="w-16 h-16 mx-auto mb-6 text-white/80" />
              <h1 className="text-4xl font-display font-bold mb-4">
                {t('careerApplication.title')}
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                {t('careerApplication.subtitle')}
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
                    {t('careerApplication.firstName')} *
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
                      placeholder={t('careerApplication.firstNamePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('careerApplication.lastName')} *
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
                      placeholder={t('careerApplication.lastNamePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('careerApplication.email')} *
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
                      placeholder={t('careerApplication.emailPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('careerApplication.phone')} *
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
                      placeholder={t('careerApplication.phonePlaceholder')}
                    />
                  </div>
                </div>
              </div>

              {/* Position and Application Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('careerApplication.position')} *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="position_applied"
                      value={formData.position_applied}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('careerApplication.positionPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('careerApplication.salary')}
                  </label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="salary_expectation"
                      value={formData.salary_expectation}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('careerApplication.salaryPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('careerApplication.availability')}
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('careerApplication.availabilityPlaceholder')}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('careerApplication.resume')} *
                  </label>
                  <div className="relative">
                    <Upload className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="url"
                      name="resume_url"
                      value={formData.resume_url}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder={t('careerApplication.resumePlaceholder')}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('careerApplication.resumeHint')}
                  </p>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('careerApplication.coverLetter')}
                  </label>
                  <textarea
                    name="cover_letter"
                    value={formData.cover_letter}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent resize-none"
                    placeholder={t('careerApplication.coverLetterPlaceholder')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('careerApplication.references')}
                  </label>
                  <textarea
                    name="applicant_references"
                    value={formData.applicant_references}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent resize-none"
                    placeholder={t('careerApplication.referencesPlaceholder')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('careerApplication.additionalInfo')}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent resize-none"
                    placeholder={t('careerApplication.additionalInfoPlaceholder')}
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
                      {t('careerApplication.submitting')}
                    </>
                  ) : (
                    t('careerApplication.submitButton')
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

export default CareerApplicationPage;