import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Users, Wallet, BarChart3 } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useLocaleCurrency } from '../contexts/LocaleCurrencyContext';
import { useTransactions } from '../hooks/useTransactions';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useEffect, useMemo, useState } from 'react';

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
  const { formatMoney, prefetchRates, locale, t } = useLocaleCurrency();

  // Hook personalizado para obtener todas las transacciones vinculadas al usuario (personales y compartidas)
  const { transactions, loading: txLoading } = useTransactions('all');

  // Filtro mensual por defecto en mes actual
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => new Date(tx.date).toISOString().slice(0, 7) === selectedMonth);
  }, [transactions, selectedMonth]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => months.add(new Date(tx.date).toISOString().slice(0, 7)));
    if (months.size === 0) {
      months.add(new Date().toISOString().slice(0, 7));
    }
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Hook para calcular estadísticas derivadas de las transacciones en tiempo real
  const {
    totalShared,
    myContribution,
    partnerContribution,
    personalTotal
  } = useDashboardStats(filteredTransactions);

  // Limitamos la vista a los 5 movimientos más recientes para el resumen del Dashboard
  const recentTransactions = filteredTransactions.slice(0, 5);
  useEffect(() => {
    void prefetchRates(recentTransactions.map((tx) => tx.date));
  }, [recentTransactions, prefetchRates]);

  const selectedMonthDate = new Date(`${selectedMonth}-01T00:00:00`);
  const selectedMonthLabel = selectedMonthDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('dashboard')}</h1>
          <p>
            {t('financialSummary')} —
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                marginLeft: '8px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '3px 8px',
                textTransform: 'capitalize',
              }}
            >
              {availableMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey} style={{ textTransform: 'capitalize' }}>
                  {new Date(`${monthKey}-01T00:00:00`).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </p>
        </div>
        <div className="page-header-right">
          <button
            className="notification-shortcut-btn"
            onClick={() => navigate('/analytics')}
            aria-label="Ver analítica"
            title={`Ver analítica de ${selectedMonthLabel}`}
          >
            <BarChart3 size={24} />
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card" style={{ '--stat-color': 'var(--accent-gradient)' } as React.CSSProperties}>
            <div className="stat-card-icon" style={{ background: 'var(--accent-primary-glow)' }}>
              <Wallet size={22} color="var(--accent-primary-hover)" />
            </div>
            <div className="stat-card-value">{formatMoney(totalShared)}</div>
            <div className="stat-card-label">{t('sharedBalance')}</div>
            <div className="stat-card-change positive">
              <TrendingDown size={12} /> 12% vs mes anterior
            </div>
          </div>

          <div className="stat-card" style={{ '--stat-color': 'linear-gradient(90deg, #10B981, #34D399)' } as React.CSSProperties}>
            <div className="stat-card-icon" style={{ background: 'var(--success-bg)' }}>
              <TrendingUp size={22} color="var(--success)" />
            </div>
            <div className="stat-card-value">{formatMoney(myContribution)}</div>
            <div className="stat-card-label">{t('myContribution')}</div>
          </div>

          <div className="stat-card" style={{ '--stat-color': 'linear-gradient(90deg, #EC4899, #F472B6)' } as React.CSSProperties}>
            <div className="stat-card-icon" style={{ background: 'rgba(236, 72, 153, 0.12)' }}>
              <Users size={22} color="#EC4899" />
            </div>
            <div className="stat-card-value">{formatMoney(partnerContribution)}</div>
            <div className="stat-card-label">{t('partnerContribution')}</div>
          </div>

          <div className="stat-card" style={{ '--stat-color': 'linear-gradient(90deg, #F59E0B, #FBBF24)' } as React.CSSProperties}>
            <div className="stat-card-icon" style={{ background: 'var(--warning-bg)' }}>
              <Wallet size={22} color="var(--warning)" />
            </div>
            <div className="stat-card-value">{formatMoney(personalTotal)}</div>
            <div className="stat-card-label">{t('personalBalance')}</div>
          </div>
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
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-title">{t('noTransactions')}</div>
                  <div className="empty-state-desc">
                    {t('noRecentMovements')}
                  </div>
                </div>
              ) : (
                recentTransactions.map(tx => (
                  <div key={tx.id} className="transaction-item">
                    <div className="transaction-icon" style={{ background: tx.category?.color ? `${tx.category.color}15` : 'var(--bg-secondary)', color: tx.category?.color || 'var(--text-primary)' }}>
                      {tx.category ? tx.category.icon : '🏷️'}
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-desc">
                        {tx.description}
                        {tx.type === 'shared' && (
                          <span className="badge-shared" style={{ marginLeft: '8px' }}>Compartido</span>
                        )}
                      </div>
                      <div className="transaction-meta">
                        {new Date(tx.date).toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                        {tx.type === 'shared' && tx.user_id !== user?.id && (
                          <span style={{ color: 'var(--accent-primary-hover)' }}>
                            — {t('createdByPartner')}
                          </span>
                        )}
                      </div>
                      {tx.account && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          {tx.account.icon} {tx.account.name}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className={tx.amount > 0 ? "transaction-amount income" : "transaction-amount expense"}>
                        {tx.amount > 0 ? '+' : '-'}{formatMoney(Math.abs(Number(tx.amount)), tx.date)}
                      </div>
                      <div className="transaction-user" style={{ textAlign: 'right', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {tx.user_id === user?.id ? t('me') : t('partner')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
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
