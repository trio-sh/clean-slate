import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';

import {
  Truck, Clock, Shield, Star, Sparkles, ArrowRight,
  Shirt, MapPin, Phone, CheckCircle2, Award, Users,
  Zap, Heart, Leaf, Package, Building2, MessageSquare, Receipt,
  Download, QrCode, Smartphone
} from 'lucide-react';

const HomePage = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Truck, title: t('features.freePickupDelivery.title'), desc: t('features.freePickupDelivery.desc') },
    { icon: Clock, title: t('features.sameDayService.title'), desc: t('features.sameDayService.desc') },
    { icon: Shield, title: t('features.qualityGuaranteed.title'), desc: t('features.qualityGuaranteed.desc') },
    { icon: Leaf, title: t('features.ecoFriendly.title'), desc: t('features.ecoFriendly.desc') },
  ];

  const stats = [
    { value: '11+', label: t('stats.yearsOfService') || 'Years of Service' },
    { value: '50K+', label: t('stats.happyCustomers') || 'Happy Customers' },
    { value: '4.9', label: t('stats.googleRating') || 'Google Rating' },
    { value: '40+', label: t('stats.areasServed') || 'Areas Served' },
  ];

  const services = [
    { name: t('services.washAndFold'), price: '$2.45/lb', icon: Package, color: 'bg-blue-500',
      image: 'https://api.a0.dev/assets/image?text=neatly folded fresh clean laundry, white towels and clothes stacked, professional laundry service bright background&aspect=16:9&seed=201' },
    { name: t('services.dryCleaning'), price: 'From $4.99', icon: Shirt, color: 'bg-purple-500',
      image: 'https://api.a0.dev/assets/image?text=professional dry cleaning service, elegant suits and dress shirts hanging on rack, pressed formal wear boutique&aspect=16:9&seed=202' },
    { name: t('services.weddingGowns'), price: 'From $210', icon: Heart, color: 'bg-pink-500',
      image: 'https://api.a0.dev/assets/image?text=beautiful white wedding dress bridal gown cleaning preservation service, delicate fabric care, white background&aspect=16:9&seed=203' },
    { name: t('services.commercial'), price: '$2.29/lb', icon: Users, color: 'bg-emerald-500',
      image: 'https://api.a0.dev/assets/image?text=commercial laundry service bulk cleaning, industrial washing facility large scale, clean linen stacks&aspect=16:9&seed=204' },
  ];

  const testimonials = [
    { name: 'Sarah M.', location: t('locations.toronto') || 'Toronto', text: t('testimonials.review1') || 'Best laundry service in the city! Always on time and my clothes come back perfect.', rating: 5,
      avatar: 'https://api.a0.dev/assets/image?text=happy smiling Canadian woman portrait, 30s, friendly natural look, warm smile, professional headshot&aspect=1:1&seed=301' },
    { name: 'Michael T.', location: t('locations.northYork') || 'North York', text: t('testimonials.review2') || 'The subscription plan saved me so much time. Highly recommend!', rating: 5,
      avatar: 'https://api.a0.dev/assets/image?text=happy smiling Canadian man portrait, 30s, professional friendly look, warm confident smile, headshot&aspect=1:1&seed=302' },
    { name: 'Jennifer L.', location: t('locations.vaughan') || 'Vaughan', text: t('testimonials.review3') || 'Professional service, great prices. Been using them for 3 years.', rating: 5,
      avatar: 'https://api.a0.dev/assets/image?text=happy smiling Canadian woman portrait, 40s, friendly warm look, natural smile, professional headshot&aspect=1:1&seed=303' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section - hidden on mobile for app-like feel */}
      <section className="relative min-h-[90vh] hidden md:flex items-center bg-gradient-to-br from-navy-900 via-navy-800 to-amani-900 overflow-hidden">
        {/* Hero background photo */}
        <div className="absolute inset-0">
          <img
            src="https://api.a0.dev/assets/image?text=premium laundry service, bright clean modern Canadian home, freshly washed folded clothes on bed, warm welcoming atmosphere, professional service&aspect=16:9&seed=101"
            alt=""
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Animated gradient orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-amani-500 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-40 -right-20 w-[32rem] h-[32rem] bg-maple-600 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Trust badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6"
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-2xl"
                >🍁</motion.span>
                <span className="text-white font-medium text-sm">{t('hero.proudlyCanadian')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight mb-6">
                {t('hero.titlePremium')}{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-amani-300 via-amani-400 to-maple-400 bg-clip-text text-transparent">
                    {t('hero.titleLaundry')}
                  </span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-amani-400 to-maple-400 rounded-full origin-left"
                  />
                </span>
                {' '}{t('hero.titleDryCleaning')}
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-xl leading-relaxed">
                {t('hero.descriptionLine1')}{' '}
                {t('hero.descriptionLine2')} <span className="text-amani-300 font-semibold">{t('hero.cities40Plus')}</span> {t('hero.descriptionLine3')}
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { icon: Zap, text: t('hero.sameDayAvailable') },
                  { icon: Shield, text: t('hero.satisfactionGuaranteed') },
                  { icon: Leaf, text: t('hero.ecoFriendly') },
                  { icon: Award, text: t('hero.rated') },
                ].map(({ icon: Icon, text }, i) => (
                  <motion.span
                    key={text}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm px-3 py-1.5 rounded-full"
                  >
                    <Icon className="w-3.5 h-3.5 text-amani-400" />
                    {text}
                  </motion.span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/order" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2 shadow-lg shadow-amani-500/30 hover:shadow-amani-500/50 transition-shadow">
                  <Sparkles className="w-5 h-5" />
                  {t('hero.orderNow')}
                </Link>
                <a href="tel:4372156321" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" />
                  {t('hero.callUs')}
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-amani-400 to-maple-500 border-2 border-navy-800 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{['S', 'M', 'J', 'A'][i-1]}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-sm">{t('stats.happyCustomers') || '50K+ Happy Customers'}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm ml-1">4.9/5</span>
                </div>
              </div>
            </motion.div>

            {/* Right card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute inset-0 bg-gradient-to-br from-amani-500/40 to-maple-500/40 rounded-3xl blur-2xl scale-95" />

                {/* Main Card */}
                <div className="relative bg-gradient-to-br from-amani-500 to-maple-500 rounded-3xl p-1 shadow-2xl">
                  <div className="bg-white rounded-[22px] p-8">

                    {/* Card header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-display font-bold text-navy-900">{t('hero.schedulePickup')}</h3>
                        <p className="text-gray-500 text-sm mt-0.5">{t('hero.pickupDesc') || 'We come to you — fast & free'}</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-amani-500 to-maple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Shirt className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    {/* Order steps */}
                    <div className="space-y-3 mb-6">
                      {[
                        { step: 1, label: t('hero.step1') || 'Place your order online', color: 'bg-amani-50 border-amani-200', text: 'text-amani-700', dot: 'bg-amani-500', done: true },
                        { step: 2, label: t('hero.step2') || 'We pick up from your door', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', done: true },
                        { step: 3, label: t('hero.step3') || 'Expert cleaning & care', color: 'bg-purple-50 border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500', done: false },
                        { step: 4, label: t('hero.step4') || 'Delivered fresh to you', color: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500', done: false },
                      ].map(({ step, label, color, text, dot, done }, i) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.15 }}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${color}`}
                        >
                          <div className={`w-6 h-6 rounded-full ${dot} flex items-center justify-center flex-shrink-0`}>
                            {done
                              ? <CheckCircle2 className="w-4 h-4 text-white" />
                              : <span className="text-white text-xs font-bold">{step}</span>
                            }
                          </div>
                          <span className={`${text} font-medium text-sm`}>{label}</span>
                        </motion.div>
                      ))}
                    </div>

                    <Link to="/order" className="btn-primary w-full text-center flex items-center justify-center gap-2 py-4 text-base">
                      <Sparkles className="w-4 h-4" />
                      {t('hero.getStarted')}
                    </Link>

                    <p className="text-center text-xs text-gray-400 mt-3">{t('hero.noSubscriptionRequired')}</p>
                  </div>
                </div>

                {/* Floating badge — bottom left */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900 text-sm">{t('hero.freeDelivery')}</p>
                    <p className="text-xs text-gray-500">{t('hero.minOrder')}</p>
                  </div>
                </motion.div>

                {/* Floating badge — top right */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="absolute -top-5 -right-5 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2"
                >
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900 text-sm">{t('hero.sameDay')}</p>
                    <p className="text-xs text-gray-500">{t('hero.rushAvailable')}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar - hidden on mobile for app-like feel */}
      <section className="hidden md:block bg-amani-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-display font-bold text-white">{stat.value}</p>
                <p className="text-amani-100 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - hidden on mobile for app-like feel */}
      <section className="hidden md:block py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-amani-600 font-semibold mb-4">{t('features.whyChooseUs')}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-8 text-center group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amani-500 to-maple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-navy-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-amani-600 font-semibold mb-4">{t('services.ourServices')}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-900 mb-4">
              {t('services.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('services.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to="/services"
                  className="block card overflow-hidden group hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                >
                  {/* Service image */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className={`absolute top-3 right-3 w-10 h-10 ${service.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <service.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-navy-900 mb-1">{service.name}</h3>
                    <p className="text-amani-600 font-semibold">{service.price}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services" className="btn-primary inline-flex items-center gap-2">
              {t('services.viewAll')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-amani-400 font-semibold mb-4">{t('howItWorks.title')}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              {t('howItWorks.subtitle')}
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              {t('howItWorks.description')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-amani-500 to-maple-500" />

            {[
              { step: '01', title: t('howItWorks.step1.title'), desc: t('howItWorks.step1.desc'), icon: Clock,
                image: 'https://api.a0.dev/assets/image?text=person using smartphone app to schedule laundry pickup service, mobile ordering clean UI, bright modern&aspect=1:1&seed=501' },
              { step: '02', title: t('howItWorks.step2.title'), desc: t('howItWorks.step2.desc'), icon: Sparkles,
                image: 'https://api.a0.dev/assets/image?text=friendly laundry delivery driver picking up laundry bag from customer front door, residential Toronto neighborhood&aspect=1:1&seed=502' },
              { step: '03', title: t('howItWorks.step3.title'), desc: t('howItWorks.step3.desc'), icon: Truck,
                image: 'https://api.a0.dev/assets/image?text=clean neatly folded laundry delivered in bag to customer doorstep, fresh pressed clothes delivery service&aspect=1:1&seed=503' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative text-center"
              >
                {/* Step image */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-amani-500/50 shadow-xl shadow-amani-500/20">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-9 h-9 bg-gradient-to-br from-amani-500 to-maple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-navy-900">
                    <span className="text-sm font-bold text-white">{item.step}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/order" className="btn-primary inline-flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {t('howItWorks.getStarted')}
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-amani-600 font-semibold mb-4">{t('testimonials.title')}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-900 mb-4">
              {t('testimonials.subtitle')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-8"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amani-100 shadow"
                  />
                  <div>
                    <p className="font-semibold text-navy-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Partner Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image side */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden shadow-2xl"
            >
              <img
                src="https://api.a0.dev/assets/image?text=commercial laundry facility owner, professional laundry business partnership, modern equipment, clean bright facility, successful business owner&aspect=4:3&seed=902"
                alt={t('partner.heading')}
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex gap-3">
                  {[t('partner.fastOnboarding'), t('partner.steadyRevenue'), t('partner.fullSupport')].map((tag) => (
                    <span key={tag} className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/30">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Content side */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-amani-600 font-semibold mb-4">{t('partner.title')}</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-900 mb-6">
                {t('partner.heading')}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {t('partner.description')}
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Users, title: t('partner.benefit1'), desc: t('partner.benefit1Desc') },
                  { icon: Truck, title: t('partner.benefit2'), desc: t('partner.benefit2Desc') },
                  { icon: Zap, title: t('partner.benefit3'), desc: t('partner.benefit3Desc') },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amani-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-amani-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy-900">{title}</p>
                      <p className="text-gray-500 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/partner"
                className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                <Building2 className="w-5 h-5" />
                {t('partner.applyNow')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amani-500 to-maple-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Award className="w-16 h-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/order" className="bg-white text-amani-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2 shadow-lg">
                <Sparkles className="w-5 h-5" />
                {t('cta.orderNow')}
              </Link>
              <a href="tel:437-215-6321" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                {t('cta.callUs')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-amani-600 font-semibold mb-4">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-900 mb-4">
              {t('faq.heading')}
            </h2>
          </motion.div>

          <div className="space-y-6">
            {/* FAQ Item 1: Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amani-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-6 h-6 text-amani-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-navy-900 mb-3">{t('faq.pricing.question')}</h3>
                  <div className="space-y-3 text-gray-600">
                    <p>
                      <strong className="text-navy-900">{t('faq.pricing.everyday')}</strong>
                    </p>
                    <p>
                      {t('faq.pricing.special')}
                    </p>
                    <div className="bg-amani-50 rounded-lg p-4 mt-3">
                      <p className="font-medium text-navy-900 mb-2">{t('faq.pricing.examples')}</p>
                      <ul className="grid grid-cols-2 gap-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amani-500" />
                          {t('faq.pricing.comforters')}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amani-500" />
                          {t('faq.pricing.pillows')}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amani-500" />
                          {t('faq.pricing.blankets')}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amani-500" />
                          {t('faq.pricing.mattressCovers')}
                        </li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-500 italic">
                      {t('faq.pricing.finalNote')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* FAQ Item 2: Preparation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-navy-900 mb-3">{t('faq.preparation.question')}</h3>
                  <p className="text-gray-600">
                    {t('faq.preparation.answer')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* FAQ Item 3: Sorting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shirt className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-navy-900 mb-3">{t('faq.sorting.question')}</h3>
                  <p className="text-gray-600">
                    {t('faq.sorting.answer')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* FAQ Item 4: Languages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-navy-900 mb-3">{t('faq.languages.question')}</h3>
                  <p className="text-gray-600 mb-3">{t('faq.languages.description')}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      t('faq.languages.english'),
                      t('faq.languages.french'),
                      t('faq.languages.farsi'),
                      t('faq.languages.spanish'),
                      t('faq.languages.chinese'),
                      t('faq.languages.italian')
                    ].map((lang) => (
                      <span key={lang} className="px-4 py-2 bg-amani-100 text-amani-700 rounded-full text-sm font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block text-amani-600 font-semibold mb-4">{t('serviceAreas.title')}</span>
            <h2 className="text-4xl font-display font-bold text-navy-900 mb-4">
              {t('serviceAreas.heading')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('serviceAreas.subtitle')}
            </p>
          </motion.div>

          {/* Ontario */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amani-500" />
              {t('serviceAreas.ontario')}
            </h3>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-3">{t('serviceAreas.gta')}</p>
              <div className="flex flex-wrap gap-2">
                {['Toronto', 'Mississauga', 'North York', 'Etobicoke', 'Scarborough', 'Brampton', 'Vaughan', 'Richmond Hill', 'Markham', 'Pickering', 'Ajax', 'Whitby', 'Oshawa'].map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-white rounded-full shadow-sm text-navy-700 text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amani-500" />
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-3">{t('serviceAreas.ottawa')}</p>
              <div className="flex flex-wrap gap-2">
                {['Ottawa', 'Barrhaven', 'Kanata', 'Nepean', 'Gatineau', 'Hull', 'Aylmer'].map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-white rounded-full shadow-sm text-navy-700 text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amani-500" />
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-3">{t('serviceAreas.montreal')}</p>
              <div className="flex flex-wrap gap-2">
                {['Laval', 'Longueuil', 'Brossard', 'Saint-Lambert', 'Boucherville', 'Mount Royal', 'Lachine', 'LaSalle', 'Montréal-Nord', 'Ville-Marie', 'Plateau-Mont-Royal', 'Dorval', 'Villeray', 'Saint-Michel', 'Parc-Extension'].map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-white rounded-full shadow-sm text-navy-700 text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amani-500" />
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-3">{t('serviceAreas.otherOntario')}</p>
              <div className="flex flex-wrap gap-2">
                {['Hamilton', 'Kitchener', 'Waterloo', 'London', 'Masson-Angers', 'Buckingham', 'Quebec City'].map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-white rounded-full shadow-sm text-navy-700 text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amani-500" />
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* British Columbia */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amani-500" />
              {t('serviceAreas.britishColumbia')}
            </h3>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-3">{t('serviceAreas.vancouver')}</p>
              <div className="flex flex-wrap gap-2">
                {['Vancouver', 'West End', 'Fairview', 'Mount Pleasant'].map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-white rounded-full shadow-sm text-navy-700 text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amani-500" />
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Calgary */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amani-500" />
              {t('serviceAreas.calgary')}
            </h3>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-3">{t('serviceAreas.calgaryCommunities')}</p>
              <div className="flex flex-wrap gap-2">
                {['Lake Bonavista', 'Altadore', 'Inglewood', 'Hillhurst', 'Beltline'].map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-white rounded-full shadow-sm text-navy-700 text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amani-500" />
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="mt-10 p-6 bg-amani-50 rounded-2xl text-center">
            <p className="text-navy-900 font-medium mb-2">{t('serviceAreas.usaComingSoon')}</p>
            <p className="text-gray-600 text-sm">{t('serviceAreas.usaComingSoonDesc')}</p>
          </div>
        </div>
      </section>

      {/* App Section - hidden on mobile for app-like feel */}
      <section className="app-section hidden md:block">
        <div className="app-container">
          <div className="app-glow"></div>
          
          <div className="app-content">
            <h3>{t('app.heading')}</h3>
            <p>{t('app.description')}</p>

            <div className="app-features">
              <div className="app-feature">
                <div className="app-feature-icon">📅</div>
                <p>{t('app.feature1')}</p>
              </div>
              <div className="app-feature">
                <div className="app-feature-icon">📍</div>
                <p>{t('app.feature2')}</p>
              </div>
              <div className="app-feature">
                <div className="app-feature-icon">💬</div>
                <p>{t('app.feature3')}</p>
              </div>
            </div>

            <div className="app-buttons">
              <Link to="/get-app" className="app-btn">
                <span className="app-btn-icon"><Download size={20} /></span>
                <div className="app-btn-text">
                  <span>{t('app.installNow')}</span>
                  <strong>{t('app.getTheApp')}</strong>
                </div>
              </Link>
              <Link to="/get-app" className="app-btn">
                <span className="app-btn-icon"><QrCode size={20} /></span>
                <div className="app-btn-text">
                  <span>{t('app.scanQR')}</span>
                  <strong>{t('app.qrCode')}</strong>
                </div>
              </Link>
            </div>
          </div>

          <div className="app-visual">
            <div className="app-phone">
              <div className="app-screen">
                <img src="/logo.png" alt="App" className="app-screen-logo" />
                <h4>{t('app.appName')}</h4>
                <p>{t('app.appTagline')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
