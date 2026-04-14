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
import { useLocaleCurrency } from '../contexts/LocaleCurrencyContext';
import { useAuthContext } from '../contexts/AuthContext';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

type FlowTab = 'expense' | 'income';

/**
 * Modal central para la creación y edición de transacciones.
 *
 * Este componente es el núcleo de la entrada de datos de la aplicación.
 * Implementa:
 * - Un teclado numérico personalizado (NumPad) para una entrada táctil fluida.
 * - Validación avanzada con feedback visual (animación de vibración/shake).
 * - Selección dinámica de cuentas y categorías basadas en el contexto (Personal vs Compartido).
 * - Soporte para edición y eliminación de registros existentes.
 */
export default function TransactionModal({ open, onClose, editTransaction }: TransactionModalProps) {
  // Hooks de datos para poblar los selectores
  const { categories: personalCats, addCategory } = useCategories('personal');
  const { categories: sharedCats } = useCategories('shared');
  const { accounts } = useAccounts();
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactions('all');
  const { couple } = useCouple();
  const { formatMoney, prefetchRates, locale, t } = useLocaleCurrency();
  const { user } = useAuthContext();

  // Read-only mode: editing a partner's shared transaction with read_only permission
  const isReadOnly = !!(editTransaction && editTransaction.type === 'shared'
    && editTransaction.user_id !== user?.id
    && couple?.shared_permission === 'read_only');

  // Estados del formulario
  const [flowTab, setFlowTab] = useState<FlowTab>('expense');
  const [txType, setTxType] = useState<TransactionType>('personal');
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  /** IDs de campos con errores para disparar animaciones de CSS (shake) */
  const [errors, setErrors] = useState<string[]>([]);

  const [showCategories, setShowCategories] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  const dateRef = useRef<HTMLInputElement>(null);
  const openDatePicker = () => {
    const input = dateRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  };

  // Filtrado de lógica de negocio: solo mostrar lo relevante al tipo de transacción
  const categories = txType === 'shared' ? sharedCats : personalCats;
  const filteredAccounts = accounts.filter(acc =>
    txType === 'shared' ? acc.scope === 'shared' : (acc.scope === 'personal' || !acc.scope)
  );

  /** Inicialización del formulario en modo edición o creación */
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

  /**
   * Lógica del Teclado Numérico (NumPad).
   * Gestiona decimales y formateo en tiempo real.
   */
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
        // Evita más de 2 decimales para precisión monetaria
        const dotIndex = prev.indexOf('.');
        if (dotIndex !== -1 && prev.length - dotIndex > 2) return prev;
        return prev + key;
      });
    }
  };

  /**
   * Validación y Persistencia.
   * Aplica lógica de signos basándose en 'Ingreso' o 'Gasto'.
   */
  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);

    // Validación de campos obligatorios
    const newErrors: string[] = [];
    if (numAmount <= 0 || isNaN(numAmount)) newErrors.push('amount');
    if (!selectedAccount) newErrors.push('account');
    if (!selectedCategory) newErrors.push('category');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      // Feedback háptico nativo para dispositivos compatibles
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200]);
      }

      // Resetear estado de error para permitir re-trigger de animaciones
      setTimeout(() => setErrors([]), 600);
      return;
    }

    setSubmitting(true);
    // Aplicar signo basado en la pestaña activa
    const finalAmount = flowTab === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

    let error;
    if (editTransaction) {
      error = await updateTransaction(editTransaction.id, {
        type: txType,
        amount: finalAmount,
        description: description || selectedCategory!.name,
        date,
        category_id: selectedCategory!.id,
        account_id: selectedAccount!.id,
        couple_id: txType === 'shared' ? couple?.id : undefined,
      });
    } else {
      error = await addTransaction({
        type: txType,
        amount: finalAmount,
        description: description || selectedCategory!.name,
        date,
        category_id: selectedCategory!.id,
        account_id: selectedAccount!.id,
        couple_id: txType === 'shared' ? couple?.id : undefined,
      });
    }

    setSubmitting(false);
    if (!error) handleClose();
  };

  const handleDelete = async () => {
    if (!editTransaction) return;
    if (!window.confirm(`${t('deleteMovement')}?`)) return;
    setSubmitting(true);
    await deleteTransaction(editTransaction.id);
    setSubmitting(false);
    handleClose();
  };

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const displayAmount = () => {
    const num = parseFloat(amount);
    if (isNaN(num)) return formatMoney(0);
    if (amount.includes('.')) {
      return formatMoney(parseFloat(amount));
    }
    return formatMoney(num);
  };

  useEffect(() => {
    void prefetchRates([date]);
  }, [date, prefetchRates]);

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
          {/* Cabecera y selectores de flujo */}
          <div className="kebo-header">
            <button className="kebo-close" onClick={handleClose}>
              <X size={22} />
            </button>

            <div className="kebo-tabs">
              <button
                className={`kebo-tab ${flowTab === 'expense' ? 'active' : ''}`}
                onClick={() => setFlowTab('expense')}
              >
                {t('expenseTab')}
              </button>
              <button
                className={`kebo-tab ${flowTab === 'income' ? 'active' : ''}`}
                onClick={() => setFlowTab('income')}
              >
                {t('incomeTab')}
              </button>
            </div>

            <div className="kebo-type-toggle">
              <button
                className={`kebo-type-btn ${txType === 'personal' ? 'active' : ''}`}
                onClick={() => { setTxType('personal'); setSelectedCategory(null); setSelectedAccount(null); }}
              >
                💰 {t('personalLabel')}
              </button>
              <button
                className={`kebo-type-btn ${txType === 'shared' ? 'active' : ''}`}
                onClick={() => { setTxType('shared'); setSelectedCategory(null); setSelectedAccount(null); }}
              >
                👥 {t('sharedLabelLong')}
              </button>
            </div>
          </div>

          {/* Visualización del importe con animación de vibración en error */}
          <div className="kebo-amount-display">
            <span className={`kebo-amount ${flowTab === 'expense' ? 'expense' : 'income'} ${errors.includes('amount') ? 'shake' : ''}`}>
              {displayAmount()}
            </span>
          </div>

          {/* Read-only notice for partner's shared transactions */}
          {isReadOnly && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
              background: 'rgba(251, 191, 36, 0.12)', borderRadius: 'var(--radius-md)',
              margin: '0 16px', fontSize: '0.8rem', color: '#F59E0B', fontWeight: 500
            }}>
              🔒 {t('readOnlyNotice')}
            </div>
          )}

          {/* Campos de entrada tipo cápsula */}
          <div className="kebo-capsules">
            <div className="kebo-capsule" onClick={() => {
              const input = document.getElementById('kebo-note-input');
              input?.focus();
            }}>
              <FileText size={18} className="kebo-capsule-icon" />
              <input
                id="kebo-note-input"
                className="kebo-capsule-input"
                placeholder={t('optionalNote')}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className={`kebo-capsule ${errors.includes('account') ? 'shake' : ''}`} onClick={() => setShowAccounts(true)}>
              <span className="kebo-capsule-emoji">
                {selectedAccount ? selectedAccount.icon : '🏦'}
              </span>
              <span className="kebo-capsule-text">
                {selectedAccount ? selectedAccount.name : t('selectAccount')}
              </span>
              {selectedAccount && (
                <span className="kebo-capsule-badge">
                  {formatMoney(selectedAccount.balance)}
                </span>
              )}
              <ChevronRight size={16} className="kebo-capsule-chevron" />
            </div>

            <div className="kebo-capsule-row">
              <div
                className="kebo-capsule kebo-capsule-half"
                onClick={openDatePicker}
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
              <div className={`kebo-capsule kebo-capsule-half ${errors.includes('category') ? 'shake' : ''}`} onClick={() => setShowCategories(true)}>
                <span className="kebo-capsule-emoji">
                  {selectedCategory ? selectedCategory.icon : '📁'}
                </span>
                <span className="kebo-capsule-text">
                  {selectedCategory ? selectedCategory.name : t('category')}
                </span>
              </div>
            </div>
          </div>

          {/* Teclado numérico y confirmación */}
          <div className="kebo-numpad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'backspace'].map(key => (
              <button
                key={key}
                className={`kebo-numpad-key ${key === 'backspace' ? 'kebo-key-icon' : ''}`}
                onClick={() => handleNumPad(key)}
                disabled={isReadOnly}
              >
                {key === 'backspace' ? <Delete size={22} /> : key}
              </button>
            ))}
            <button
              className={`kebo-numpad-submit ${(submitting || isReadOnly) ? 'disabled' : ''}`}
              onClick={handleSubmit}
              disabled={submitting || isReadOnly}
            >
              ✓
            </button>
          </div>

          {/* Acción secundaria de eliminación */}
          {editTransaction && !isReadOnly && (
            <button className="kebo-delete-btn" onClick={handleDelete} disabled={submitting}>
              {t('deleteMovement')}
            </button>
          )}
        </motion.div>

        {/* Selectores de nivel inferior (Sheets) */}
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

