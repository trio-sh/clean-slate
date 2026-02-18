import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, User, Mail, Phone, MapPin, Briefcase, 
  FileText, Upload, CheckCircle, Loader2, ArrowLeft
} from 'lucide-react';
import db from '../lib/db';
import toast from 'react-hot-toast';

const PartnerApplicationPage = () => {
  const [formData, setFormData] = useState({
    business_name: '',
    contact_person_first_name: '',
    contact_person_last_name: '',
    email: '',
    phone: '',
    business_address: '',
    business_license: '',
    hst_number: '',
    years_operating: '',
    services_offered: '',
    capacity_per_day: '',
    message: '',
    business_documents_url: ''
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
        years_operating: parseInt(formData.years_operating) || 0,
        capacity_per_day: parseInt(formData.capacity_per_day) || 0
      };

      // Submit to database
      await db.create('laundry_partner_applications', applicationData);

      // Show success message
      toast.success('Application submitted successfully! We will review it soon.');
      setIsSubmitted(true);

      // Optionally send email notification to admin
      // This would depend on your email configuration
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
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
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in partnering with Amani's Cleaners. Our team will review your application and contact you within 3-5 business days.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-amani-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amani-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
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
          <div className="relative bg-gradient-to-r from-amani-500 to-maple-500 px-8 py-16 text-white overflow-hidden">
            <div className="absolute inset-0">
              <img
                src="https://api.a0.dev/assets/image?text=laundry business partnership, two professionals collaborating, modern commercial laundry facility, business expansion agreement&aspect=16:9&seed=901"
                alt=""
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-amani-600/70 to-maple-600/70" />
            </div>
            <div className="relative max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                Become a Laundry Partner
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join our network of trusted laundry partners. Expand your business while providing exceptional service to our customers.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder="Enter your business name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business License Number
                  </label>
                  <div className="relative">
                    <FileText className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="business_license"
                      value={formData.business_license}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder="Business license number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HST Registration Number
                  </label>
                  <div className="relative">
                    <FileText className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="hst_number"
                      value={formData.hst_number}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder="e.g. 123456789 RT0001"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Canada Revenue Agency HST/GST number (9 digits + RT)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person First Name *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="contact_person_first_name"
                      value={formData.contact_person_first_name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder="First name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person Last Name *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="contact_person_last_name"
                      value={formData.contact_person_last_name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
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
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
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
                      placeholder="(416) 123-4567"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <textarea
                      name="business_address"
                      value={formData.business_address}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent resize-none"
                      placeholder="Full business address"
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years in Business
                  </label>
                  <div className="relative">
                    <Briefcase className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="years_operating"
                      value={formData.years_operating}
                      onChange={handleChange}
                      min="0"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder="Years in business"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity Per Day (lbs)
                  </label>
                  <div className="relative">
                    <Briefcase className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="capacity_per_day"
                      value={formData.capacity_per_day}
                      onChange={handleChange}
                      min="0"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder="Daily capacity in pounds"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Services Offered
                  </label>
                  <div className="relative">
                    <Briefcase className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <textarea
                      name="services_offered"
                      value={formData.services_offered}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent resize-none"
                      placeholder="Describe the laundry services you offer"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Documents
                  </label>
                  <div className="relative">
                    <Upload className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="url"
                      name="business_documents_url"
                      value={formData.business_documents_url}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent"
                      placeholder="Link to business documents (Google Drive, Dropbox, etc.)"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Please upload business registration, insurance, and other relevant documents
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amani-500 focus:border-transparent resize-none"
                    placeholder="Tell us more about your business and why you'd like to partner with us"
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
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
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

export default PartnerApplicationPage;