import { useState } from 'react'; // kept for future local state
import { motion } from 'framer-motion';
import {
  Car, DollarSign, Clock, MapPin, Star, CheckCircle,
  ArrowRight, Phone, Mail, Users, Award, Shield,
  Calendar, Navigation, Zap, ThumbsUp
} from 'lucide-react';
import DriverApplicationForm from '../../components/DriverApplicationForm';
import { useLanguage } from '../../i18n/LanguageContext';

const DriveWithUsPage = () => {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Clock,
      title: t('driveWithUs.benefits.flexibleHours.title'),
      description: t('driveWithUs.benefits.flexibleHours.description')
    },
    {
      icon: DollarSign,
      title: t('driveWithUs.benefits.competitivePay.title'),
      description: t('driveWithUs.benefits.competitivePay.description')
    },
    {
      icon: Calendar,
      title: t('driveWithUs.benefits.quickStart.title'),
      description: t('driveWithUs.benefits.quickStart.description')
    },
    {
      icon: Shield,
      title: t('driveWithUs.benefits.supportSystem.title'),
      description: t('driveWithUs.benefits.supportSystem.description')
    },
    {
      icon: Car,
      title: t('driveWithUs.benefits.ownSchedule.title'),
      description: t('driveWithUs.benefits.ownSchedule.description')
    },
    {
      icon: Zap,
      title: t('driveWithUs.benefits.weeklyPayments.title'),
      description: t('driveWithUs.benefits.weeklyPayments.description')
    }
  ];

  const requirements = [
    t('driveWithUs.requirements.license'),
    t('driveWithUs.requirements.vehicle'),
    t('driveWithUs.requirements.insurance'),
    t('driveWithUs.requirements.smartphone'),
    t('driveWithUs.requirements.age'),
    t('driveWithUs.requirements.lifting'),
    t('driveWithUs.requirements.availability')
  ];

  const faqs = [
    {
      question: t('driveWithUs.faqs.earnings.question'),
      answer: t('driveWithUs.faqs.earnings.answer')
    },
    {
      question: t('driveWithUs.faqs.experience.question'),
      answer: t('driveWithUs.faqs.experience.answer')
    },
    {
      question: t('driveWithUs.faqs.areas.question'),
      answer: t('driveWithUs.faqs.areas.answer')
    },
    {
      question: t('driveWithUs.faqs.payment.question'),
      answer: t('driveWithUs.faqs.payment.answer')
    },
    {
      question: t('driveWithUs.faqs.responsibilities.question'),
      answer: t('driveWithUs.faqs.responsibilities.answer')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-amani-900 text-white py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <span className="text-2xl">🚗</span>
                <span className="font-medium">{t('driveWithUs.hero.joinTeam')}</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 leading-tight">
                {t('driveWithUs.hero.title')} <span className="text-amani-400">{t('driveWithUs.hero.brandName')}</span> {t('driveWithUs.hero.titleSuffix')}
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-xl">
                {t('driveWithUs.hero.description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => document.getElementById('application-form').scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gradient-to-r from-amani-500 to-maple-500 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all inline-flex items-center justify-center gap-2"
                >
                  <Car className="w-5 h-5" />
                  {t('driveWithUs.hero.applyNow')}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a href="tel:437-215-6321" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" />
                  {t('driveWithUs.hero.callUs')}
                </a>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Lifestyle image */}
              <img
                src="https://api.a0.dev/assets/image?text=friendly smiling delivery driver standing next to car, casual clothes, Toronto residential neighborhood, sunny day, holding laundry bag, earning extra income gig work&aspect=4:3&seed=401"
                alt="Drive with Amani's Cleaners"
                className="w-full h-80 object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/30 to-transparent" />

              {/* Stats overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: '$25–35', label: t('driveWithUs.hero.stats.perRoute') },
                    { value: t('driveWithUs.hero.stats.weeklyValue'), label: t('driveWithUs.hero.stats.weeklyLabel') },
                    { value: t('driveWithUs.hero.stats.daysValue'), label: t('driveWithUs.hero.stats.daysLabel') },
                    { value: t('driveWithUs.hero.stats.flexibleValue'), label: t('driveWithUs.hero.stats.flexibleLabel') },
                  ].map(({ value, label }) => (
                    <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                      <div className="text-xl font-bold text-amani-400">{value}</div>
                      <div className="text-xs text-gray-300">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-amani-600 font-semibold mb-4">{t('driveWithUs.benefits.sectionTitle')}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-900 mb-4">
              {t('driveWithUs.benefits.heading')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('driveWithUs.benefits.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-8 text-center group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-amani-500 to-maple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-amani-600 font-semibold mb-4">{t('driveWithUs.requirements.sectionTitle')}</span>
              <h2 className="text-4xl font-display font-bold text-navy-900 mb-6">
                {t('driveWithUs.requirements.heading')}
              </h2>
              <p className="text-gray-600 mb-8">
                {t('driveWithUs.requirements.subtitle')}
              </p>
              
              <ul className="space-y-4">
                {requirements.map((req, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{req}</span>
                  </motion.li>
                ))}
              </ul>
              
              <div className="mt-8 p-4 bg-amani-50 rounded-xl">
                <p className="text-amani-700 font-medium flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5" />
                  {t('driveWithUs.requirements.noExperience')}
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 shadow-xl"
            >
              <h3 className="text-2xl font-display font-bold text-navy-900 mb-6">{t('driveWithUs.quickFacts.heading')}</h3>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{t('driveWithUs.quickFacts.earnings.value')}</p>
                    <p className="text-sm text-gray-600">{t('driveWithUs.quickFacts.earnings.label')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{t('driveWithUs.quickFacts.startTime.value')}</p>
                    <p className="text-sm text-gray-600">{t('driveWithUs.quickFacts.startTime.label')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{t('driveWithUs.quickFacts.drivers.value')}</p>
                    <p className="text-sm text-gray-600">{t('driveWithUs.quickFacts.drivers.label')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{t('driveWithUs.quickFacts.rating.value')}</p>
                    <p className="text-sm text-gray-600">{t('driveWithUs.quickFacts.rating.label')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-amani-600 font-semibold mb-4">{t('driveWithUs.faq.sectionTitle')}</span>
            <h2 className="text-4xl font-display font-bold text-navy-900 mb-4">
              {t('driveWithUs.faq.heading')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('driveWithUs.faq.subtitle')}
            </p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-6"
              >
                <h3 className="font-semibold text-lg text-navy-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-amani-600 font-semibold mb-4">{t('driveWithUs.application.sectionTitle')}</span>
            <h2 className="text-4xl font-display font-bold text-navy-900 mb-4">
              {t('driveWithUs.application.heading')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('driveWithUs.application.subtitle')}
            </p>
          </motion.div>

          <div id="application-form">
            <DriverApplicationForm />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amani-500 to-maple-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Award className="w-16 h-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              {t('driveWithUs.cta.heading')}
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {t('driveWithUs.cta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => document.getElementById('application-form').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-amani-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2 shadow-lg"
              >
                <Car className="w-5 h-5" />
                {t('driveWithUs.cta.applyNow')}
              </button>
              <a href="mailto:amaniscleaners@gmail.com" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" />
                {t('driveWithUs.cta.email')}
              </a>
            </div>

            <div className="text-white/70 text-sm">
              <p>{t('driveWithUs.cta.phoneText')}</p>
              <p className="mt-2">{t('driveWithUs.cta.processingTime')}</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default DriveWithUsPage;