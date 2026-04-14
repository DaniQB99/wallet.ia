import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppearanceProvider } from './contexts/AppearanceContext';
import { LocaleCurrencyProvider } from './contexts/LocaleCurrencyContext';
import { useLocaleCurrency } from './contexts/LocaleCurrencyContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Goals = lazy(() => import('./pages/Goals'));
const Settings = lazy(() => import('./pages/Settings'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
    <PageLoaderText />
  </div>
);

const PageLoaderText = () => {
  const { t } = useLocaleCurrency();
  return <div style={{ color: 'var(--text-secondary)' }}>{t('loadingModule')}</div>;
};

export default function App() {
  return (
    <BrowserRouter>
      <AppearanceProvider>
        <LocaleCurrencyProvider>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <div className="app-layout">
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
          </AuthProvider>
        </LocaleCurrencyProvider>
      </AppearanceProvider>
    </BrowserRouter>
  );
}
