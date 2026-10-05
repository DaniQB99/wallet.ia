import { useState, useMemo } from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import { useTransactions } from '../../../entities/transactions/model/useTransactions';
import { TransactionItem } from '../../transactions/ui/TransactionItem';
import TransactionModal from '../../transactions/ui/TransactionModal';
import type { Goal, Category, Transaction } from '../../../shared/types/database';
import DoubleConfirmModal from '../../../shared/ui/DoubleConfirmModal';

interface CategoryDetailModalProps {
  goal: Goal;
  goalCategory: any; // The relation object containing target_amount and category_id
  category: Category;
  onClose: () => void;
  onRemoveCategory: () => void;
  onEditTarget: () => void;
}

export default function CategoryDetailModal({
  goal,
  goalCategory,
  category,
  onClose,
  onRemoveCategory,
  onEditTarget
}: CategoryDetailModalProps) {
  const { formatMoney, translateEntityName, t } = useLocaleCurrency();
  const { transactions } = useTransactions('all');

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filtrar transacciones por categoría y rango de fechas de la meta
  const categoryTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Must match category
      if (tx.category_id !== category.id) return false;

      // Must be within goal dates (if goal has dates)
      const txDate = new Date(tx.date).getTime();
      if (goal.start_date) {
        const start = new Date(goal.start_date).getTime();
        if (txDate < start) return false;
      }
      if (goal.deadline) {
        // Set deadline to end of day to include transactions on that day
        const end = new Date(goal.deadline);
        end.setHours(23, 59, 59, 999);
        if (txDate > end.getTime()) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, category.id, goal.start_date, goal.deadline]);

  const targetAmount = goalCategory.target_amount || 0;
  const currentAmount = goalCategory.current_amount || 0;

  const percent = targetAmount > 0
    ? (goal.goal_type === 'budget'
      ? Math.max(0, Math.round(((targetAmount - currentAmount) / targetAmount) * 100))
      : Math.min(100, Math.round((currentAmount / targetAmount) * 100)))
    : (goal.goal_type === 'budget' ? 100 : 0);

  const barColor = goal.goal_type === 'budget' ? '#ef4444' : '#10b981';

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ zIndex: 1100, padding: '20px' }} onClick={onClose}>
        <motion.div
          className="modal-content card"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '90vh',
            maxWidth: '600px',
            borderRadius: '20px',
            background: 'var(--bg-primary)',
            padding: '0', // Removing padding here to handle header manually
            overflowY: 'auto',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column'
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="modal-header" style={{ padding: '20px 20px 0 20px', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10, marginBottom: '20px' }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              style={{ left: '20px' }}
              aria-label={t('close')}
            >
              <X size={20} />
            </button>
            <h2 className="modal-title">
              {t('categoryDetail')}
            </h2>
          </div>

          <div style={{ padding: '0 20px 20px' }}>
            {/* Category Overview Card */}
            <div className="card" style={{ padding: '20px', marginBottom: '24px', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: '50%',
                    background: category.color ? `${category.color}22` : 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem'
                  }}>
                    {category.icon}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{translateEntityName(category.name, 'category')}</h3>
                </div>
                <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)' }}>
                  <button onClick={onEditTarget} style={{ background: 'none', border: 'none', color: goal.color || 'var(--accent-secondary)', cursor: 'pointer' }}><Edit2 size={18} /></button>
                  <button onClick={() => setShowDeleteConfirm(true)} style={{ background: 'none', border: 'none', color: goal.color || 'var(--accent-secondary)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', marginBottom: '12px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{formatMoney(targetAmount)}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{percent}%</div>
              </div>

              <div style={{ width: '100%', height: '12px', borderRadius: '6px', background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ height: '100%', width: `${percent}%`, background: barColor, borderRadius: '6px', transition: 'width 0.4s ease' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>{formatMoney(currentAmount)} {goal.goal_type === 'budget' ? t('spent') : t('saved')}</span>
                <span>{formatMoney(Math.max(0, targetAmount - currentAmount))} {goal.goal_type === 'budget' ? t('toSpend') : t('toSave')}</span>
              </div>
            </div>

            {/* Transactions List */}
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>{t('recentTransactions')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categoryTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-tertiary)' }}>
                  {t('noTransactionsForCategory')}
                </div>
              ) : (
                categoryTransactions.map(tx => (
                  <TransactionItem
                    key={tx.id}
                    tx={tx}
                    showChevron={true}
                    onClick={() => setEditingTransaction(tx)}
                  />
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <DoubleConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onRemoveCategory();
          setShowDeleteConfirm(false);
          onClose(); // Cerrar también este modal después de borrar
        }}
        titleStep1={t('removeCategoryTitle')}
        descStep1={t('removeCategoryDesc1')}
        titleStep2={t('deleteTransactionConfirmTitle')}
        descStep2={t('removeCategoryDesc2')}
      />

      {/* Edición de Transacción */}
      {editingTransaction && (
        <TransactionModal
          open={true}
          onClose={() => setEditingTransaction(null)}
          editTransaction={editingTransaction}
        />
      )}
    </AnimatePresence>
  );
}
