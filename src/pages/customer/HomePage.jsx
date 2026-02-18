import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  Truck, Clock, Shield, Star, Sparkles, ArrowRight,
  Shirt, MapPin, Phone, CheckCircle2, Award, Users,
  Zap, Heart, Leaf, Package, Building2
} from 'lucide-react';

const HomePage = () => {
  const features = [
    { icon: Truck, title: 'Free Pickup & Delivery', desc: 'We come to you - anywhere in the GTA' },
    { icon: Clock, title: 'Same Day Service', desc: 'Rush orders available for an extra fee' },
    { icon: Shield, title: 'Quality Guaranteed', desc: '100% satisfaction or your money back' },
    { icon: Leaf, title: 'Eco-Friendly', desc: 'Sustainable cleaning practices' },
  ];

  const stats = [
    { value: '11+', label: 'Years of Service' },
    { value: '50K+', label: 'Happy Customers' },
    { value: '4.9', label: 'Google Rating' },
    { value: '40+', label: 'Areas Served' },
  ];

  const services = [
    { name: 'Wash & Fold', price: '$2.39/lb', icon: Package, color: 'bg-blue-500',
      image: 'https://api.a0.dev/assets/image?text=neatly folded fresh clean laundry, white towels and clothes stacked, professional laundry service bright background&aspect=16:9&seed=201' },
    { name: 'Dry Cleaning', price: 'From $6.50', icon: Shirt, color: 'bg-purple-500',
      image: 'https://api.a0.dev/assets/image?text=professional dry cleaning service, elegant suits and dress shirts hanging on rack, pressed formal wear boutique&aspect=16:9&seed=202' },
    { name: 'Wedding Gowns', price: 'From $210', icon: Heart, color: 'bg-pink-500',
      image: 'https://api.a0.dev/assets/image?text=beautiful white wedding dress bridal gown cleaning preservation service, delicate fabric care, white background&aspect=16:9&seed=203' },
    { name: 'Commercial', price: '$2.25/lb', icon: Users, color: 'bg-emerald-500',
      image: 'https://api.a0.dev/assets/image?text=commercial laundry service bulk cleaning, industrial washing facility large scale, clean linen stacks&aspect=16:9&seed=204' },
  ];

  const testimonials = [
    { name: 'Sarah M.', location: 'Toronto', text: 'Best laundry service in the city! Always on time and my clothes come back perfect.', rating: 5,
      avatar: 'https://api.a0.dev/assets/image?text=happy smiling Canadian woman portrait, 30s, friendly natural look, warm smile, professional headshot&aspect=1:1&seed=301' },
    { name: 'Michael T.', location: 'North York', text: 'The subscription plan saved me so much time. Highly recommend!', rating: 5,
      avatar: 'https://api.a0.dev/assets/image?text=happy smiling Canadian man portrait, 30s, professional friendly look, warm confident smile, headshot&aspect=1:1&seed=302' },
    { name: 'Jennifer L.', location: 'Vaughan', text: 'Professional service, great prices. Been using them for 3 years.', rating: 5,
      avatar: 'https://api.a0.dev/assets/image?text=happy smiling Canadian woman portrait, 40s, friendly warm look, natural smile, professional headshot&aspect=1:1&seed=303' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-navy-900 via-navy-800 to-amani-900 overflow-hidden">
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
                <span className="text-white font-medium text-sm">Proudly Canadian Since 2013</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight mb-6">
                Premium{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-amani-300 via-amani-400 to-maple-400 bg-clip-text text-transparent">
                    Laundry
                  </span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-amani-400 to-maple-400 rounded-full origin-left"
                  />
                </span>
                {' '}& Dry Cleaning
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-xl leading-relaxed">
                Toronto's most trusted cleaning service since 2013.
                Free pickup & delivery across <span className="text-amani-300 font-semibold">40+ cities</span> in Southern Ontario.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { icon: Zap, text: 'Same-Day Available' },
                  { icon: Shield, text: '100% Satisfaction' },
                  { icon: Leaf, text: 'Eco-Friendly' },
                  { icon: Award, text: '4.9★ Rated' },
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
                  Order Now — 15% Off
                </Link>
                <a href="tel:4372156321" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" />
                  437-215-6321
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
                  <span className="text-sm">50K+ Happy Customers</span>
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
                        <h3 className="text-2xl font-display font-bold text-navy-900">Schedule a Pickup</h3>
                        <p className="text-gray-500 text-sm mt-0.5">We come to you — fast & free</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-amani-500 to-maple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Shirt className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    {/* Order steps */}
                    <div className="space-y-3 mb-6">
                      {[
                        { step: 1, label: 'Place your order online', color: 'bg-amani-50 border-amani-200', text: 'text-amani-700', dot: 'bg-amani-500', done: true },
                        { step: 2, label: 'We pick up from your door', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', done: true },
                        { step: 3, label: 'Expert cleaning & care', color: 'bg-purple-50 border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500', done: false },
                        { step: 4, label: 'Delivered fresh to you', color: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500', done: false },
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
                      Get Started — Free Pickup
                    </Link>

                    <p className="text-center text-xs text-gray-400 mt-3">No subscription required · Cancel anytime</p>
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
                    <p className="font-semibold text-navy-900 text-sm">Free Delivery</p>
                    <p className="text-xs text-gray-500">Min. 23 lb or $64.01</p>
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
                    <p className="font-semibold text-navy-900 text-sm">Same-Day</p>
                    <p className="text-xs text-gray-500">Rush available</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-amani-500">
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

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-amani-600 font-semibold mb-4">WHY CHOOSE US</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-900 mb-4">
              The Amani Difference
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're not just another laundry service. We're your partners in looking your best.
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
            <span className="inline-block text-amani-600 font-semibold mb-4">OUR SERVICES</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-900 mb-4">
              What We Offer
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From everyday laundry to specialty items, we handle it all with care.
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
              View All Services
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
            <span className="inline-block text-amani-400 font-semibold mb-4">HOW IT WORKS</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Easy as 1, 2, 3
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Getting your laundry done has never been easier.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-amani-500 to-maple-500" />
            
            {[
              { step: '01', title: 'Schedule Pickup', desc: 'Book online or via app. Choose your preferred time slot.', icon: Clock,
                image: 'https://api.a0.dev/assets/image?text=person using smartphone app to schedule laundry pickup service, mobile ordering clean UI, bright modern&aspect=1:1&seed=501' },
              { step: '02', title: 'We Collect & Clean', desc: 'Our driver picks up. We clean with care and expertise.', icon: Sparkles,
                image: 'https://api.a0.dev/assets/image?text=friendly laundry delivery driver picking up laundry bag from customer front door, residential Toronto neighborhood&aspect=1:1&seed=502' },
              { step: '03', title: 'Fresh Delivery', desc: 'Your clean clothes delivered back to your door.', icon: Truck,
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
              Get Started Now
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
            <span className="inline-block text-amani-600 font-semibold mb-4">TESTIMONIALS</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-900 mb-4">
              What Our Customers Say
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
                alt="Become a Laundry Partner"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex gap-3">
                  {['Fast Onboarding', 'Steady Revenue', 'Full Support'].map((tag) => (
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
              <span className="inline-block text-amani-600 font-semibold mb-4">FOR BUSINESSES</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-900 mb-6">
                Become a <span className="text-amani-500">Laundry Partner</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Own a laundry or dry-cleaning facility? Partner with Amani's Cleaners to get a steady stream of orders, grow your business, and serve more customers across Southern Ontario.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Users, title: 'Access our customer base', desc: '50,000+ active customers across 40+ cities' },
                  { icon: Truck, title: 'We handle pickup & delivery', desc: 'Our drivers collect and return — you just clean' },
                  { icon: Zap, title: 'Fast onboarding', desc: 'Go live in as little as 3–5 business days' },
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
                Apply to Partner
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
              Ready to Experience Premium Care?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join 50,000+ satisfied customers. Get 15% off your first order when you sign up today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/order" className="bg-white text-amani-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2 shadow-lg">
                <Sparkles className="w-5 h-5" />
                Order Now - 15% Off
              </Link>
              <a href="tel:437-215-6321" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Call Us: 437-215-6321
              </a>
            </div>
          </motion.div>
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
            <span className="inline-block text-amani-600 font-semibold mb-4">SERVICE AREAS</span>
            <h2 className="text-4xl font-display font-bold text-navy-900 mb-4">
              Serving Southern Ontario & Beyond
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We proudly serve 40+ cities and communities across the GTA and surrounding areas with free pickup and delivery.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3">
            {['Toronto', 'North York', 'Brampton', 'Mississauga', 'Etobicoke', 'Caledon', 'Vaughan', 'King', 'Richmond Hill', 'Markham', 'Aurora', 'Stouffville', 'Scarborough', 'Oshawa', 'Whitby', 'Ajax', 'Pickering', 'Newmarket', 'East Gwillimbury', 'Georgina', 'Bradford', 'Innisfil', 'Barrie', 'Orangeville', 'Milton', 'Oakville', 'Burlington', 'Hamilton', 'Halton Hills', 'Georgetown', 'Kleinburg', 'Woodbridge', 'Thornhill', 'Maple', 'Concord', 'Nobleton', 'Claremont', 'Port Perry', 'Uxbridge', 'Bowmanville', 'Courtice', 'Newcastle'].map((area, i) => (
              <motion.span
                key={area}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-4 py-2 bg-white rounded-full shadow-sm text-navy-700 font-medium flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-amani-500" />
                {area}
              </motion.span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
