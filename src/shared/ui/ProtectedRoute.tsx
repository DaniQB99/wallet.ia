import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../app/providers/AuthContext';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';

/**
 * Componente Wrapper de enrutamiento que custodia las rutas protegidas de la aplicación.
 * Previene el acceso a usuarios no autenticados redirigiéndolos al inicio de sesión (`/auth`),
 * y despliega un 'spinner' de carga mientras se verifica el estado asíncrono de la sesión.
 *
 * @param props - Envuelve a los componentes renderizados dentro de la ruta (`children`).
 */
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
