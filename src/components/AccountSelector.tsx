import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import type { Account } from '../types/database';
import { useLocaleCurrency } from '../contexts/LocaleCurrencyContext';

interface AccountSelectorProps {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  selected: Account | null;
  onSelect: (acc: Account) => void;
}

/**
 * Selector de cuentas bancarias/carteras en formato "Sheet".
 *
 * Este componente proporciona una lista visual de cuentas disponibles
 * filtradas por el contexto (personal/compartido), mostrando saldos
 * y estados de selección. Utiliza Framer Motion para animaciones nativas.
 */
export default function AccountSelector({ open, onClose, accounts, selected, onSelect }: AccountSelectorProps) {
  const { formatMoney } = useLocaleCurrency();
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="kebo-sheet-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="kebo-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="kebo-sheet-header">
            <span className="kebo-sheet-title">Cuentas</span>
            <button className="kebo-sheet-close" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="kebo-account-list">
            {accounts.length === 0 ? (
              <div className="kebo-account-empty">
                No tienes cuentas. Crea una en Ajustes.
              </div>
            ) : (
              accounts.map(acc => (
                <button
                  key={acc.id}
                  className={`kebo-account-item ${selected?.id === acc.id ? 'selected' : ''}`}
                  onClick={() => onSelect(acc)}
                >
                  <span className="kebo-acc-icon" style={{ background: `${acc.color}20` }}>
                    {acc.icon}
                  </span>
                  <div className="kebo-acc-info">
                    <span className="kebo-acc-name">{acc.name}</span>
                    <span className="kebo-acc-type">Cuenta</span>
                  </div>
                  <div className="kebo-acc-right">
                    <span className="kebo-acc-balance" style={{ color: 'var(--accent-primary-hover)' }}>
                      {formatMoney(acc.balance)}
                    </span>
                    {selected?.id === acc.id && <Check size={16} className="kebo-acc-check" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
