import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Users, Wallet, BarChart3 } from 'lucide-react';
import { TransactionItem } from '../features/transactions/ui/TransactionItem';
import { useAuthContext } from '../app/providers/AuthContext';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';
import { useTransactions } from '../entities/transactions/model/useTransactions';
import { TotalBalance } from '../shared/ui/TotalBalance';
import { useDashboardStats } from '../features/dashboard/model/useDashboardStats';
import { useEffect } from 'react';

/**
 * Dashboard.tsx
 * Página principal de la aplicación que ofrece una vista panorámica del estado financiero.
 * Muestra métricas clave (balance compartido, contribuciones, balance personal) y
 * una lista de las transacciones más recientes.
 */

export default function Dashboard() {
  // Estado y autenticación
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { prefetchRates, t, currency, loadingRates } = useLocaleCurrency();

  // Hook personalizado para obtener todas las transacciones vinculadas al usuario (personales y compartidas)
  const { transactions, loading: txLoading } = useTransactions('all');

  // Obtener el nombre del usuario para el saludo
  const userName = user?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  // Hook para calcular estadísticas derivadas de las transacciones en tiempo real
  // Calculando el balance total de toda la vida de la cuenta, sin filtros de mes
  const {
    totalShared,
    personalTotal
  } = useDashboardStats(transactions);

  // Limitamos la vista a los 5 movimientos más recientes para el resumen del Dashboard
  const recentTransactions = transactions.slice(0, 5);

  // Precarga de tasas: todas las transacciones (para totales correctos) en una sola petición de rango
  useEffect(() => {
    if (transactions.length === 0) return;
    void prefetchRates(transactions.map((tx) => tx.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length, currency]);



  return (
    <>
      <Helmet>
        <title>{t('navDashboard')} - Wallet.ia</title>
        <meta name="description" content="Vista general de tus finanzas personales y en pareja." />
      </Helmet>
      <div className="page-header">
        <div className="page-header-left">
          <h1>¡Hola {userName}!</h1>
          <p>{t('financialSummary')} —</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currency !== 'EUR' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent-primary-glow)',
              border: '1px solid var(--border-accent)',
              fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--accent-primary-hover)',
            }}>
              {loadingRates ? (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              ) : '💱'}
              {currency}
            </div>
          )}
          <button
            className="notification-shortcut-btn"
            onClick={() => navigate('/analytics')}
            aria-label="Ver analítica"
            title={t('analytics')}
          >
            <BarChart3 size={24} />
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <TotalBalance
            value={totalShared}
            label={t('sharedBalance')}
            color="var(--accent-gradient)"
            iconBg="var(--accent-primary-glow)"
            iconColor="var(--accent-primary-hover)"
            icon={<Users size={22} />}
          />

          <TotalBalance
            value={personalTotal}
            label={t('personalBalance')}
            color="linear-gradient(90deg, #F59E0B, #FBBF24)"
            iconBg="var(--warning-bg)"
            iconColor="var(--warning)"
            icon={<Wallet size={22} />}
          />
        </div>

        <div className="dashboard-grid">
          {/* Recent transactions */}
          <div className="card animate-in">
            <div className="card-header">
              <div>
                <div className="card-title">{t('recentTransactions')}</div>
                <div className="card-subtitle">{t('latestMovements')}</div>
              </div>
              <span className="tx-ver-mas" onClick={() => navigate('/transactions')}>{t('viewMore')}</span>
            </div>

            <div className="transaction-list">
              {txLoading ? (
                <div className="empty-state">
                  <div className="loading-spinner" />
                  <div className="loading-text">Cargando transacciones...</div>
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💸</div>
                  <div className="empty-state-title">{t('noTransactions')}</div>
                  <div className="empty-state-desc" style={{ marginBottom: 16 }}>
                    Añade tu primer ingreso o gasto para empezar a controlar tu dinero.
                  </div>
                  <button className="kebo-button-primary" onClick={() => navigate('/transactions')}>
                    Añadir transacción
                  </button>
                </div>
              ) : (
                recentTransactions.map(tx => (
                  <TransactionItem key={tx.id} tx={tx} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .notification-shortcut-btn {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          width: 44px;
          height: 44px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-primary-hover);
          cursor: pointer;
          transition: var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .notification-shortcut-btn:hover {
          transform: translateY(-2px);
          background: var(--bg-hover);
          box-shadow: var(--shadow-md);
        }

      `}</style>
    </>
  );
}
