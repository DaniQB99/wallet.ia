import React from 'react';
import type { Transaction } from '../../../shared/types/database';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import { useAuthContext } from '../../../app/providers/AuthContext';

interface TransactionItemProps {
  tx: Transaction;
  onClick?: () => void;
  showChevron?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ tx, onClick, showChevron }) => {
  const { formatMoney, t } = useLocaleCurrency();
  const { user } = useAuthContext();

  const isIncome = tx.amount > 0;
  const originalAmount = Math.abs(Number(tx.amount));
  const baseAmount = Math.abs(Number(tx.base_amount || tx.amount));

  return (
    <div 
      className="transaction-item" 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div 
        className="transaction-icon" 
        style={{ 
          background: tx.category?.color ? `${tx.category.color}15` : 'var(--bg-secondary)', 
          color: tx.category?.color || 'var(--text-primary)' 
        }}
      >
        {tx.category ? tx.category.icon : '🏷️'}
      </div>
      
      <div className="transaction-info">
        <div className="transaction-desc">
          {tx.description || t('noDescription')}
          {tx.type === 'shared' && (
            <span className="badge-shared" style={{ marginLeft: '8px' }}>Compartido</span>
          )}
        </div>
        <div className="transaction-meta">
          {new Date(tx.date).toLocaleDateString(undefined, {
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
        <div className={isIncome ? "transaction-amount income" : "transaction-amount expense"}>
          {isIncome ? '+' : '-'}{formatMoney(baseAmount, tx.date)}
        </div>
        <div className="transaction-user" style={{ textAlign: 'right', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {tx.user_id === user?.id ? t('me') : t('partner')}
        </div>
      </div>
      
      {showChevron && (
        <div style={{ paddingLeft: '8px', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}>
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>
      )}
    </div>
  );
};
