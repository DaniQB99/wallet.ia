import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider } from './providers/AuthContext';
import { AppearanceProvider } from './providers/AppearanceContext';
import { LocaleCurrencyProvider } from './providers/LocaleCurrencyContext';
import { useLocaleCurrency } from './providers/LocaleCurrencyContext';
import { QueryProvider } from './providers/QueryProvider';
import ProtectedRoute from '../shared/ui/ProtectedRoute';
import Sidebar from '../widgets/layout/Sidebar';
import BottomNav from '../widgets/layout/BottomNav';
import OnboardingOverlay from '../shared/ui/OnboardingOverlay';
import CookieConsent from '../shared/components/CookieConsent';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Transactions = lazy(() => import('../pages/Transactions'));
const Goals = lazy(() => import('../pages/Goals'));
const Settings = lazy(() => import('../pages/Settings'));
const AuthPage = lazy(() => import('../pages/AuthPage'));
const CookiePolicyPage = lazy(() => import('../pages/CookiePolicyPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
    <PageLoaderText />
  </div>
);

const PageLoaderText = () => {
  const { t } = useLocaleCurrency();
  return <div style={{ color: 'var(--text-secondary)' }}>{t('loadingModule')}</div>;
};

import { HelmetProvider } from 'react-helmet-async';

export default function App() {
  return (
    <HelmetProvider>
      <QueryProvider>
        <BrowserRouter>
          <SpeedInsights />
          <AppearanceProvider>
            <AuthProvider>
              <LocaleCurrencyProvider>
                <CookieConsent />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/cookies" element={<CookiePolicyPage />} />
                    <Route
                      path="/*"
                      element={
                        <ProtectedRoute>
                          <div className="app-layout">
                            <OnboardingOverlay />
                            <Sidebar />
                            <main className="main-content">
                              <Suspense fallback={<PageLoader />}>
                                <Routes>
                                  <Route path="/" element={<Dashboard />} />
                                  <Route path="/analytics" element={<Analytics />} />
                                  <Route path="/transactions" element={<Transactions />} />
                                  <Route path="/goals" element={<Goals />} />
                                  <Route path="/settings" element={<Settings />} />
                                </Routes>
                              </Suspense>
                            </main>
                            <BottomNav />
                          </div>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Suspense>
              </LocaleCurrencyProvider>
            </AuthProvider>
          </AppearanceProvider>
        </BrowserRouter>
      </QueryProvider>
    </HelmetProvider>
  );
}
