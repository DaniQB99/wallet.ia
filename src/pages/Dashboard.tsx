import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Users, Wallet, Lightbulb } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useNotifications } from '../hooks/useNotifications';
import NotificationsModal from '../components/NotificationsModal';
import { useState } from 'react';

export default function Dashboard() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const { transactions, loading: txLoading } = useTransactions('all');
  const {
    totalShared,
    myContribution,
    partnerContribution,
    personalTotal
  } = useDashboardStats(transactions);

  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Resumen de tus finanzas — Marzo 2026</p>
        </div>
        <div className="page-header-right">
          <button
            className="notification-shortcut-btn"
            onClick={() => setShowNotifications(true)}
            aria-label="Ver notificaciones"
          >
            <Lightbulb size={24} />
            {unreadCount > 0 && (
              <span className="notification-badge-ios">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
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
            <div className="stat-card-value">€{totalShared.toFixed(2)}</div>
            <div className="stat-card-label">Balance compartido</div>
            <div className="stat-card-change positive">
              <TrendingDown size={12} /> 12% vs mes anterior
            </div>
          </div>

          <div className="stat-card" style={{ '--stat-color': 'linear-gradient(90deg, #10B981, #34D399)' } as React.CSSProperties}>
            <div className="stat-card-icon" style={{ background: 'var(--success-bg)' }}>
              <TrendingUp size={22} color="var(--success)" />
            </div>
            <div className="stat-card-value">€{myContribution.toFixed(2)}</div>
            <div className="stat-card-label">Mi contribución</div>
          </div>

          <div className="stat-card" style={{ '--stat-color': 'linear-gradient(90deg, #EC4899, #F472B6)' } as React.CSSProperties}>
            <div className="stat-card-icon" style={{ background: 'rgba(236, 72, 153, 0.12)' }}>
              <Users size={22} color="#EC4899" />
            </div>
            <div className="stat-card-value">€{partnerContribution.toFixed(2)}</div>
            <div className="stat-card-label">Contribución pareja</div>
          </div>

          <div className="stat-card" style={{ '--stat-color': 'linear-gradient(90deg, #F59E0B, #FBBF24)' } as React.CSSProperties}>
            <div className="stat-card-icon" style={{ background: 'var(--warning-bg)' }}>
              <Wallet size={22} color="var(--warning)" />
            </div>
            <div className="stat-card-value">€{personalTotal.toFixed(2)}</div>
            <div className="stat-card-label">Balance personal</div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Recent transactions */}
          <div className="card animate-in">
            <div className="card-header">
              <div>
                <div className="card-title">Transacciones recientes</div>
                <div className="card-subtitle">Últimos movimientos</div>
              </div>
              <span className="tx-ver-mas" onClick={() => navigate('/transactions')}>Ver más</span>
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
                  <div className="empty-state-title">Sin transacciones</div>
                  <div className="empty-state-desc">
                    Aún no hay movimientos recientes.
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
                        {new Date(tx.date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                        {tx.type === 'shared' && tx.user_id !== user?.id && (
                          <span style={{ color: 'var(--accent-primary-hover)' }}>
                            — añadido por Pareja
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
                        {tx.amount > 0 ? '+' : '-'}€{Math.abs(Number(tx.amount)).toFixed(2)}
                      </div>
                      <div className="transaction-user" style={{ textAlign: 'right', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {tx.user_id === user?.id ? 'Yo' : 'Pareja'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}

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
          color: var(--warning);
          cursor: pointer;
          transition: var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .notification-shortcut-btn:hover {
          transform: translateY(-2px);
          background: var(--bg-hover);
          box-shadow: var(--shadow-md);
        }

        .notification-badge-ios {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #FF3B30; /* iOS Red */
          color: white;
          font-size: 11px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--bg-page);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </>
  );
}
