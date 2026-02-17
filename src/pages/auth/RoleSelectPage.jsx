import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { 
  Shirt, User, Truck, ClipboardList, Shield, 
  ArrowRight, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../stores';
import toast from 'react-hot-toast';

const RoleSelectPage = () => {
  const navigate = useNavigate();
  const { loginAsRole, loading } = useAuthStore();

  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      description: 'Browse services, place orders, and track your laundry',
      icon: User,
      color: 'amani',
      gradient: 'from-amani-500 to-amani-600',
      features: ['View all services', 'Place orders', 'Track deliveries', 'Manage subscriptions'],
      redirectTo: '/',
    },
    {
      id: 'driver',
      title: 'Driver',
      description: 'View routes, manage pickups and deliveries',
      icon: Truck,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      features: ['View assigned routes', 'Navigate with maps', 'Update delivery status', 'Scan order codes'],
      redirectTo: '/driver',
    },
    {
      id: 'staff',
      title: 'Staff',
      description: 'Process orders, manage in-store operations',
      icon: ClipboardList,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      features: ['Process incoming orders', 'Update item status', 'Handle walk-ins', 'Prepare for pickup'],
      redirectTo: '/staff',
    },
    {
      id: 'admin',
      title: 'Admin',
      description: 'Full control over the platform and all operations',
      icon: Shield,
      color: 'maple',
      gradient: 'from-maple-500 to-maple-600',
      features: ['Manage all users', 'View analytics', 'Configure services', 'System settings'],
      redirectTo: '/admin',
    },
  ];

  const handleSelectRole = async (role) => {
    try {
      await loginAsRole(role.id);
      toast.success(`Welcome! Logged in as ${role.title} 🧪`);
      navigate(role.redirectTo);
    } catch (err) {
      toast.error('Failed to login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-amani-500 to-maple-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Shirt className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-display font-bold text-white">Amani's</h1>
              <p className="text-sm text-amani-400">Premium Cleaners</p>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Demo Mode Active
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Choose Your Role
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Select a role to explore the platform from different perspectives. Each role has unique features and dashboards.
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => handleSelectRole(role)}
                  disabled={loading}
                  className="w-full text-left bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group disabled:opacity-50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${role.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="text-xl font-display font-bold text-white mb-2">
                    {role.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {role.description}
                  </p>
                  
                  <div className="space-y-2">
                    {role.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-gray-500">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${role.color}-500`} />
                        {feature}
                      </div>
                    ))}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-500 text-sm mt-10"
        >
          This is a demo environment. All data is stored locally in your browser.
          <br />
          <a href="/login" className="text-amani-400 hover:underline">
            Switch to Live Mode →
          </a>
        </motion.p>
      </div>
    </div>
  );
};

export default RoleSelectPage;
