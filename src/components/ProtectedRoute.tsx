import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useLocaleCurrency } from '../contexts/LocaleCurrencyContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const { t } = useLocaleCurrency();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">{t('loadingApp')}</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
