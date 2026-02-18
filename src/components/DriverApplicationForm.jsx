import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import db from '../lib/db';
import toast from 'react-hot-toast';

const DriverApplicationForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    yearsExperience: '',        // numeric — years of driving experience
    experienceDetails: '',      // free text — description
    availability: '',
    message: '',
    vehicleType: '',
    insurance: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await db.create('driver_applications', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        vehicle_type: formData.vehicleType,
        has_insurance: formData.insurance,
        availability: formData.availability,
        years_of_experience: parseInt(formData.yearsExperience) || 0,
        experience_details: formData.experienceDetails,
        message: formData.message,
        status: 'pending',
      });

      toast.success('Application submitted! We\'ll be in touch within 24–48 hours.');
      setSubmitStatus('success');
    } catch (err) {
      console.error('Driver application error:', err);
      toast.error('Failed to submit. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availabilityOptions = [
    'Weekdays only',
    'Weekends only',
    'Both weekdays and weekends',
    'Flexible schedule'
  ];

  const vehicleTypes = [
    'Car',
    'SUV',
    'Van',
    'Truck',
    'Motorcycle'
  ];

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h3 className="text-2xl font-display font-bold text-navy-900 mb-2">Apply to Drive</h3>
      <p className="text-gray-600 mb-6">Fill out this form and we'll contact you within 24-48 hours</p>

      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
        >
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <p className="font-medium text-green-800">Application Submitted!</p>
            <p className="text-sm text-green-700">We've received your application and will be in touch within 24–48 hours.</p>
          </div>
        </motion.div>
      )}

      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-medium text-red-800">Submission Failed</p>
            <p className="text-sm text-red-700">Please try again or contact us directly.</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full input"
              placeholder="John"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full input"
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full input"
              placeholder="john@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full input"
              placeholder="(416) 555-0123"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full input"
              placeholder="Toronto"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Vehicle Type *
            </label>
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              required
              className="w-full input"
            >
              <option value="">Select vehicle type</option>
              {vehicleTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Availability *
          </label>
          <select
            name="availability"
            value={formData.availability}
            onChange={handleChange}
            required
            className="w-full input"
          >
            <option value="">Select your availability</option>
            {availabilityOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Years of Driving Experience
          </label>
          <input
            type="number"
            name="yearsExperience"
            value={formData.yearsExperience}
            onChange={handleChange}
            min="0"
            max="50"
            className="w-full input"
            placeholder="e.g. 3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Experience Details <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="experienceDetails"
            value={formData.experienceDetails}
            onChange={handleChange}
            rows={3}
            className="w-full input"
            placeholder="Tell us about your driving background, previous delivery work, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Additional Message
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={3}
            className="w-full input"
            placeholder="Anything else you'd like us to know?"
          />
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            name="insurance"
            checked={formData.insurance}
            onChange={handleChange}
            required
            className="mt-1 w-5 h-5 rounded border-gray-300 text-amani-500 focus:ring-amani-500"
          />
          <label className="text-sm text-gray-700">
            I confirm I have valid vehicle insurance and a clean driving record *
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>

        <p className="text-center text-xs text-gray-400">
          We'll review your application and contact you within 24–48 hours.
        </p>
      </form>
    </div>
  );
};

export default DriverApplicationForm;