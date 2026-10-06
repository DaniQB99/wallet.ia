import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Account } from '../../../shared/types/database';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';

interface AnalyticsAccountFilterProps {
  accounts: Account[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
}

export const AnalyticsAccountFilter: React.FC<AnalyticsAccountFilterProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
}) => {
  const { t, formatMoney, translateEntityName } = useLocaleCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  // Combined total balance of all accounts
  const totalAllBalance = useMemo(() => {
    return accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  }, [accounts]);

  const isAll = selectedAccountId === 'all';
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const currentIcon = isAll ? '💳' : selectedAccount?.icon || '🏦';
  const currentColor = isAll
    ? 'rgba(99, 102, 241, 0.2)'
    : selectedAccount?.color
    ? `${selectedAccount.color}25`
    : 'rgba(99, 102, 241, 0.2)';
  const currentName = isAll
    ? t('allAccounts')
    : selectedAccount
    ? translateEntityName(selectedAccount.name, 'account')
    : t('selectAccount');
  const currentBalance = isAll ? totalAllBalance : selectedAccount?.balance || 0;

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {/* Label superior estilo CUENTA */}
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'rgba(255, 255, 255, 0.45)',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}
      >
        {t('accountUpper')}
      </div>

      {/* Tarjeta principal estilo tx-field-card (igual que en nueva transacción) */}
      <motion.div
        className="tx-field-card"
        onClick={() => setIsOpen((prev) => !prev)}
        whileTap={{ scale: 0.99 }}
        style={{
          padding: '10px 14px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxSizing: 'border-box',
          borderColor: isOpen ? 'var(--accent-primary)' : undefined,
        }}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: currentColor,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            {currentIcon}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: '#ffffff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentName}
            </span>
            <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              {t('balanceStr')}: {formatMoney(currentBalance)}
            </span>
          </div>
        </div>

        <ChevronDown
          size={18}
          color="rgba(255, 255, 255, 0.4)"
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </motion.div>

      {/* Menú flotante desplegable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'rgba(19, 17, 26, 0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '6px',
              zIndex: 150,
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
            role="listbox"
          >
            {/* Opción: Todas las cuentas */}
            <button
              type="button"
              onClick={() => {
                onSelectAccount('all');
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '12px',
                background: isAll ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: isAll ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!isAll) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isAll) e.currentTarget.style.background = 'transparent';
              }}
              role="option"
              aria-selected={isAll}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.05rem',
                    flexShrink: 0,
                  }}
                >
                  💳
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('allAccounts')}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {t('balanceStr')}: {formatMoney(totalAllBalance)}
                  </div>
                </div>
              </div>
              {isAll && <Check size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />}
            </button>

            {/* Opciones individuales por cuenta */}
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    onSelectAccount(acc.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: acc.color ? `${acc.color}25` : 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.05rem',
                        flexShrink: 0,
                      }}
                    >
                      {acc.icon || '🏦'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {translateEntityName(acc.name, 'account')}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {t('balanceStr')}: {formatMoney(acc.balance || 0)}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
