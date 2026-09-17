import React from 'react';
import type { Transaction } from '../../../shared/types/database';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import { useAuthContext } from '../../../app/providers/AuthContext';
import { useData } from '../../../app/providers/DataProvider';

interface TransactionItemProps {
  tx: Transaction;
  onClick?: () => void;
  showChevron?: boolean;
  isDashboard?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ tx, onClick, showChevron, isDashboard }) => {
  const { formatMoney, locale } = useLocaleCurrency();
  const { user } = useAuthContext();
  const { partner } = useData();

  const isIncome = tx.amount > 0;
  const originalAmount = Math.abs(Number(tx.amount));
  const baseAmount = Math.abs(Number(tx.base_amount || tx.amount));

  let initial = 'U';
  if (tx.user_id === user?.id) {
    initial = user?.display_name?.[0] || user?.email?.[0] || 'U';
  } else if (partner && tx.user_id === partner.id) {
    initial = partner.display_name?.[0] || partner.email?.[0] || 'P';
  } else {
    initial = 'P';
  }
  initial = initial.toUpperCase();

  return (
    <div
      className="transaction-item"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ position: 'relative' }}>
        <div
          className="transaction-icon"
          style={{
            background: tx.category?.color ? `${tx.category.color}15` : 'var(--bg-secondary)',
            color: tx.category?.color || 'var(--text-primary)'
          }}
        >
          {tx.category ? tx.category.icon : '🏷️'}
        </div>
        {tx.type === 'shared' && (
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontSize: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            border: '2px solid var(--bg-primary)'
          }}>
            {initial}
          </div>
        )}
      </div>

      <div className="transaction-info">
        <div className="transaction-desc" style={{ fontWeight: 'bold' }}>
          {tx.category?.name || 'Otros'}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          {tx.currency && tx.currency !== 'EUR' ? (
            <span>
              {originalAmount.toFixed(2)} {tx.currency} (a tasa {tx.exchange_rate_used?.toFixed(4) || 1.0})
            </span>
          ) : (
            tx.account && (<span>{tx.account.icon} {tx.account.name}</span>)
          )}
        </div>
      </div>

      <div>
        <div
          className={isDashboard ? "transaction-amount" : isIncome ? "transaction-amount income" : "transaction-amount expense"}
          style={isDashboard ? { color: 'var(--text-primary)' } : {}}
        >
          {isDashboard ? (isIncome ? '+' : '-') : isIncome ? '+' : '-'}{formatMoney(baseAmount, tx.date)}
        </div>
        <div className="transaction-user" style={{ textAlign: 'right', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {new Date(tx.date).toLocaleDateString(locale, { month: 'short', day: '2-digit' }).replace('.', '').replace(/^\w/, c => c.toUpperCase())}
        </div>
      </div>

      {showChevron && !isDashboard && (
        <div style={{ paddingLeft: '8px', display: 'flex', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      )}
    </div>
  );
};
