import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, Calendar, FileText, Delete } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCategories } from '../hooks/useCategories';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useCouple } from '../hooks/useCouple';
import type { Transaction, TransactionType, Category, Account } from '../types/database';
import CategorySelector from './CategorySelector';
import AccountSelector from './AccountSelector';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

type FlowTab = 'expense' | 'income';

export default function TransactionModal({ open, onClose, editTransaction }: TransactionModalProps) {
  const { categories: personalCats, addCategory } = useCategories('personal');
  const { categories: sharedCats } = useCategories('shared');
  const { accounts } = useAccounts();
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactions('all');
  const { couple } = useCouple();

  // Form state
  const [flowTab, setFlowTab] = useState<FlowTab>('expense');
  const [txType, setTxType] = useState<TransactionType>('personal');
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Sub-sheet state
  const [showCategories, setShowCategories] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  const dateRef = useRef<HTMLInputElement>(null);

  const categories = txType === 'shared' ? sharedCats : personalCats;

  const filteredAccounts = accounts.filter(acc =>
    txType === 'shared' ? acc.scope === 'shared' : (acc.scope === 'personal' || !acc.scope)
  );

  // Pre-fill when editing
  useEffect(() => {
    if (editTransaction) {
      setFlowTab(editTransaction.amount >= 0 ? 'income' : 'expense');
      setTxType(editTransaction.type);
      setAmount(Math.abs(editTransaction.amount).toString());
      setDescription(editTransaction.description);
      setDate(new Date(editTransaction.date).toISOString().split('T')[0]);
      if (editTransaction.category) setSelectedCategory(editTransaction.category);
      if (editTransaction.account) setSelectedAccount(editTransaction.account);
    } else {
      resetForm();
    }
  }, [editTransaction, open]);

  const resetForm = () => {
    setFlowTab('expense');
    setTxType('personal');
    setAmount('0');
    setDescription('');
    setSelectedCategory(null);
    setSelectedAccount(null);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // NumPad logic
  const handleNumPad = (key: string) => {
    if (key === 'backspace') {
      setAmount(prev => {
        const next = prev.slice(0, -1);
        return next === '' ? '0' : next;
      });
    } else if (key === ',') {
      if (!amount.includes('.')) {
        setAmount(prev => prev + '.');
      }
    } else {
      setAmount(prev => {
        if (prev === '0') return key;
        // Max 2 decimal places
        const dotIndex = prev.indexOf('.');
        if (dotIndex !== -1 && prev.length - dotIndex > 2) return prev;
        return prev + key;
      });
    }
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || isNaN(numAmount)) return;
    if (!selectedAccount) { return; }
    if (!selectedCategory) { return; }

    setSubmitting(true);
    const finalAmount = flowTab === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

    let error;
    if (editTransaction) {
      error = await updateTransaction(editTransaction.id, {
        type: txType,
        amount: finalAmount,
        description: description || selectedCategory.name,
        date,
        category_id: selectedCategory.id,
        account_id: selectedAccount.id,
        couple_id: txType === 'shared' ? couple?.id : undefined,
      });
    } else {
      error = await addTransaction({
        type: txType,
        amount: finalAmount,
        description: description || selectedCategory.name,
        date,
        category_id: selectedCategory.id,
        account_id: selectedAccount.id,
        couple_id: txType === 'shared' ? couple?.id : undefined,
      });
    }

    setSubmitting(false);
    if (!error) handleClose();
  };

  const handleDelete = async () => {
    if (!editTransaction) return;
    if (!window.confirm('¿Eliminar esta transacción?')) return;
    setSubmitting(true);
    await deleteTransaction(editTransaction.id);
    setSubmitting(false);
    handleClose();
  };

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const displayAmount = () => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '€ 0';
    if (amount.includes('.')) {
      return `€ ${amount.replace('.', ',')}`;
    }
    return `€ ${num.toLocaleString('es-ES')}`;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="kebo-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="kebo-modal"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div className="kebo-header">
            <button className="kebo-close" onClick={handleClose}>
              <X size={22} />
            </button>

            {/* Flow Tabs */}
            <div className="kebo-tabs">
              <button
                className={`kebo-tab ${flowTab === 'expense' ? 'active' : ''}`}
                onClick={() => setFlowTab('expense')}
              >
                Gasto
              </button>
              <button
                className={`kebo-tab ${flowTab === 'income' ? 'active' : ''}`}
                onClick={() => setFlowTab('income')}
              >
                Ingreso
              </button>
            </div>

            {/* Type sub-toggle */}
            <div className="kebo-type-toggle">
              <button
                className={`kebo-type-btn ${txType === 'personal' ? 'active' : ''}`}
                onClick={() => { setTxType('personal'); setSelectedCategory(null); setSelectedAccount(null); }}
              >
                💰 Personal
              </button>
              <button
                className={`kebo-type-btn ${txType === 'shared' ? 'active' : ''}`}
                onClick={() => { setTxType('shared'); setSelectedCategory(null); setSelectedAccount(null); }}
              >
                👥 Compartido
              </button>
            </div>
          </div>

          {/* Amount Display */}
          <div className="kebo-amount-display">
            <span className={`kebo-amount ${flowTab === 'expense' ? 'expense' : 'income'}`}>
              {displayAmount()}
            </span>
          </div>

          {/* Capsule Inputs */}
          <div className="kebo-capsules">
            <div className="kebo-capsule" onClick={() => {
              const input = document.getElementById('kebo-note-input');
              input?.focus();
            }}>
              <FileText size={18} className="kebo-capsule-icon" />
              <input
                id="kebo-note-input"
                className="kebo-capsule-input"
                placeholder="Nota"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="kebo-capsule" onClick={() => setShowAccounts(true)}>
              <span className="kebo-capsule-emoji">
                {selectedAccount ? selectedAccount.icon : '🏦'}
              </span>
              <span className="kebo-capsule-text">
                {selectedAccount ? selectedAccount.name : 'Cuenta:'}
              </span>
              {selectedAccount && (
                <span className="kebo-capsule-badge">
                  €{selectedAccount.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              )}
              <ChevronRight size={16} className="kebo-capsule-chevron" />
            </div>

            <div className="kebo-capsule-row">
              <div
                className="kebo-capsule kebo-capsule-half"
                onClick={() => dateRef.current?.showPicker?.()}
              >
                <Calendar size={18} className="kebo-capsule-icon" />
                <span className="kebo-capsule-text">{formatDate(date)}</span>
                <input
                  ref={dateRef}
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="kebo-date-hidden"
                />
              </div>
              <div className="kebo-capsule kebo-capsule-half" onClick={() => setShowCategories(true)}>
                <span className="kebo-capsule-emoji">
                  {selectedCategory ? selectedCategory.icon : '📁'}
                </span>
                <span className="kebo-capsule-text">
                  {selectedCategory ? selectedCategory.name : 'Categoría:'}
                </span>
              </div>
            </div>
          </div>

          {/* NumPad */}
          <div className="kebo-numpad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'backspace'].map(key => (
              <button
                key={key}
                className={`kebo-numpad-key ${key === 'backspace' ? 'kebo-key-icon' : ''}`}
                onClick={() => handleNumPad(key)}
              >
                {key === 'backspace' ? <Delete size={22} /> : key}
              </button>
            ))}
            <button
              className={`kebo-numpad-submit ${submitting ? 'disabled' : ''}`}
              onClick={handleSubmit}
              disabled={submitting}
            >
              ✓
            </button>
          </div>

          {/* Delete button if editing */}
          {editTransaction && (
            <button className="kebo-delete-btn" onClick={handleDelete} disabled={submitting}>
              Eliminar transacción
            </button>
          )}
        </motion.div>

        {/* Sub-sheets */}
        <CategorySelector
          open={showCategories}
          onClose={() => setShowCategories(false)}
          categories={categories}
          selected={selectedCategory}
          onSelect={(cat: Category) => { setSelectedCategory(cat); setShowCategories(false); }}
          onAddCategory={addCategory}
        />

        <AccountSelector
          open={showAccounts}
          onClose={() => setShowAccounts(false)}
          accounts={filteredAccounts}
          selected={selectedAccount}
          onSelect={(acc: Account) => { setSelectedAccount(acc); setShowAccounts(false); }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
