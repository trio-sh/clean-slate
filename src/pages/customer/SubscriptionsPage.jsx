import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Check, Star, Zap, Crown, GraduationCap, Sparkles, 
  ArrowRight, Calendar, Gift, Shield, Clock, Truck,
  Loader, CreditCard, Send, Bell, Package
} from 'lucide-react';
import db from '../../lib/db';
import { useAuthStore } from '../../stores';
import { sendSMS, smsTemplates, sendEmail, notificationService } from '../../lib/utils';
import toast from 'react-hot-toast';

const SubscriptionsPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    loadPlans();
    if (user) {
      loadCurrentSubscription();
    }
  }, [user]);

  const loadCurrentSubscription = async () => {
    if (!user) return;
    try {
      const userSubscriptions = await db.getByField('customer_subscriptions', 'user_id', user.id);
      if (userSubscriptions && userSubscriptions.length > 0) {
        // Get the most recent active subscription
        const sortedSubscriptions = [...userSubscriptions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const activeSub = sortedSubscriptions.find(sub => ['active', 'pending_payment'].includes(sub.status));
        const latestSub = activeSub || sortedSubscriptions[0]; // fallback to most recent if no active
        
        if (latestSub) {
          const plan = await db.getById('subscription_plans', latestSub.plan_id);
          setCurrentSubscription({
            ...latestSub,
            plan_details: plan
          });
        }
      }
    } catch (error) {
      console.error('Failed to load current subscription:', error);
    }
  };

  const loadPlans = async () => {
    try {
      const allPlans = await db.getAll('subscription_plans');
      setPlans(allPlans.filter(p => p.is_active));
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const calculateEndDate = (validityDays) => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + validityDays);
    return endDate.toISOString().split('T')[0];
  };

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe');
      navigate('/login');
      return;
    }

    setSelectedPlan(plan);
    setIsSubscribing(true);

    try {
      // Create subscription record
      const subscriptionData = {
        user_id: user.id,
        plan_id: plan.id,
        start_date: new Date().toISOString().split('T')[0],
        end_date: calculateEndDate(plan.validity_days),
        pounds_remaining: plan.pounds_included,
        status: 'pending_payment',
        auto_renew: false
      };

      const subscription = await db.create('customer_subscriptions', subscriptionData);

      // Generate Stripe payment link (mock for now)
      const stripePaymentLink = `https://checkout.stripe.com/pay/cs_test_${Math.random().toString(36).substr(2, 10)}`;

      // Send SMS with full subscription details + payment link
      if (user.phone) {
        try {
          const customerName = `${user.first_name} ${user.last_name}`.trim();
          const smsMessage = smsTemplates.subscriptionConfirmation(
            customerName,
            plan,
            subscriptionData.start_date,
            subscriptionData.end_date,
            stripePaymentLink
          );
          const smsResult = await sendSMS(user.phone, smsMessage);
          if (smsResult.success) {
            toast.success('Subscription details sent via SMS!');
          }
        } catch (smsError) {
          console.error('SMS failed:', smsError);
        }
      }

      // Send email with payment instructions
      if (user.email) {
        try {
          const emailResult = await sendEmail({
            to_email: user.email,
            subject: `Amani's Cleaners - Subscription Payment for ${plan.name}`,
            template: 'subscription_payment',
            data: {
              customer_name: `${user.first_name} ${user.last_name}`,
              plan_name: plan.name,
              amount: plan.price,
              payment_link: stripePaymentLink,
              pounds_included: plan.pounds_included,
              validity_days: plan.validity_days
            }
          });
          if (emailResult.success) {
            toast.success('Payment instructions sent to your email!');
          }
        } catch (emailError) {
          console.error('Email failed:', emailError);
        }
      }

      // Send in-app notification to customer
      try {
        await notificationService.sendToUser(user.id, {
          title: 'Subscription Created!',
          message: `Your ${plan.name} subscription has been created. Check your SMS and email for payment instructions.`,
          type: 'info',
          link: '/account/subscriptions'
        });
      } catch (notifError) {
        console.error('In-app notification failed:', notifError);
      }

      // Send SMS sent confirmation notification
      try {
        await notificationService.sendToUser(user.id, {
          title: 'SMS Sent Successfully',
          message: `We've sent a payment link to your phone number ending in ${user.phone?.slice(-4)}. Please check your messages.`,
          type: 'info'
        });
      } catch (smsNotifError) {
        console.error('SMS confirmation notification failed:', smsNotifError);
      }

      // Broadcast to admins and staff
      try {
        const broadcastNotification = {
          title: 'New Subscription Created',
          message: `Customer ${user.first_name} ${user.last_name} subscribed to ${plan.name} plan ($${plan.price}).`,
          type: 'info',
          link: '/admin/subscriptions'
        };
        
        await notificationService.broadcastToRole('admin', broadcastNotification);
        await notificationService.broadcastToRole('staff', broadcastNotification);
      } catch (broadcastError) {
        console.error('Broadcast failed:', broadcastError);
      }

      setShowConfirmation(true);
      toast.success('Subscription created successfully!');

    } catch (error) {
      console.error('Subscription failed:', error);
      toast.error('Failed to create subscription. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const planIcons = {
    student_monthly: GraduationCap,
    student_semester: GraduationCap,
    student_year: GraduationCap,
    silver: Star,
    gold: Crown,
  };

  const planColors = {
    student_monthly: 'purple',
    student_semester: 'purple',
    student_year: 'purple',
    silver: 'gray',
    gold: 'amber',
  };

  const benefits = [
    { icon: Truck, text: 'Free pickup & delivery' },
    { icon: Clock, text: 'Priority processing' },
    { icon: Gift, text: 'Exclusive member discounts' },
    { icon: Shield, text: 'Satisfaction guarantee' },
  ];

  const studentPlans = plans.filter(p => p.name.toLowerCase().includes('student'));
  const regularPlans = plans.filter(p => !p.name.toLowerCase().includes('student'));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Current Subscription Banner */}
      {currentSubscription && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-6 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Your Current Subscription</h3>
                  <p className="text-white/80 text-sm">
                    {currentSubscription.plan_details?.name || 'Active Plan'} •{' '}
                    {currentSubscription.status.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  currentSubscription.status === 'active' 
                    ? 'bg-green-500 text-white'
                    : currentSubscription.status === 'pending_payment'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {currentSubscription.status.replace('_', ' ').toUpperCase()}
                </span>
                <div className="text-right">
                  <p className="text-sm font-medium">${currentSubscription.plan_details?.price || 0}/mo</p>
                  <p className="text-xs text-white/80">
                    Ends: {new Date(currentSubscription.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://api.a0.dev/assets/image?text=happy customer receiving freshly cleaned laundry subscription delivery at door, premium lifestyle, clean bright home, Canadian suburb&aspect=16:9&seed=701"
            alt=""
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900/80 via-navy-800/80 to-navy-900/80" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-amani-500/20 text-amani-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Save up to 30% with subscriptions
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Laundry Plans That<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amani-400 to-maple-400">
                Fit Your Life
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join thousands of Canadians who save time and money with our subscription plans. 
              Cancel anytime, no commitments.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-8">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.text} className="flex items-center gap-2 text-gray-600">
                  <Icon className="w-5 h-5 text-amani-500" />
                  <span>{benefit.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Student Plans */}
        {studentPlans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-purple-600 mb-4">
                <GraduationCap className="w-6 h-6" />
                <span className="font-semibold">Student Plans</span>
              </div>
              <h2 className="text-3xl font-display font-bold text-navy-900 mb-3">
                Special Rates for Students
              </h2>
              <p className="text-gray-600">Valid student ID required at first pickup</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {studentPlans.map((plan, index) => {
                const Icon = planIcons[plan.slug] || Star;
                const color = planColors[plan.slug] || 'purple';
                const isPopular = plan.name.includes('2 Semester');
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative bg-white rounded-2xl shadow-sm border-2 p-6 ${
                      isPopular ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-100'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                    </div>
                    
                    <h3 className="text-xl font-display font-bold text-navy-900 mb-2">
                      {plan.name}
                    </h3>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-navy-900">${plan.price}</span>
                      {plan.duration_months && (
                        <span className="text-gray-500 ml-1">
                          / {plan.duration_months === 1 ? 'month' : `${plan.duration_months} months`}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                    
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>Up to {plan.monthly_weight_limit || 30}lb/month</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>Free pickup & delivery</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>48-hour turnaround</span>
                      </li>
                    </ul>
                    
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isSubscribing}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                        isPopular
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      } ${isSubscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubscribing ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Regular Plans */}
        {regularPlans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-display font-bold text-navy-900 mb-3">
                Premium Plans
              </h2>
              <p className="text-gray-600">For households and professionals</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {regularPlans.map((plan, index) => {
                const isGold = plan.name.toLowerCase().includes('gold');
                const Icon = isGold ? Crown : Star;
                const color = isGold ? 'amber' : 'gray';
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`relative bg-white rounded-2xl shadow-sm border-2 p-8 ${
                      isGold ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-gray-100'
                    }`}
                  >
                    {isGold && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Best Value
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className={`w-14 h-14 ${isGold ? 'bg-amber-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center mb-4`}>
                          <Icon className={`w-7 h-7 ${isGold ? 'text-amber-600' : 'text-gray-600'}`} />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-navy-900">
                          {plan.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-bold text-navy-900">${plan.price}</span>
                        <span className="text-gray-500 block">/month</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-3">
                        <Check className={`w-5 h-5 ${isGold ? 'text-amber-500' : 'text-green-500'} flex-shrink-0 mt-0.5`} />
                        <span>Up to {plan.monthly_weight_limit || 50}lb/month</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className={`w-5 h-5 ${isGold ? 'text-amber-500' : 'text-green-500'} flex-shrink-0 mt-0.5`} />
                        <span>Free pickup & delivery included</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className={`w-5 h-5 ${isGold ? 'text-amber-500' : 'text-green-500'} flex-shrink-0 mt-0.5`} />
                        <span>{isGold ? '24-hour express' : '48-hour'} turnaround</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className={`w-5 h-5 ${isGold ? 'text-amber-500' : 'text-green-500'} flex-shrink-0 mt-0.5`} />
                        <span>{isGold ? '20%' : '10%'} off dry cleaning</span>
                      </li>
                      {isGold && (
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>Priority customer support</span>
                        </li>
                      )}
                    </ul>
                    
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isSubscribing}
                      className={`w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                        isGold
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90'
                          : 'bg-gray-100 text-navy-900 hover:bg-gray-200'
                      } ${isSubscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubscribing ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Subscribe Now
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20"
        >
          <h2 className="text-2xl font-display font-bold text-navy-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Can I cancel my subscription anytime?',
                a: 'Yes! You can cancel your subscription at any time. Your benefits will continue until the end of your current billing period.'
              },
              {
                q: 'What happens if I exceed my monthly weight limit?',
                a: 'Additional weight beyond your plan limit is charged at our regular rate of $2.39/lb. You\'ll be notified before any extra charges.'
              },
              {
                q: 'Do student plans require verification?',
                a: 'Yes, we\'ll need to see a valid student ID at your first pickup. The ID must show current enrollment status.'
              },
              {
                q: 'Can I pause my subscription?',
                a: 'Yes, you can pause your subscription for up to 2 months per year at no cost. Just contact us 3 days before your next billing date.'
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-navy-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-amani-500 to-maple-500 rounded-3xl p-12">
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              Not Sure Which Plan?
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Try our pay-as-you-go service first! No commitment required. Experience our quality before subscribing.
            </p>
            <a
              href="/order"
              className="inline-flex items-center gap-2 bg-white text-amani-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Place an Order
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              
              <h3 className="text-2xl font-display font-bold text-navy-900 mb-2">
                Subscription Created!
              </h3>
              
              <p className="text-gray-600 mb-6">
                Your {selectedPlan.name} subscription has been created successfully.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <h4 className="font-semibold text-navy-900 mb-2">Next Steps:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <Send className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Check your SMS for the payment link</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Send className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Check your email for payment instructions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Bell className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>View subscription details in your account</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setSelectedPlan(null);
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Continue Browsing
                </button>
                <button
                  onClick={() => navigate('/account')}
                  className="flex-1 py-3 px-4 bg-amani-500 text-white rounded-xl hover:bg-amani-600 font-medium"
                >
                  View Account
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;