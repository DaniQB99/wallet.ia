import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PieChart, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Landmark, Plus } from 'lucide-react';
import { TransactionItem } from '../features/transactions/ui/TransactionItem';
import { useAuthContext } from '../app/providers/AuthContext';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';
import { useTransactions } from '../entities/transactions/model/useTransactions';
import { useAccounts } from '../entities/accounts/model/useAccounts';
import { useEffect, useState, useMemo } from 'react';
import TransactionModal from '../features/transactions/ui/TransactionModal';
import AccountsSettings from '../features/settings/ui/AccountsSettings';
import BankCardCarousel from '../entities/accounts/ui/BankCardCarousel';
import type { Transaction } from '../shared/types/database';

/**
 * Dashboard.tsx
 * Página principal inspirada en aplicaciones bancarias modernas de alta gama.
 * Presenta un carrusel central de tarjetas bancarias tipo Liquid Glass / 3D con indicador
 * de paginación interactivo, acceso directo a configuración de cuentas, acciones rápidas
 * pre-vinculadas a la tarjeta activa y listado contextual de transacciones recientes.
 */
export default function Dashboard() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { prefetchRates, t, currency, loadingRates, translateEntityName } = useLocaleCurrency();

  // Estados de navegación y modales
  const [showModal, setShowModal] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [flowType, setFlowType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [showAccounts, setShowAccounts] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Estado del carrusel de tarjetas bancarias
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);

  // Obtención de datos
  const { accounts } = useAccounts();
  const { transactions, loading: txLoading } = useTransactions('all');

  // Tarjeta activa en el carrusel
  const currentAccount = accounts.length > 0
    ? (selectedCardIndex < accounts.length ? accounts[selectedCardIndex] : accounts[0])
    : null;

  // Filtrado reactivo de transacciones recientes asociadas a la tarjeta activa
  const accountTransactions = useMemo(() => {
    if (!currentAccount) return transactions.slice(0, 5);
    return transactions
      .filter(tx => tx.account_id === currentAccount.id)
      .slice(0, 5);
  }, [transactions, currentAccount]);

  // Saludo al usuario
  const userName = user?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  // Precarga de tasas de cambio
  useEffect(() => {
    if (transactions.length === 0) return;
    void prefetchRates(transactions.map((tx) => tx.date));
  }, [transactions.length, currency]);

  // Manejador para abrir modal de transacción vinculado a la tarjeta activa
  const handleQuickAction = (type: 'expense' | 'income' | 'transfer') => {
    setFlowType(type);
    setTxToEdit(null);
    setShowModal(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTxToEdit(tx);
    setShowModal(true);
  };

  // Manejador del engranaje en la tarjeta para editar la cuenta activa
  const handleEditAccount = (accountId: string) => {
    setEditingAccountId(accountId);
    setShowAccounts(true);
  };

  // Manejador para añadir una nueva tarjeta
  const handleAddAccount = () => {
    setEditingAccountId(null);
    setShowAccounts(true);
  };

  return (
    <>
      <Helmet>
        <title>{t('dashboard')} - Wallet.ia</title>
        <meta name="description" content={t('dashboardMetaDesc')} />
      </Helmet>

      {/* Cabecera del Dashboard */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }} />

        <div style={{ flex: '0 1 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
            {t('helloUser').replace('{name}', userName)}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('financialSummary')} —</p>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
          {currency !== 'EUR' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-primary-glow)',
                border: '1px solid var(--border-accent)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--accent-primary-hover)',
              }}
            >
              {loadingRates ? (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : (
                '💱'
              )}
              {currency}
            </div>
          )}
          <button
            className="notification-shortcut-btn"
            onClick={() => navigate('/analytics')}
            aria-label={t('viewAnalytics')}
            title={t('analytics')}
          >
            <PieChart size={22} />
          </button>
        </div>
      </div>

      <div className="page-content" style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
        {/* 1. Carrusel de Tarjetas Bancarias Modernas (Liquid Glass 3D) */}
        <BankCardCarousel
          accounts={accounts}
          selectedIndex={selectedCardIndex}
          onSelectIndex={setSelectedCardIndex}
          onEditAccount={handleEditAccount}
          onAddAccount={handleAddAccount}
        />

        {/* 2. Las 4 Acciones Rápidas (Gasto, Ingreso, Transferencia, Cuentas) */}
        <div className="dashboard-actions-grid">
          <div className="dashboard-action-item" onClick={() => handleQuickAction('expense')}>
            <button className="dashboard-action-btn" aria-label={t('newExpense')}>
              <ArrowDownRight size={24} style={{ color: '#ef4444' }} />
            </button>
            <span className="dashboard-action-label">{t('expenseFlow')}</span>
          </div>

          <div className="dashboard-action-item" onClick={() => handleQuickAction('income')}>
            <button className="dashboard-action-btn" aria-label={t('newIncome')}>
              <ArrowUpRight size={24} style={{ color: '#10b981' }} />
            </button>
            <span className="dashboard-action-label">{t('incomeFlow')}</span>
          </div>

          <div className="dashboard-action-item" onClick={() => handleQuickAction('transfer')}>
            <button className="dashboard-action-btn" aria-label={t('newTransfer')}>
              <ArrowLeftRight size={24} style={{ color: '#6366f1' }} />
            </button>
            <span className="dashboard-action-label">{t('transferFlow')}</span>
          </div>

          <div className="dashboard-action-item" onClick={() => handleAddAccount()}>
            <button className="dashboard-action-btn" aria-label={t('accounts')}>
              <Landmark size={24} style={{ color: '#f59e0b' }} />
            </button>
            <span className="dashboard-action-label">{t('accounts')}</span>
          </div>
        </div>

        {/* 3. Listado Contextual de Transacciones Recientes de la Tarjeta Seleccionada */}
        <div className="dashboard-grid" style={{ marginTop: '8px' }}>
          <div className="animate-in">
            <div className="card-header" style={{ padding: '0 0 10px 0', background: 'transparent' }}>
              <div>
                <div className="card-title" style={{ color: 'var(--text-primary)', fontSize: '1.15rem' }}>
                  {t('recentTransactions')}
                </div>
                <div className="card-subtitle">
                  {currentAccount
                    ? `${t('account')}: ${translateEntityName(currentAccount.name, 'account')}`
                    : t('latestMovements')}
                </div>
              </div>
              <span
                className="tx-ver-mas"
                style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent-primary-hover)' }}
                onClick={() => navigate(currentAccount ? `/transactions?account=${currentAccount.id}` : '/transactions')}
              >
                {t('viewMore')}
              </span>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
              <div className="transaction-list">
                {txLoading ? (
                  <div className="empty-state">
                    <div className="loading-spinner" />
                    <div className="loading-text">{t('loadingModule')}</div>
                  </div>
                ) : accountTransactions.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 20px' }}>
                    <div className="empty-state-icon">💸</div>
                    <div className="empty-state-title">{t('noTransactions')}</div>
                    <div className="empty-state-desc" style={{ marginBottom: 16 }}>
                      {currentAccount ? t('noTransactionsForAccount') : t('latestMovements')}
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleQuickAction('expense')}
                      style={{ padding: '10px 20px', borderRadius: '12px' }}
                    >
                      <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} />
                      {t('newExpense')}
                    </button>
                  </div>
                ) : (
                  accountTransactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      tx={tx}
                      isDashboard
                      onClick={() => handleEditTransaction(tx)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Transacción preseleccionando automáticamente la tarjeta activa del dashboard */}
      <TransactionModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setTxToEdit(null);
        }}
        initialFlowType={flowType}
        editTransaction={txToEdit}
        initialAccountId={currentAccount?.id}
      />

      {/* Modal de Ajustes de Cuentas, abriendo en edición si se pulsó el engranaje */}
      {showAccounts && (
        <AccountsSettings
          onClose={() => {
            setShowAccounts(false);
            setEditingAccountId(null);
          }}
          initialEditingAccountId={editingAccountId}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .notification-shortcut-btn {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          width: 42px;
          height: 42px;
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
