import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { 
  Check, Sparkles, ArrowRight, Info, Clock, Truck, 
  Star, Shield, Calculator, ChevronDown, ChevronUp, Zap, ShoppingCart
} from 'lucide-react';
import { useCartStore } from '../../stores';

const PricingPage = () => {
  const navigate = useNavigate();
  const { addItem, items } = useCartStore();
  const [expandedCategory, setExpandedCategory] = useState('shirts');
  const [calculator, setCalculator] = useState({ weight: 23, type: 'regular' });
  const [selectedSameDayFee, setSelectedSameDayFee] = useState(25);

  // Same Day Service addon
  const sameDayOptions = [
    { fee: 20, label: 'Standard Rush', turnaround: '8-10 hours' },
    { fee: 25, label: 'Express Rush', turnaround: '6-8 hours' },
    { fee: 35, label: 'Priority Rush', turnaround: '4-6 hours' },
  ];

  const handleAddSameDayService = (fee = 25) => {
    // Check if same day service already in cart
    const existingSameDay = items.find(item => item.id === 'same-day-service');
    if (existingSameDay) {
      toast.error('Same day service already in cart');
      navigate('/order');
      return;
    }

    const option = sameDayOptions.find(o => o.fee === fee) || sameDayOptions[1];
    
    addItem({
      id: 'same-day-service',
      name: `Same Day Service - ${option.label}`,
      service_name: `Same Day Service - ${option.label}`,
      price: fee,
      quantity: 1,
      isAddon: true,
      addonType: 'same-day',
      turnaround: option.turnaround,
      notes: `SAME DAY SERVICE REQUESTED: ${option.label} (${option.turnaround} turnaround). Customer agrees to expedited processing terms.`
    });

    toast.success(`Same Day Service ($${fee}) added to cart!`);
    navigate('/order');
  };

  const laundryPricing = {
    regular: 2.39,
    commercial: 2.25,
    minimum: 23,
    flatRate: 64.01
  };

  const pricingCategories = [
    {
      id: 'shirts',
      name: 'Shirts and Blouses',
      icon: '👔',
      items: [
        { name: 'Shirts - Laundered On Hanger', price: 6.50 },
        { name: 'Shirts - Dryclean On Hanger', price: 8.50 },
        { name: 'Shirts - Dryclean Folded', price: 9.50 },
        { name: 'Shirts - Polo/Golf', price: 8.50 },
        { name: 'Blouse', price: 12.00 },
        { name: 'Blouse - Silk or Linen', price: 15.00 },
        { name: 'Blouse - Sequined or Beaded', price: 15.00 },
      ]
    },
    {
      id: 'pants',
      name: 'Pants and Shorts',
      icon: '👖',
      items: [
        { name: 'Pants - Regular Poly-Blend', price: 9.50 },
        { name: 'Pants - Cotton', price: 11.00 },
        { name: 'Pants - Linen', price: 17.00 },
        { name: 'Pants - Silk', price: 17.00 },
        { name: 'Pants - Velvet', price: 16.00 },
        { name: 'Shorts', price: 8.00 },
      ]
    },
    {
      id: 'skirts',
      name: 'Skirts',
      icon: '👗',
      items: [
        { name: 'Skirts - Regular Plain', price: 9.00 },
        { name: 'Skirts - Long Plain or Cotton', price: 14.00 },
        { name: 'Skirts - Silk', price: 19.00 },
        { name: 'Skirts - Lined or Linen', price: 19.00 },
      ]
    },
    {
      id: 'dresses',
      name: 'Dresses',
      icon: '👗',
      items: [
        { name: 'Dress - Regular', price: 18.00 },
        { name: 'Dress - Pleated/Long', price: 20.00 },
        { name: 'Dress - Cocktail/Fancy', price: 28.00 },
        { name: 'Dress - Silk', price: 32.00 },
        { name: 'Dress - Linen, Velvet, Lined', price: 35.00 },
        { name: 'Dress - Beads & Sequins', price: 35.00 },
      ]
    },
    {
      id: 'jackets',
      name: 'Jackets',
      icon: '🧥',
      items: [
        { name: 'Blazer/Suit Jacket', price: 14.00 },
        { name: 'Heavy Jacket', price: 26.00 },
        { name: 'Jean Jacket', price: 14.00 },
        { name: '3/4 Length Jacket', price: 27.00 },
        { name: 'Full Length Jacket', price: 32.00 },
        { name: 'Faux Fur Coat - starting from', price: 40.00 },
        { name: 'Leather Trim Jacket - starting from', price: 42.00 },
        { name: 'Vest', price: 12.00 },
        { name: 'Jacket with attached hood', price: 27.00 },
      ]
    },
    {
      id: 'sweaters',
      name: 'Sweaters',
      icon: '🧶',
      items: [
        { name: 'Sweater', price: 10.00 },
        { name: 'Sweater Bulky/Silk', price: 12.00 },
        { name: 'Sweater Dress', price: 17.00 },
        { name: 'Sweater Sequins or Beaded', price: 19.00 },
        { name: 'Sweater Cashmere', price: 19.00 },
      ]
    },
    {
      id: 'wedding',
      name: 'Wedding/Formal',
      icon: '👰',
      items: [
        { name: 'Wedding Gowns Preserved and Boxed - starting from', price: 210.00 },
        { name: 'Bridal Veil - starting from', price: 50.00 },
        { name: 'Prom Dress - starting from', price: 28.00 },
        { name: 'Tuxedo 2 piece', price: 27.00 },
        { name: 'Tuxedo 3 piece', price: 33.00 },
        { name: 'Formal Shirt - french cuff or ruffled', price: 11.00 },
      ]
    },
    {
      id: 'suits',
      name: 'Suits',
      icon: '🤵',
      items: [
        { name: "Men's or Women's 2 piece suit - starting from", price: 24.00 },
        { name: "Men's or Women's 3 piece suit - starting from", price: 29.00 },
        { name: 'Child 2 pc Suit - starting from', price: 15.00 },
        { name: 'Child 3 pc Suit - starting from', price: 18.00 },
      ]
    },
    {
      id: 'accessories',
      name: 'Tie/Scarf/Pocket Square',
      icon: '🧣',
      items: [
        { name: 'Tie', price: 6.00 },
        { name: 'Pocket Square', price: 6.00 },
        { name: 'Scarf - starting from', price: 7.00 },
      ]
    },
    {
      id: 'winter',
      name: 'Coats/Winter Wear',
      icon: '🧥',
      items: [
        { name: 'Ski Pants - starting from', price: 18.00 },
        { name: 'Ski Jacket - starting from', price: 21.00 },
        { name: 'Ski Suit 2 pieces - starting from', price: 30.00 },
        { name: 'Ski Suit 2 pieces - Down Filled - starting from', price: 89.00 },
        { name: '3/4 Length Car Coat - starting from', price: 35.00 },
        { name: 'Full Length Coat - starting from', price: 40.00 },
        { name: 'Raincoat, Spring Jacket, Windbreaker - from', price: 26.00 },
        { name: 'Winter Jacket Men or Women - starting from', price: 26.00 },
        { name: 'Down Filled Jacket - starting from', price: 50.00 },
        { name: 'Wool Coat - starting from', price: 50.00 },
        { name: 'Canada Goose Jackets - starting from', price: 60.00 },
        { name: 'Laundered - Winter Coat', price: 22.00 },
      ]
    },
    {
      id: 'bedding',
      name: 'Blankets, Comforters and Duvets',
      icon: '🛏️',
      items: [
        { name: 'Blanket - Twin or Full', price: 25.00 },
        { name: 'Blanket - Queen or King', price: 35.00 },
        { name: 'Comforter - Twin or Full', price: 35.00 },
        { name: 'Comforter - Queen or King', price: 45.00 },
        { name: 'Comforter - Down Twin or full', price: 50.00 },
        { name: 'Comforter - Down Queen or King', price: 66.00 },
        { name: 'Duvet - starting at', price: 45.00 },
        { name: 'Duvet Cover - starting at', price: 22.00 },
      ]
    },
    {
      id: 'culinary',
      name: 'Culinary Linen - Dry Cleaned',
      icon: '🍽️',
      items: [
        { name: 'Table Cloths 90" x 90"', price: 27.00 },
        { name: 'Table Cloths 120" x 72"', price: 30.00 },
        { name: 'Table Cloths 120" Round', price: 22.00 },
        { name: 'Chef Coats/Jackets', price: 16.00 },
        { name: 'Aprons', price: 9.75 },
        { name: 'Dinner Napkin', price: 5.00 },
      ]
    },
  ];

  const calculatedPrice = () => {
    const weight = calculator.weight;
    const rate = calculator.type === 'regular' ? laundryPricing.regular : laundryPricing.commercial;
    
    if (weight < laundryPricing.minimum) {
      return laundryPricing.flatRate;
    }
    return weight * rate;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-navy-900 to-amani-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-medium">Transparent Pricing</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Our Pricing
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Competitive rates for premium quality cleaning services.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Laundry Pricing Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-amani-500 to-maple-500 p-8 text-white">
              <h2 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
                <span className="text-4xl">🧺</span>
                Wash & Fold Laundry
              </h2>
              <p className="text-white/80">Our most popular service for everyday laundry</p>
            </div>
            
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Regular */}
                <div className="text-center p-6 bg-gray-50 rounded-2xl">
                  <h3 className="font-semibold text-navy-900 mb-2">Regular</h3>
                  <p className="text-4xl font-display font-bold text-amani-600">
                    $2.39<span className="text-lg font-normal text-gray-500">/lb</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">For household laundry</p>
                </div>
                
                {/* Commercial */}
                <div className="text-center p-6 bg-gray-50 rounded-2xl">
                  <h3 className="font-semibold text-navy-900 mb-2">Commercial</h3>
                  <p className="text-4xl font-display font-bold text-amani-600">
                    $2.25<span className="text-lg font-normal text-gray-500">/lb</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">For business clients</p>
                </div>
                
                {/* Minimum */}
                <div className="text-center p-6 bg-amani-50 rounded-2xl border-2 border-amani-200">
                  <h3 className="font-semibold text-navy-900 mb-2">Minimum Order</h3>
                  <p className="text-4xl font-display font-bold text-navy-900">
                    23<span className="text-lg font-normal text-gray-500">lb</span>
                  </p>
                  <p className="text-sm text-amani-600 mt-2">or $64.01 flat rate</p>
                </div>
              </div>

              {/* Calculator */}
              <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
                <h4 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Quick Price Calculator
                </h4>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Weight (lbs)</label>
                    <input
                      type="number"
                      value={calculator.weight}
                      onChange={(e) => setCalculator(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      className="input w-32"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Type</label>
                    <select
                      value={calculator.type}
                      onChange={(e) => setCalculator(prev => ({ ...prev, type: e.target.value }))}
                      className="input w-40"
                    >
                      <option value="regular">Regular</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                  <div className="bg-white px-6 py-3 rounded-xl">
                    <span className="text-sm text-gray-500">Estimated Total:</span>
                    <span className="text-2xl font-bold text-amani-600 ml-2">
                      ${calculatedPrice().toFixed(2)}
                    </span>
                    {calculator.weight < laundryPricing.minimum && (
                      <span className="text-xs text-gray-500 ml-2">(min order)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Offers Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 grid md:grid-cols-3 gap-4"
        >
          <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <Sparkles className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-green-900">15% Off First Order</h3>
            <p className="text-sm text-green-700">Sign up on our app to redeem</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <Truck className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-blue-900">$20 Off First Laundry</h3>
            <p className="text-sm text-blue-700">On orders over $50</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <Star className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-purple-900">10% Senior Discount</h3>
            <p className="text-sm text-purple-700">In-store orders only</p>
          </div>
        </motion.div>

        {/* Same Day Service */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="card p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 text-lg">Same Day Delivery Available</h3>
                <p className="text-amber-700">Need it fast? Select your rush level below</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {sameDayOptions.map((option) => (
                <button
                  key={option.fee}
                  onClick={() => handleAddSameDayService(option.fee)}
                  className={`p-4 rounded-xl border-2 transition-all text-left hover:scale-[1.02] ${
                    option.fee === 25 
                      ? 'border-amber-500 bg-amber-100 shadow-md' 
                      : 'border-amber-200 bg-white hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-amber-900 text-lg">${option.fee}</span>
                    {option.fee === 25 && (
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Popular</span>
                    )}
                  </div>
                  <div className="font-medium text-amber-800">{option.label}</div>
                  <div className="text-sm text-amber-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {option.turnaround}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-amber-700 text-sm font-medium">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Order
                  </div>
                </button>
              ))}
            </div>
            
            <p className="text-xs text-amber-600 mt-3 text-center">
              * Same day service requires order placed before 10 AM. Subject to availability.
            </p>
          </div>
        </motion.div>

        {/* Dry Cleaning Pricing */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-display font-bold text-navy-900 mb-8 text-center">
            Dry Cleaning Price List
          </h2>
          
          <div className="space-y-4">
            {pricingCategories.map((category) => (
              <div key={category.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{category.icon}</span>
                    <h3 className="text-xl font-semibold text-navy-900">{category.name}</h3>
                    <span className="text-sm text-gray-500">({category.items.length} items)</span>
                  </div>
                  {expandedCategory === category.id ? (
                    <ChevronUp className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </button>
                
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-6">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                            <span className="text-navy-700">{item.name}</span>
                            <span className="font-bold text-amani-600">${(item.price || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Price Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <div className="flex gap-4">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Important Notes</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• "Starting from" prices indicate items assessed individually based on condition and complexity</li>
                <li>• Prices are subject to change without notice</li>
                <li>• Additional charges may apply for heavily soiled items or special treatments</li>
                <li>• All prices are in Canadian Dollars (CAD)</li>
                <li>• HST not included in displayed prices</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 text-center"
        >
          <h3 className="text-2xl font-display font-bold text-navy-900 mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 mb-6">
            Experience premium cleaning service with free pickup and delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/order" className="btn-primary inline-flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Place Your Order
            </Link>
            <Link to="/subscriptions" className="btn-outline inline-flex items-center gap-2">
              View Subscription Plans
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
