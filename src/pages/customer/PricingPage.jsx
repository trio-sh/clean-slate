import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  Check, Sparkles, ArrowRight, Info, Clock, Truck,
  Star, Shield, Calculator, ChevronDown, ChevronUp, Zap, ShoppingCart
} from 'lucide-react';
import { useCartStore } from '../../stores';
import { useLanguage } from '../../i18n/LanguageContext';

const PricingPage = () => {
  const navigate = useNavigate();
  const { addItem, items } = useCartStore();
  const { t } = useLanguage();
  const [expandedCategory, setExpandedCategory] = useState('shirts');
  const [calculator, setCalculator] = useState({ weight: 23, type: 'regular' });
  const [selectedSameDayFee, setSelectedSameDayFee] = useState(25);

  // Same Day Service addon
  const sameDayOptions = [
    { fee: 20, label: t('pricing.sameDayOptions.standardRush'), turnaround: t('pricing.sameDayOptions.standardRushTime') },
    { fee: 25, label: t('pricing.sameDayOptions.expressRush'), turnaround: t('pricing.sameDayOptions.expressRushTime') },
    { fee: 35, label: t('pricing.sameDayOptions.priorityRush'), turnaround: t('pricing.sameDayOptions.priorityRushTime') },
  ];

  const handleAddSameDayService = (fee = 25) => {
    // Check if same day service already in cart
    const existingSameDay = items.find(item => item.id === 'same-day-service');
    if (existingSameDay) {
      toast.error(t('pricing.sameDayAlreadyInCart'));
      navigate('/order');
      return;
    }

    const option = sameDayOptions.find(o => o.fee === fee) || sameDayOptions[1];

    addItem({
      id: 'same-day-service',
      name: `${t('pricing.sameDayService')} - ${option.label}`,
      service_name: `${t('pricing.sameDayService')} - ${option.label}`,
      price: fee,
      quantity: 1,
      isAddon: true,
      addonType: 'same-day',
      turnaround: option.turnaround,
      notes: `${t('pricing.sameDayServiceRequested')}: ${option.label} (${option.turnaround} ${t('pricing.turnaround')}). ${t('pricing.sameDayTerms')}`
    });

    toast.success(t('pricing.sameDayAddedToCart', { fee }));
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
      name: t('pricing.categories.shirtsAndBlouses'),
      icon: '👔',
      items: [
        { name: t('pricing.items.shirtsLaunderedOnHanger'), price: 6.50 },
        { name: t('pricing.items.shirtsDrycleanOnHanger'), price: 8.50 },
        { name: t('pricing.items.shirtsDrycleanFolded'), price: 9.50 },
        { name: t('pricing.items.shirtsPoloGolf'), price: 8.50 },
        { name: t('pricing.items.blouse'), price: 12.00 },
        { name: t('pricing.items.blouseSilkLinen'), price: 15.00 },
        { name: t('pricing.items.blouseSequinedBeaded'), price: 15.00 },
      ]
    },
    {
      id: 'pants',
      name: t('pricing.categories.pantsAndShorts'),
      icon: '👖',
      items: [
        { name: t('pricing.items.pantsRegularPolyBlend'), price: 9.50 },
        { name: t('pricing.items.pantsCotton'), price: 11.00 },
        { name: t('pricing.items.pantsLinen'), price: 17.00 },
        { name: t('pricing.items.pantsSilk'), price: 17.00 },
        { name: t('pricing.items.pantsVelvet'), price: 16.00 },
        { name: t('pricing.items.shorts'), price: 8.00 },
      ]
    },
    {
      id: 'skirts',
      name: t('pricing.categories.skirts'),
      icon: '👗',
      items: [
        { name: t('pricing.items.skirtsRegularPlain'), price: 9.00 },
        { name: t('pricing.items.skirtsLongPlainCotton'), price: 14.00 },
        { name: t('pricing.items.skirtsSilk'), price: 19.00 },
        { name: t('pricing.items.skirtsLinedLinen'), price: 19.00 },
      ]
    },
    {
      id: 'dresses',
      name: t('pricing.categories.dresses'),
      icon: '👗',
      items: [
        { name: t('pricing.items.dressRegular'), price: 18.00 },
        { name: t('pricing.items.dressPleatedLong'), price: 20.00 },
        { name: t('pricing.items.dressCocktailFancy'), price: 28.00 },
        { name: t('pricing.items.dressSilk'), price: 32.00 },
        { name: t('pricing.items.dressLinenVelvetLined'), price: 35.00 },
        { name: t('pricing.items.dressBeadsSequins'), price: 35.00 },
      ]
    },
    {
      id: 'jackets',
      name: t('pricing.categories.jackets'),
      icon: '🧥',
      items: [
        { name: t('pricing.items.blazerSuitJacket'), price: 14.00 },
        { name: t('pricing.items.heavyJacket'), price: 26.00 },
        { name: t('pricing.items.jeanJacket'), price: 14.00 },
        { name: t('pricing.items.threeFourthsLengthJacket'), price: 27.00 },
        { name: t('pricing.items.fullLengthJacket'), price: 32.00 },
        { name: t('pricing.items.fauxFurCoat'), price: 40.00 },
        { name: t('pricing.items.leatherTrimJacket'), price: 42.00 },
        { name: t('pricing.items.vest'), price: 12.00 },
        { name: t('pricing.items.jacketWithHood'), price: 27.00 },
      ]
    },
    {
      id: 'sweaters',
      name: t('pricing.categories.sweaters'),
      icon: '🧶',
      items: [
        { name: t('pricing.items.sweater'), price: 10.00 },
        { name: t('pricing.items.sweaterBulkySilk'), price: 12.00 },
        { name: t('pricing.items.sweaterDress'), price: 17.00 },
        { name: t('pricing.items.sweaterSequinsBeaded'), price: 19.00 },
        { name: t('pricing.items.sweaterCashmere'), price: 19.00 },
      ]
    },
    {
      id: 'wedding',
      name: t('pricing.categories.weddingFormal'),
      icon: '👰',
      items: [
        { name: t('pricing.items.weddingGownsPreserved'), price: 210.00 },
        { name: t('pricing.items.bridalVeil'), price: 50.00 },
        { name: t('pricing.items.promDress'), price: 28.00 },
        { name: t('pricing.items.tuxedo2Piece'), price: 27.00 },
        { name: t('pricing.items.tuxedo3Piece'), price: 33.00 },
        { name: t('pricing.items.formalShirt'), price: 11.00 },
      ]
    },
    {
      id: 'suits',
      name: t('pricing.categories.suits'),
      icon: '🤵',
      items: [
        { name: t('pricing.items.suit2Piece'), price: 24.00 },
        { name: t('pricing.items.suit3Piece'), price: 29.00 },
        { name: t('pricing.items.child2PieceSuit'), price: 15.00 },
        { name: t('pricing.items.child3PieceSuit'), price: 18.00 },
      ]
    },
    {
      id: 'accessories',
      name: t('pricing.categories.accessories'),
      icon: '🧣',
      items: [
        { name: t('pricing.items.tie'), price: 6.00 },
        { name: t('pricing.items.pocketSquare'), price: 6.00 },
        { name: t('pricing.items.scarf'), price: 7.00 },
      ]
    },
    {
      id: 'winter',
      name: t('pricing.categories.coatsWinterWear'),
      icon: '🧥',
      items: [
        { name: t('pricing.items.skiPants'), price: 18.00 },
        { name: t('pricing.items.skiJacket'), price: 21.00 },
        { name: t('pricing.items.skiSuit2Pieces'), price: 30.00 },
        { name: t('pricing.items.skiSuit2PiecesDownFilled'), price: 89.00 },
        { name: t('pricing.items.threeFourthsLengthCarCoat'), price: 35.00 },
        { name: t('pricing.items.fullLengthCoat'), price: 40.00 },
        { name: t('pricing.items.raincoatSpringJacket'), price: 26.00 },
        { name: t('pricing.items.winterJacket'), price: 26.00 },
        { name: t('pricing.items.downFilledJacket'), price: 50.00 },
        { name: t('pricing.items.woolCoat'), price: 50.00 },
        { name: t('pricing.items.canadaGooseJackets'), price: 60.00 },
        { name: t('pricing.items.launderedWinterCoat'), price: 22.00 },
      ]
    },
    {
      id: 'bedding',
      name: t('pricing.categories.blanketsComfortersDuvets'),
      icon: '🛏️',
      items: [
        { name: t('pricing.items.blanketTwinFull'), price: 25.00 },
        { name: t('pricing.items.blanketQueenKing'), price: 35.00 },
        { name: t('pricing.items.comforterTwinFull'), price: 35.00 },
        { name: t('pricing.items.comforterQueenKing'), price: 45.00 },
        { name: t('pricing.items.comforterDownTwinFull'), price: 50.00 },
        { name: t('pricing.items.comforterDownQueenKing'), price: 66.00 },
        { name: t('pricing.items.duvet'), price: 45.00 },
        { name: t('pricing.items.duvetCover'), price: 22.00 },
      ]
    },
    {
      id: 'culinary',
      name: t('pricing.categories.culinaryLinen'),
      icon: '🍽️',
      items: [
        { name: t('pricing.items.tableCloths90x90'), price: 27.00 },
        { name: t('pricing.items.tableCloths120x72'), price: 30.00 },
        { name: t('pricing.items.tableCloths120Round'), price: 22.00 },
        { name: t('pricing.items.chefCoatsJackets'), price: 16.00 },
        { name: t('pricing.items.aprons'), price: 9.75 },
        { name: t('pricing.items.dinnerNapkin'), price: 5.00 },
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
              <span className="text-white font-medium">{t('pricing.transparentPricing')}</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              {t('pricing.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {t('pricing.subtitle')}
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
                {t('pricing.washFoldLaundry')}
              </h2>
              <p className="text-white/80">{t('pricing.washFoldDescription')}</p>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Regular */}
                <div className="text-center p-6 bg-gray-50 rounded-2xl">
                  <h3 className="font-semibold text-navy-900 mb-2">{t('pricing.regular')}</h3>
                  <p className="text-4xl font-display font-bold text-amani-600">
                    $2.45<span className="text-lg font-normal text-gray-500">/lb</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{t('pricing.forHouseholdLaundry')}</p>
                </div>

                {/* Commercial */}
                <div className="text-center p-6 bg-gray-50 rounded-2xl">
                  <h3 className="font-semibold text-navy-900 mb-2">{t('pricing.commercial')}</h3>
                  <p className="text-4xl font-display font-bold text-amani-600">
                    $2.29<span className="text-lg font-normal text-gray-500">/lb</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{t('pricing.forBusinessClients')}</p>
                </div>

                {/* Minimum */}
                <div className="text-center p-6 bg-amani-50 rounded-2xl border-2 border-amani-200">
                  <h3 className="font-semibold text-navy-900 mb-2">{t('pricing.minimumOrder')}</h3>
                  <p className="text-4xl font-display font-bold text-navy-900">
                    23<span className="text-lg font-normal text-gray-500">lb</span>
                  </p>
                  <p className="text-sm text-amani-600 mt-2">{t('pricing.orFlatRate')}</p>
                </div>
              </div>

              {/* Calculator */}
              <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
                <h4 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  {t('pricing.quickPriceCalculator')}
                </h4>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('pricing.weightLbs')}</label>
                    <input
                      type="number"
                      value={calculator.weight}
                      onChange={(e) => setCalculator(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      className="input w-32"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('pricing.type')}</label>
                    <select
                      value={calculator.type}
                      onChange={(e) => setCalculator(prev => ({ ...prev, type: e.target.value }))}
                      className="input w-40"
                    >
                      <option value="regular">{t('pricing.regular')}</option>
                      <option value="commercial">{t('pricing.commercial')}</option>
                    </select>
                  </div>
                  <div className="bg-white px-6 py-3 rounded-xl">
                    <span className="text-sm text-gray-500">{t('pricing.estimatedTotal')}:</span>
                    <span className="text-2xl font-bold text-amani-600 ml-2">
                      ${calculatedPrice().toFixed(2)}
                    </span>
                    {calculator.weight < laundryPricing.minimum && (
                      <span className="text-xs text-gray-500 ml-2">({t('pricing.minOrder')})</span>
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
            <h3 className="font-semibold text-green-900">{t('pricing.offers.firstOrder')}</h3>
            <p className="text-sm text-green-700">{t('pricing.offers.firstOrderDesc')}</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <Truck className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-blue-900">{t('pricing.offers.firstLaundry')}</h3>
            <p className="text-sm text-blue-700">{t('pricing.offers.firstLaundryDesc')}</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <Star className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-purple-900">{t('pricing.offers.seniorDiscount')}</h3>
            <p className="text-sm text-purple-700">{t('pricing.offers.seniorDiscountDesc')}</p>
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
                <h3 className="font-semibold text-amber-900 text-lg">{t('pricing.sameDayDeliveryAvailable')}</h3>
                <p className="text-amber-700">{t('pricing.selectYourRushLevel')}</p>
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
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">{t('pricing.popular')}</span>
                    )}
                  </div>
                  <div className="font-medium text-amber-800">{option.label}</div>
                  <div className="text-sm text-amber-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {option.turnaround}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-amber-700 text-sm font-medium">
                    <ShoppingCart className="w-4 h-4" />
                    {t('pricing.addToOrder')}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-amber-600 mt-3 text-center">
              {t('pricing.sameDayDisclaimer')}
            </p>
          </div>
        </motion.div>

        {/* Dry Cleaning Pricing */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-display font-bold text-navy-900 mb-8 text-center">
            {t('pricing.dryCleaningPriceList')}
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
                    <span className="text-sm text-gray-500">({category.items.length} {t('pricing.items_count')})</span>
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
              <h4 className="font-semibold text-blue-900 mb-2">{t('pricing.importantNotes')}</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {t('pricing.note1')}</li>
                <li>• {t('pricing.note2')}</li>
                <li>• {t('pricing.note3')}</li>
                <li>• {t('pricing.note4')}</li>
                <li>• {t('pricing.note5')}</li>
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
            {t('pricing.readyToGetStarted')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('pricing.experiencePremiumCleaning')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/order" className="btn-primary inline-flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {t('pricing.placeYourOrder')}
            </Link>
            <Link to="/subscriptions" className="btn-outline inline-flex items-center gap-2">
              {t('pricing.viewSubscriptionPlans')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
