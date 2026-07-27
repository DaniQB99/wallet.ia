import { useState, useEffect, useId } from 'react';
import { X, Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transaction } from '../../../shared/types/database';
import { useTransactions } from '../../../entities/transactions/model/useTransactions';
import { useCategories } from '../../../entities/categories/model/useCategories';
import { useAccounts } from '../../../entities/accounts/model/useAccounts';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

/**
 * Modal interactivo para crear o editar transacciones (ingresos y gastos).
 * Permite seleccionar el tipo de flujo, monto, categoría, cuenta, alcance (personal/compartido) y fecha.
 */
export default function TransactionModal({ open, onClose, editTransaction }: TransactionModalProps) {
  const amountId = useId();
  const descriptionId = useId();
  const dateId = useId();
  const categoryIdAttr = useId();
  const accountIdAttr = useId();
  const scopeId = useId();

  const { t, currency } = useLocaleCurrency();
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactions();

  const [flowType, setFlowType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [scope, setScope] = useState<'personal' | 'shared'>('personal');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { categories: personalCategories } = useCategories('personal');
  const { categories: sharedCategories } = useCategories('shared');
  const { accounts } = useAccounts();

  const activeCategories = scope === 'shared' ? sharedCategories : personalCategories;

  useEffect(() => {
    if (editTransaction) {
      const isExpense = editTransaction.amount < 0;
      setFlowType(isExpense ? 'expense' : 'income');
      setAmount(String(Math.abs(editTransaction.amount)));
      setDescription(editTransaction.description || '');
      setScope((editTransaction.type as 'personal' | 'shared') || 'personal');
      setCategoryId(editTransaction.category_id || '');
      setAccountId(editTransaction.account_id || '');
      setDate(
        editTransaction.date
          ? new Date(editTransaction.date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
    } else {
      setFlowType('expense');
      setAmount('');
      setDescription('');
      setScope('personal');
      setCategoryId('');
      setAccountId('');
      setDate(new Date().toISOString().slice(0, 10));
    }
    setErrorMsg(null);
  }, [editTransaction, open]);

  // Si cambia la selección de scope y la categoría actual no pertenece al nuevo scope, resetearla
  useEffect(() => {
    if (categoryId) {
      const exists = activeCategories.some((c) => c.id === categoryId);
      if (!exists) setCategoryId('');
    }
  }, [scope, activeCategories, categoryId]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg(t('invalidAmount') || 'Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (!description.trim()) {
      setErrorMsg(t('invalidDescription') || 'Por favor ingresa una descripción');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const finalAmount = flowType === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

    try {
      if (editTransaction) {
        const err = await updateTransaction(editTransaction.id, {
          amount: finalAmount,
          description: description.trim(),
          category_id: categoryId || null,
          account_id: accountId || null,
          type: scope,
          date,
        });
        if (err) throw err;
      } else {
        const err = await addTransaction({
          amount: finalAmount,
          description: description.trim(),
          category_id: categoryId || null,
          account_id: accountId || null,
          type: scope,
          date,
          currency: currency || 'EUR',
        });
        if (err) throw err;
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar la transacción';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editTransaction) return;
    if (!window.confirm('¿Estás seguro de eliminar esta transacción?')) return;
    setSubmitting(true);
    try {
      const err = await deleteTransaction(editTransaction.id);
      if (err) throw err;
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar la transacción';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="modal-content animate-in"
          style={{ maxWidth: '520px', width: '100%', borderRadius: 'var(--radius-xl, 20px)' }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-header-left">
              <h2 className="modal-title">
                {editTransaction
                  ? t('editTransaction') || 'Editar transacción'
                  : t('addTransaction') || 'Nueva transacción'}
              </h2>
            </div>
            <button className="btn-icon" onClick={onClose} aria-label="Cerrar modal">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body">
            {errorMsg && (
              <div
                className="error-banner"
                style={{
                  background: 'var(--danger-bg, rgba(239, 68, 68, 0.12))',
                  color: 'var(--danger-color, #ef4444)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  marginBottom: '16px',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Toggle Tipo de Flujo: Gasto / Ingreso */}
            <div
              className="flow-toggle"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'var(--bg-tertiary, rgba(255,255,255,0.05))',
                padding: '4px',
                borderRadius: '14px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                className={`btn ${flowType === 'expense' ? 'active-expense' : ''}`}
                onClick={() => setFlowType('expense')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: flowType === 'expense' ? 'var(--danger-bg, rgba(239, 68, 68, 0.2))' : 'transparent',
                  color: flowType === 'expense' ? '#ef4444' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}
              >
                <ArrowDownCircle size={18} />
                {t('expense') || 'Gasto'}
              </button>
              <button
                type="button"
                className={`btn ${flowType === 'income' ? 'active-income' : ''}`}
                onClick={() => setFlowType('income')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: flowType === 'income' ? 'var(--success-bg, rgba(34, 197, 94, 0.2))' : 'transparent',
                  color: flowType === 'income' ? '#22c55e' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}
              >
                <ArrowUpCircle size={18} />
                {t('income') || 'Ingreso'}
              </button>
            </div>

            {/* Input de Monto */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor={amountId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>
                Monto
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id={amountId}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                    color: 'var(--text-primary)',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Input de Descripción */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor={descriptionId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>
                Descripción
              </label>
              <input
                id={descriptionId}
                type="text"
                placeholder="Ej. Supermercado, Sueldo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Selector de Alcance: Personal / Compartida */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor={scopeId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>
                Alcance
              </label>
              <select
                id={scopeId}
                value={scope}
                onChange={(e) => setScope(e.target.value as 'personal' | 'shared')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              >
                <option value="personal">{t('personal') || 'Personal'}</option>
                <option value="shared">{t('shared') || 'Compartida'}</option>
              </select>
            </div>

            {/* Grid 2 Columnas: Categoría y Cuenta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group">
                <label htmlFor={categoryIdAttr} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>
                  Categoría
                </label>
                <select
                  id={categoryIdAttr}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  <option value="">Sin categoría</option>
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor={accountIdAttr} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>
                  Cuenta
                </label>
                <select
                  id={accountIdAttr}
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  <option value="">Sin cuenta</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.icon ? `${acc.icon} ` : ''}{acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input de Fecha */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label htmlFor={dateId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>
                Fecha
              </label>
              <input
                id={dateId}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Acciones de Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: editTransaction ? 'space-between' : 'flex-end',
                gap: '12px',
                marginTop: '16px',
              }}
            >
              {editTransaction && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleDelete}
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'var(--bg-tertiary, rgba(255,255,255,0.08))',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: 'var(--accent-primary, #6366f1)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Guardando...' : editTransaction ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
