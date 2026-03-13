import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Stores
import { useAuthStore, useAppStore, useServicesStore } from './stores';
import db from './lib/db';

// i18n
import { LanguageProvider } from './i18n/LanguageContext';

// Layouts
import CustomerLayout from './components/layout/CustomerLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Components
import WhatsAppButton from './components/WhatsAppButton';

// PWA Components
import { usePWA } from './components/pwa/usePWA';
import PWAInstallPrompt from './components/pwa/PWAInstallPrompt';
import PWAUpdatePrompt from './components/pwa/PWAUpdatePrompt';
import PWAOnboarding from './components/pwa/PWAOnboarding';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import ServicesPage from './pages/customer/ServicesPage';
import PricingPage from './pages/customer/PricingPage';
import OrderPage from './pages/customer/OrderPage';
import TrackOrderPage from './pages/customer/TrackOrderPage';
import AccountPage from './pages/customer/AccountPage';
import SubscriptionsPage from './pages/customer/SubscriptionsPage';
import DriveWithUsPage from './pages/customer/DriveWithUsPage';
import PartnerApplicationPage from './pages/PartnerApplicationPage';
import DriverApplicationPage from './pages/DriverApplicationPage';
import CareerApplicationPage from './pages/CareerApplicationPage';
import SMSTestComponent from './components/SMSTestComponent';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RoleSelectPage from './pages/auth/RoleSelectPage';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverRoutes from './pages/driver/DriverRoutes';
import DriverDelivery from './pages/driver/DriverDelivery';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffOrders from './pages/staff/StaffOrders';
import StaffProcessing from './pages/staff/StaffProcessing';
import StaffMessaging from './pages/staff/StaffMessaging';
import StaffApplications from './pages/staff/StaffApplications';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminStaff from './pages/admin/AdminStaff';
import AdminServices from './pages/admin/AdminServices';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminPlans from './pages/admin/AdminPlans';
import AdminCheckins from './pages/admin/AdminCheckins';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminMessaging from './pages/admin/AdminMessaging';
import AdminApplications from './pages/admin/AdminApplications';
import AdminDepots from './pages/admin/AdminDepots';

// Partner Pages
import PartnerDashboard from './pages/partner/PartnerDashboard';
import PartnerOrders from './pages/partner/PartnerOrders';
import PartnerDepotInfo from './pages/partner/PartnerDepotInfo';
import PartnerServices from './pages/partner/PartnerServices';
import PartnerInvoices from './pages/partner/PartnerInvoices';
import PartnerCreateInvoice from './pages/partner/PartnerCreateInvoice';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const { mode, demoEnabled, loadAppModeSettings, settingsLoaded } = useAppStore();
  const { fetchServices } = useServicesStore();
  const pwa = usePWA();

  useEffect(() => {
    // Initialize database, load settings, and fetch services
    const init = async () => {
      await db.init();
      await loadAppModeSettings();
      await fetchServices();
    };
    init();
  }, [fetchServices, loadAppModeSettings]);

  return (
    <LanguageProvider>
      <BrowserRouter>
        {/* Mode indicator - only show when demo is enabled by admin */}
        {demoEnabled && mode === 'demo' && (
          <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amani-500 to-maple-500 text-white text-center py-1 text-sm font-medium z-50">
            🧪 Demo Mode - Data stored locally | <a href="/login" className="underline">Switch to Live Mode</a>
          </div>
        )}

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a2055',
              color: '#fff',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/select-role" element={<RoleSelectPage />} />

          {/* Temporary SMS Test Route */}
          <Route path="/sms-test" element={<SMSTestComponent />} />

          {/* Customer Routes */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<HomePage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="order" element={<OrderPage />} />
            <Route path="track" element={<TrackOrderPage />} />
            <Route path="track/:referenceCode" element={<TrackOrderPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="drive-with-us" element={<DriveWithUsPage />} />
            <Route path="partner" element={<PartnerApplicationPage />} />
            <Route path="driver" element={<DriverApplicationPage />} />
            <Route path="careers" element={<CareerApplicationPage />} />
            <Route path="account" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <AccountPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Driver Routes */}
          <Route path="/driver" element={
            <ProtectedRoute allowedRoles={['driver', 'admin']}>
              <DashboardLayout type="driver" />
            </ProtectedRoute>
          }>
            <Route index element={<DriverDashboard />} />
            <Route path="routes" element={<DriverRoutes />} />
            <Route path="delivery/:orderId" element={<DriverDelivery />} />
          </Route>

          {/* Staff Routes */}
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <DashboardLayout type="staff" />
            </ProtectedRoute>
          }>
            <Route index element={<StaffDashboard />} />
            <Route path="orders" element={<StaffOrders />} />
            <Route path="processing" element={<StaffProcessing />} />
            <Route path="messaging" element={<StaffMessaging />} />
            <Route path="applications" element={<StaffApplications />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout type="admin" />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="checkins" element={<AdminCheckins />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="depots" element={<AdminDepots />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="messaging" element={<AdminMessaging />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Staff Depots Route */}
          <Route path="/staff/depots" element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <DashboardLayout type="staff" />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDepots />} />
          </Route>

          {/* Partner Portal Routes */}
          <Route path="/partner-portal" element={
            <ProtectedRoute allowedRoles={['partner', 'admin']}>
              <DashboardLayout type="partner" />
            </ProtectedRoute>
          }>
            <Route index element={<PartnerDashboard />} />
            <Route path="orders" element={<PartnerOrders />} />
            <Route path="depot" element={<PartnerDepotInfo />} />
            <Route path="services" element={<PartnerServices />} />
            <Route path="invoices" element={<PartnerInvoices />} />
            <Route path="invoices/create" element={<PartnerCreateInvoice />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* WhatsApp Floating Button */}
        <WhatsAppButton />

        {/* PWA Components */}
        <PWAOnboarding />
        <PWAInstallPrompt
          canInstall={pwa.canInstall}
          isIOS={pwa.isIOS}
          isInstalled={pwa.isInstalled}
          onInstall={pwa.promptInstall}
        />
        <PWAUpdatePrompt
          needRefresh={pwa.needRefresh}
          onUpdate={pwa.updateServiceWorker}
          onDismiss={pwa.dismissUpdate}
        />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
