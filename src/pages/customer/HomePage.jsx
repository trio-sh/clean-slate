import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { 
  Truck, Clock, Shield, Star, Sparkles, ArrowRight, 
  Shirt, MapPin, Phone, CheckCircle2, Award, Users,
  Zap, Heart, Leaf, Package
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
    { value: '17+', label: 'GTA Areas Served' },
  ];

  const services = [
    { name: 'Wash & Fold', price: '$2.39/lb', icon: Package, color: 'bg-blue-500' },
    { name: 'Dry Cleaning', price: 'From $6.50', icon: Shirt, color: 'bg-purple-500' },
    { name: 'Wedding Gowns', price: 'From $210', icon: Heart, color: 'bg-pink-500' },
    { name: 'Commercial', price: '$2.25/lb', icon: Users, color: 'bg-emerald-500' },
  ];

  const testimonials = [
    { name: 'Sarah M.', location: 'Toronto', text: 'Best laundry service in the city! Always on time and my clothes come back perfect.', rating: 5 },
    { name: 'Michael T.', location: 'North York', text: 'The subscription plan saved me so much time. Highly recommend!', rating: 5 },
    { name: 'Jennifer L.', location: 'Vaughan', text: 'Professional service, great prices. Been using them for 3 years.', rating: 5 },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-navy-900 via-navy-800 to-amani-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <span className="text-2xl">🍁</span>
                <span className="text-white font-medium">Proudly Canadian Since 2013</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight mb-6">
                Premium <span className="text-amani-400">Laundry</span> & Dry Cleaning
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-xl">
                Experience the difference with Toronto's most trusted cleaning service. 
                Free pickup & delivery across the Greater Toronto Area.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/order" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Order Now - 15% Off
                </Link>
                <Link to="/pricing" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2">
                  View Pricing
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex items-center gap-6 text-white/80">
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

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main Image Card */}
                <div className="bg-gradient-to-br from-amani-500 to-maple-500 rounded-3xl p-8 shadow-2xl">
                  <div className="bg-white rounded-2xl p-8">
                    <div className="text-center mb-6">
                      <Shirt className="w-20 h-20 mx-auto text-amani-500 mb-4" />
                      <h3 className="text-2xl font-display font-bold text-navy-900">Quick Order</h3>
                      <p className="text-gray-500">Get your clothes cleaned today</p>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-green-700">Free pickup within 24 hours</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        <span className="text-blue-700">Professional cleaning</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-purple-500" />
                        <span className="text-purple-700">Free delivery back to you</span>
                      </div>
                    </div>

                    <Link to="/order" className="btn-primary w-full text-center">
                      Schedule Pickup
                    </Link>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">Free Delivery</p>
                    <p className="text-sm text-gray-500">Min. 23lb or $64.01</p>
                  </div>
                </div>
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
                  className="block card p-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-14 h-14 ${service.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy-900 mb-1">{service.name}</h3>
                  <p className="text-amani-600 font-medium">{service.price}</p>
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
              { step: '01', title: 'Schedule Pickup', desc: 'Book online or via app. Choose your preferred time slot.', icon: Clock },
              { step: '02', title: 'We Collect & Clean', desc: 'Our driver picks up. We clean with care and expertise.', icon: Sparkles },
              { step: '03', title: 'Fresh Delivery', desc: 'Your clean clothes delivered back to your door.', icon: Truck },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amani-500 to-maple-500 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                  <span className="text-2xl font-display font-bold text-white">{item.step}</span>
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
                  <div className="w-12 h-12 bg-gradient-to-br from-amani-500 to-maple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{testimonial.name[0]}</span>
                  </div>
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
