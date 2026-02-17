import { useState, useEffect } from 'react';
import { 
  Settings, Store, Bell, Mail, CreditCard, Truck, Clock,
  Globe, Shield, Save, RefreshCw, CheckCircle, AlertTriangle,
  MapPin, Phone, DollarSign, Calendar, Users, Package,
  Database, Cloud, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useAppStore } from '../../stores';
import toast from 'react-hot-toast';


export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  
  // Get app mode settings from store
  const { demoEnabled, setDemoEnabled, loadAppModeSettings } = useAppStore();

  // System Settings (demo mode control)
  const [systemSettings, setSystemSettings] = useState({
    demo_enabled: false,
  });

  // Business Settings
  const [businessSettings, setBusinessSettings] = useState({
    business_name: "Amani's Cleaners",
    tagline: 'Professional Laundry & Dry Cleaning',
    email: 'info@amaniscleaners.ca',
    phone: '(519) 555-0123',
    address: '123 University Ave',
    city: 'Waterloo',
    province: 'ON',
    postal_code: 'N2L 3G1',
    country: 'Canada',
    timezone: 'America/Toronto',
    currency: 'CAD'
  });

  // Operating Hours
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: '07:00', close: '21:00', closed: false },
    tuesday: { open: '07:00', close: '21:00', closed: false },
    wednesday: { open: '07:00', close: '21:00', closed: false },
    thursday: { open: '07:00', close: '21:00', closed: false },
    friday: { open: '07:00', close: '21:00', closed: false },
    saturday: { open: '08:00', close: '18:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: false }
  });

  // Delivery Settings
  const [deliverySettings, setDeliverySettings] = useState({
    delivery_enabled: true,
    free_delivery_threshold: 50,
    delivery_fee: 5.99,
    delivery_radius_km: 15,
    same_day_cutoff: '14:00',
    next_day_guaranteed: true,
    pickup_available: true
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    order_confirmation: true,
    pickup_reminder: true,
    ready_for_delivery: true,
    delivery_updates: true,
    promotional_emails: false,
    weekly_summary: true
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    accept_cash: true,
    accept_card: true,
    accept_etransfer: true,
    stripe_enabled: false,
    tax_rate: 13,
    tip_enabled: true,
    default_tip_percent: 15
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load app mode settings
      await loadAppModeSettings();
      setSystemSettings({ demo_enabled: demoEnabled });
      
      // In a real app, load from database/API
      const savedSettings = localStorage.getItem('amani_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.business) setBusinessSettings(parsed.business);
        if (parsed.hours) setOperatingHours(parsed.hours);
        if (parsed.delivery) setDeliverySettings(parsed.delivery);
        if (parsed.notifications) setNotificationSettings(parsed.notifications);
        if (parsed.payments) setPaymentSettings(parsed.payments);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Update system settings when demoEnabled changes
  useEffect(() => {
    setSystemSettings({ demo_enabled: demoEnabled });
  }, [demoEnabled]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const settings = {
        business: businessSettings,
        hours: operatingHours,
        delivery: deliverySettings,
        notifications: notificationSettings,
        payments: paymentSettings,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('amani_settings', JSON.stringify(settings));
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'hours', label: 'Hours', icon: Clock },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'system', label: 'System', icon: Shield },
  ];

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your business settings</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-amani-green text-white rounded-lg hover:bg-amani-green-dark transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`flex items-center p-4 rounded-lg ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
          )}
          <span className={saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {saveMessage.text}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amani-green text-amani-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessSettings.business_name}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, business_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={businessSettings.tagline}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, tagline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={businessSettings.email}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={businessSettings.phone}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 pt-4">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={businessSettings.address}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={businessSettings.city}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province
                    </label>
                    <input
                      type="text"
                      value={businessSettings.province}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, province: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={businessSettings.postal_code}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, postal_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 pt-4">Regional Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={businessSettings.timezone}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  >
                    <option value="America/Toronto">Eastern Time (Toronto)</option>
                    <option value="America/Winnipeg">Central Time (Winnipeg)</option>
                    <option value="America/Edmonton">Mountain Time (Edmonton)</option>
                    <option value="America/Vancouver">Pacific Time (Vancouver)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={businessSettings.currency}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  >
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="USD">USD - US Dollar</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Operating Hours */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Operating Hours</h3>
              <div className="space-y-4">
                {daysOfWeek.map(day => (
                  <div key={day} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!operatingHours[day].closed}
                        onChange={(e) => setOperatingHours({
                          ...operatingHours,
                          [day]: { ...operatingHours[day], closed: !e.target.checked }
                        })}
                        className="w-4 h-4 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                      />
                      <span className="ml-3 font-medium text-gray-900 capitalize w-24">{day}</span>
                    </div>
                    {!operatingHours[day].closed ? (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Open</span>
                          <input
                            type="time"
                            value={operatingHours[day].open}
                            onChange={(e) => setOperatingHours({
                              ...operatingHours,
                              [day]: { ...operatingHours[day], open: e.target.value }
                            })}
                            className="px-3 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                          />
                        </div>
                        <span className="text-gray-400">to</span>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Close</span>
                          <input
                            type="time"
                            value={operatingHours[day].close}
                            onChange={(e) => setOperatingHours({
                              ...operatingHours,
                              [day]: { ...operatingHours[day], close: e.target.value }
                            })}
                            className="px-3 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Settings */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Delivery Options</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Enable Delivery</span>
                    <p className="text-sm text-gray-500">Allow customers to request delivery</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deliverySettings.delivery_enabled}
                    onChange={(e) => setDeliverySettings({ ...deliverySettings, delivery_enabled: e.target.checked })}
                    className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">In-Store Pickup</span>
                    <p className="text-sm text-gray-500">Allow customers to pick up orders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deliverySettings.pickup_available}
                    onChange={(e) => setDeliverySettings({ ...deliverySettings, pickup_available: e.target.checked })}
                    className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Next-Day Guarantee</span>
                    <p className="text-sm text-gray-500">Guarantee delivery by next business day</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deliverySettings.next_day_guaranteed}
                    onChange={(e) => setDeliverySettings({ ...deliverySettings, next_day_guaranteed: e.target.checked })}
                    className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                  />
                </label>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 pt-4">Delivery Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={deliverySettings.delivery_fee}
                      onChange={(e) => setDeliverySettings({ ...deliverySettings, delivery_fee: parseFloat(e.target.value) })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Free Delivery Threshold
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={deliverySettings.free_delivery_threshold}
                      onChange={(e) => setDeliverySettings({ ...deliverySettings, free_delivery_threshold: parseFloat(e.target.value) })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Orders above this amount get free delivery</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    value={deliverySettings.delivery_radius_km}
                    onChange={(e) => setDeliverySettings({ ...deliverySettings, delivery_radius_km: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Same-Day Cutoff Time
                  </label>
                  <input
                    type="time"
                    value={deliverySettings.same_day_cutoff}
                    onChange={(e) => setDeliverySettings({ ...deliverySettings, same_day_cutoff: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">Orders after this time are next-day</p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Notification Channels</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <span className="font-medium text-gray-900">Email Notifications</span>
                      <p className="text-sm text-gray-500">Send updates via email</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.email_notifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, email_notifications: e.target.checked })}
                    className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <span className="font-medium text-gray-900">SMS Notifications</span>
                      <p className="text-sm text-gray-500">Send updates via text message</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.sms_notifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, sms_notifications: e.target.checked })}
                    className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                  />
                </label>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 pt-4">Order Notifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'order_confirmation', label: 'Order Confirmation' },
                  { key: 'pickup_reminder', label: 'Pickup Reminder' },
                  { key: 'ready_for_delivery', label: 'Ready for Delivery' },
                  { key: 'delivery_updates', label: 'Delivery Updates' }
                ].map(item => (
                  <label key={item.key} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={notificationSettings[item.key]}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                      className="w-4 h-4 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                    />
                    <span className="ml-3 text-gray-900">{item.label}</span>
                  </label>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 pt-4">Marketing</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Promotional Emails</span>
                    <p className="text-sm text-gray-500">Send promotions and offers</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.promotional_emails}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, promotional_emails: e.target.checked })}
                    className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Weekly Summary</span>
                    <p className="text-sm text-gray-500">Admin receives weekly business summary</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.weekly_summary}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, weekly_summary: e.target.checked })}
                    className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Cash Payments</span>
                    <p className="text-sm text-gray-500">Accept cash on pickup/delivery</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.accept_cash}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, accept_cash: e.target.checked })}
                    className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Card Payments</span>
                    <p className="text-sm text-gray-500">Accept credit/debit cards</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.accept_card}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, accept_card: e.target.checked })}
                    className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">E-Transfer</span>
                    <p className="text-sm text-gray-500">Accept Interac e-Transfer</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.accept_etransfer}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, accept_etransfer: e.target.checked })}
                    className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                  />
                </label>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 pt-4">Taxes & Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={paymentSettings.tax_rate}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, tax_rate: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Ontario HST is 13%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Tip (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={paymentSettings.default_tip_percent}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, default_tip_percent: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amani-green focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
              </div>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mt-4">
                <div>
                  <span className="font-medium text-gray-900">Enable Tips</span>
                  <p className="text-sm text-gray-500">Allow customers to add tips</p>
                </div>
                <input
                  type="checkbox"
                  checked={paymentSettings.tip_enabled}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, tip_enabled: e.target.checked })}
                  className="w-5 h-5 text-amani-green border-gray-300 rounded focus:ring-amani-green"
                />
              </label>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Stripe Integration</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      To accept online card payments, connect your Stripe account in the integrations section.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Application Mode</h3>
              <p className="text-sm text-gray-500">
                Control whether demo mode is available. When disabled, users will only see live mode.
              </p>
              
              <div className="space-y-4">
                <div 
                  className={`p-6 rounded-xl border-2 transition-all ${
                    systemSettings.demo_enabled 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-green-500 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {systemSettings.demo_enabled ? (
                        <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                          <Cloud className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {systemSettings.demo_enabled ? 'Demo Mode Enabled' : 'Live Mode Only'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {systemSettings.demo_enabled 
                            ? 'Users can switch between demo and live mode' 
                            : 'Users only see live mode (production)'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={async () => {
                        const newValue = !systemSettings.demo_enabled;
                        setSystemSettings({ demo_enabled: newValue });
                        const success = await setDemoEnabled(newValue);
                        if (success) {
                          toast.success(newValue ? 'Demo mode enabled' : 'Demo mode disabled');
                        } else {
                          setSystemSettings({ demo_enabled: !newValue });
                          toast.error('Failed to update setting');
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        systemSettings.demo_enabled 
                          ? 'bg-purple-100 hover:bg-purple-200' 
                          : 'bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {systemSettings.demo_enabled ? (
                        <ToggleRight className="w-8 h-8 text-purple-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-green-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Database className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">About Demo Mode</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        When demo mode is enabled, users can switch to local data storage for testing. 
                        This is useful for training staff or demonstrating the system without affecting real data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Production Recommendation</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        For production use, keep demo mode <strong>disabled</strong>. This ensures all users 
                        work with real data and prevents accidental data loss from switching modes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 pt-6">Current Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {systemSettings.demo_enabled ? (
                      <Database className="w-5 h-5 text-purple-500" />
                    ) : (
                      <Cloud className="w-5 h-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">Mode</p>
                      <p className="text-sm text-gray-500">
                        {systemSettings.demo_enabled ? 'Demo Enabled' : 'Live Only'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">Data Storage</p>
                      <p className="text-sm text-gray-500">Supabase (PostgreSQL)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
