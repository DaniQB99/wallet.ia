import { useState, useEffect, useRef } from 'react';
import { X, Check, Delete, Edit3, Calendar, RefreshCw, FolderOpen, ArrowLeft, Landmark, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transaction } from '../../../shared/types/database';
import { useTransactions } from '../../../entities/transactions/model/useTransactions';
import { useCategories } from '../../../entities/categories/model/useCategories';
import { useAccounts } from '../../../entities/accounts/model/useAccounts';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import AccountsSettings from '../../settings/ui/AccountsSettings';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
  initialFlowType?: 'expense' | 'income' | 'transfer';
}

export default function TransactionModal({ open, onClose, editTransaction, initialFlowType }: TransactionModalProps) {
  // Services
  const { currency } = useLocaleCurrency();
  const { addTransaction, addRecurringTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { categories: personalCategories } = useCategories('personal');
  const { categories: sharedCategories } = useCategories('shared');

  // Core State
  const [flowType, setFlowType] = useState<'expense' | 'income' | 'transfer'>(initialFlowType || 'expense');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [description, setDescription] = useState<string>('');
  const [scope, setScope] = useState<'personal' | 'shared'>('personal');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Navigation State
  const [view, setView] = useState<'main' | 'account' | 'destination' | 'category' | 'recurring'>('main');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [shakeField, setShakeField] = useState<'amount' | 'account' | 'destination' | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const activeCategories = scope === 'shared' ? sharedCategories : personalCategories;
  const descriptionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editTransaction) {
        setAmountStr(Math.abs(editTransaction.amount).toString().replace('.', ','));
        setFlowType(
          editTransaction.transfer_group_id ? 'transfer' :
            editTransaction.amount < 0 ? 'expense' : 'income'
        );
        setDescription(editTransaction.description || '');
        setAccountId(editTransaction.account_id || '');
        setScope(editTransaction.type as 'personal' | 'shared');
        setCategoryId(editTransaction.category_id || '');
        setDate(editTransaction.date.split('T')[0]);
      } else {
        setAmountStr('0');
        setFlowType(initialFlowType || 'expense');
        setDescription('');
        setAccountId(accounts.length > 0 ? accounts[0].id : '');
        setScope(accounts.length > 0 ? (accounts[0].scope as 'personal' | 'shared') : 'personal');
        setDestinationAccountId('');
        setCategoryId('');
        setDate(new Date().toISOString().split('T')[0]);
        setIsRecurring(false);
        setInterval('monthly');
      }
      setView('main');
    }
  }, [editTransaction, open, accounts.length, initialFlowType]);

  useEffect(() => {
    if (categoryId) {
      const exists = activeCategories.some((c) => c.id === categoryId);
      if (!exists) setCategoryId('');
    }
  }, [scope, activeCategories, categoryId]);

  if (!open) return null;

  // Keypad Handlers
  const handleKeypad = (val: string) => {
    if (val === 'backspace') {
      setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (val === ',') {
      if (!amountStr.includes(',')) {
        setAmountStr(prev => prev + ',');
      }
    } else {
      setAmountStr(prev => prev === '0' ? val : prev + val);
    }
  };

  const parseAmount = (str: string) => parseFloat(str.replace(',', '.'));

  const handleDelete = async () => {
    if (!editTransaction) return;
    if (window.confirm('¿Seguro que deseas eliminar esta transacción?')) {
      setSubmitting(true);
      try {
        const err = await deleteTransaction(editTransaction.id);
        if (err) throw err;
        onClose();
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSubmit = async () => {
    const triggerShake = (field: 'amount' | 'account' | 'destination') => {
      setShakeField(field);
      setTimeout(() => setShakeField(null), 500);
    };

    const numAmount = parseAmount(amountStr);
    if (isNaN(numAmount) || numAmount <= 0) {
      triggerShake('amount');
      return;
    }
    if (!accountId) {
      triggerShake('account');
      return;
    }

    setSubmitting(true);

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
        if (isRecurring) {
          const err = await addRecurringTransaction({
            amount: finalAmount,
            description: description.trim(),
            category_id: flowType === 'transfer' ? null : (categoryId || null),
            account_id: accountId || null,
            destination_account_id: flowType === 'transfer' ? destinationAccountId : null,
            type: scope,
            interval,
            start_date: date,
            end_date: null,
            next_process_date: date,
          });
          if (err) throw err;
        } else if (flowType === 'transfer') {
          if (!destinationAccountId) {
            triggerShake('destination');
            setSubmitting(false);
            return;
          }
          const t_group_id = crypto.randomUUID();
          const err = await addTransaction([
            {
              amount: -Math.abs(numAmount),
              description: description.trim(),
              account_id: accountId,
              type: scope,
              date,
              currency: currency || 'EUR',
              transfer_group_id: t_group_id
            },
            {
              amount: Math.abs(numAmount),
              description: description.trim(),
              account_id: destinationAccountId,
              type: scope,
              date,
              currency: currency || 'EUR',
              transfer_group_id: t_group_id
            }
          ]);
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
      }
      onClose();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccountSelect = (id: string, newScope: 'personal' | 'shared') => {
    if (view === 'destination') {
      setDestinationAccountId(id);
    } else {
      setAccountId(id);
      setScope(newScope);
    }
    setView('main');
  };

  const formatCurrencyLocal = (val: number) => {
    return new Intl.NumberFormat('es', { style: 'currency', currency: currency || 'EUR' }).format(val);
  };

  const formatCurrencyDisplay = () => {
    const symbol = new Intl.NumberFormat('es', { style: 'currency', currency: currency || 'EUR' }).formatToParts(0).find(x => x.type === 'currency')?.value || '€';
    return `${symbol} ${amountStr}`;
  };

  const formatDateDisplay = (d: string) => {
    try {
      const parsed = new Date(d);
      const userTimezoneOffset = parsed.getTimezoneOffset() * 60000;
      const localDate = new Date(parsed.getTime() + userTimezoneOffset);
      const parts = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(localDate);
      return parts.charAt(0).toUpperCase() + parts.slice(1);
    } catch {
      return d;
    }
  };

  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedDestAccount = accounts.find(a => a.id === destinationAccountId);
  const selectedCategory = activeCategories.find(c => c.id === categoryId);

  // Components: Keypad
  const renderKeypad = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: 'auto', paddingBottom: '10px' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button key={n} type="button" onClick={() => handleKeypad(n.toString())}
          style={{ background: '#2C2C2E', border: 'none', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '1.5rem', fontWeight: 500, cursor: 'pointer' }}>
          {n}
        </button>
      ))}
      <button type="button" onClick={() => handleKeypad(',')}
        style={{ background: '#2C2C2E', border: 'none', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '1.5rem', fontWeight: 500, cursor: 'pointer' }}>
        ,
      </button>
      <button type="button" onClick={() => handleKeypad('0')}
        style={{ background: '#2C2C2E', border: 'none', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '1.5rem', fontWeight: 500, cursor: 'pointer' }}>
        0
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button type="button" onClick={() => handleKeypad('backspace')}
          style={{ background: '#2C2C2E', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
          <Delete size={22} />
        </button>
        <button type="button" onClick={handleSubmit} disabled={submitting}
          style={{ background: '#6366F1', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
          <Check size={26} />
        </button>
      </div>
    </div>
  );

  const pillStyle = {
    background: '#1C1C1E',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '16px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const
  };

  const renderMainView = () => (
    <motion.div
      initial={{ x: 0 }} animate={{ x: 0 }} exit={{ x: -50, opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
          <X size={24} />
        </button>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#8E8E93', fontWeight: 500 }}>
          <div onClick={() => setFlowType('expense')} style={{ cursor: 'pointer', color: flowType === 'expense' ? '#fff' : '#8E8E93', position: 'relative', paddingBottom: '4px' }}>
            Gasto
            {flowType === 'expense' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '20px', height: '3px', background: '#6366F1', borderRadius: '2px' }} />}
          </div>
          <div onClick={() => setFlowType('income')} style={{ cursor: 'pointer', color: flowType === 'income' ? '#fff' : '#8E8E93', position: 'relative', paddingBottom: '4px' }}>
            Ingreso
            {flowType === 'income' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '20px', height: '3px', background: '#6366F1', borderRadius: '2px' }} />}
          </div>
          <div onClick={() => setFlowType('transfer')} style={{ cursor: 'pointer', color: flowType === 'transfer' ? '#fff' : '#8E8E93', position: 'relative', paddingBottom: '4px' }}>
            Transferencia
            {flowType === 'transfer' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '20px', height: '3px', background: '#6366F1', borderRadius: '2px' }} />}
          </div>
        </div>
        {editTransaction ? (
          <button type="button" onClick={handleDelete} disabled={submitting} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
            <Trash2 size={24} />
          </button>
        ) : (
          <div style={{ width: '40px' }} />
        )}
      </div>

      <motion.div
        animate={shakeField === 'amount' ? { x: [-10, 10, -10, 10, 0], color: ['#fff', '#ef4444', '#fff'] } : {}}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', margin: '40px 0', fontSize: '3.5rem', fontWeight: 400, color: '#fff' }}
      >
        {formatCurrencyDisplay()}
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <div style={{ ...pillStyle, padding: '0 16px', cursor: 'text' }} onClick={() => descriptionRef.current?.focus()}>
          <Edit3 size={18} color="#8E8E93" />
          <input
            ref={descriptionRef}
            type="text"
            placeholder="Nota"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.95rem', width: '100%', outline: 'none', padding: '16px 0' }}
          />
        </div>

        <motion.button
          type="button"
          style={pillStyle}
          onClick={() => setView('account')}
          animate={shakeField === 'account' ? { x: [-10, 10, -10, 10, 0], borderColor: ['rgba(255,255,255,0.05)', '#ef4444', 'rgba(255,255,255,0.05)'] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Landmark size={18} color="#6366F1" />
          {selectedAccount ? `${selectedAccount.icon} ${selectedAccount.name}` : 'Seleccionar cuenta'}
        </motion.button>

        {flowType === 'transfer' && (
          <motion.button
            type="button"
            style={pillStyle}
            onClick={() => setView('destination')}
            animate={shakeField === 'destination' ? { x: [-10, 10, -10, 10, 0], borderColor: ['rgba(255,255,255,0.05)', '#ef4444', 'rgba(255,255,255,0.05)'] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Landmark size={18} color="#6366F1" />
            {selectedDestAccount ? `${selectedDestAccount.icon} ${selectedDestAccount.name}` : 'Cuenta destino'}
          </motion.button>
        )}

        {flowType !== 'transfer' && (
          <button type="button" style={pillStyle} onClick={() => setView('recurring')}>
            <RefreshCw size={18} color="#8E8E93" />
            {isRecurring ? `Repetir: ${interval === 'daily' ? 'Diaria' : interval === 'weekly' ? 'Semanal' : interval === 'monthly' ? 'Mensual' : 'Anual'}` : 'Nunca'}
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: flowType === 'transfer' ? '1fr' : '1fr 1fr', gap: '8px' }}>
          <div style={{ ...pillStyle, padding: '0 16px', position: 'relative' }}>
            <Calendar size={18} color="#8E8E93" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
            <span style={{ padding: '16px 0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{formatDateDisplay(date)}</span>
          </div>

          {flowType !== 'transfer' && (
            <button type="button" style={pillStyle} onClick={() => setView('category')}>
              <FolderOpen size={18} color="#8E8E93" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : 'Entradas'}
              </span>
            </button>
          )}
        </div>
      </div>

      {renderKeypad()}
    </motion.div>
  );

  const renderAccountList = (isDestination: boolean) => (
    <motion.div
      initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button type="button" onClick={() => setView('main')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
          <X size={24} />
        </button>
        <h2 style={{ margin: '0 auto', fontSize: '1.1rem', fontWeight: 600, transform: 'translateX(-16px)' }}>
          {isDestination ? 'Cuenta Destino' : 'Cuenta'}
        </h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {accounts.filter(acc => !isDestination || acc.id !== accountId).map(acc => (
          <button
            key={acc.id}
            type="button"
            onClick={() => handleAccountSelect(acc.id, acc.scope as 'personal' | 'shared')}
            style={{
              background: '#1C1C1E',
              border: `1px solid ${(isDestination ? destinationAccountId === acc.id : accountId === acc.id) ? '#6366F1' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '20px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: '#fff',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                {acc.icon}
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '4px' }}>{acc.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#8E8E93' }}>Balance : {formatCurrencyLocal(acc.balance || 0)}</div>
              </div>
            </div>
            <ArrowLeft size={16} color="#6366F1" style={{ transform: 'rotate(180deg)' }} />
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 0', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={() => setShowAddAccount(true)}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '24px',
            border: '1px solid #6366F1',
            background: 'transparent',
            color: '#6366F1',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Agregar cuenta
        </button>
      </div>
    </motion.div>
  );

  const renderCategoryList = () => (
    <motion.div
      initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button type="button" onClick={() => setView('main')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: '0 auto', fontSize: '1.1rem', fontWeight: 600, transform: 'translateX(-16px)' }}>Categoría</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          onClick={() => { setCategoryId(''); setView('main'); }}
          style={{ ...pillStyle, border: categoryId === '' ? '1px solid #6366F1' : pillStyle.border }}
        >
          <FolderOpen size={18} color="#8E8E93" /> Sin categoría
        </button>
        {activeCategories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => { setCategoryId(cat.id); setView('main'); }}
            style={{ ...pillStyle, border: categoryId === cat.id ? '1px solid #6366F1' : pillStyle.border }}
          >
            <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span> {cat.name}
          </button>
        ))}
      </div>
    </motion.div>
  );

  const renderRecurringList = () => (
    <motion.div
      initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button type="button" onClick={() => setView('main')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: '0 auto', fontSize: '1.1rem', fontWeight: 600, transform: 'translateX(-16px)' }}>Frecuencia</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button type="button" onClick={() => { setIsRecurring(false); setView('main'); }} style={{ ...pillStyle, border: !isRecurring ? '1px solid #6366F1' : pillStyle.border }}>
          Nunca
        </button>
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(inv => (
          <button key={inv} type="button" onClick={() => { setIsRecurring(true); setInterval(inv); setView('main'); }} style={{ ...pillStyle, border: isRecurring && interval === inv ? '1px solid #6366F1' : pillStyle.border }}>
            {inv === 'daily' ? 'Diaria' : inv === 'weekly' ? 'Semanal' : inv === 'monthly' ? 'Mensual' : 'Anual'}
          </button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: '#000',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            padding: '64px 20px 24px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          }}
        >
          {view === 'main' && renderMainView()}
          {view === 'account' && renderAccountList(false)}
          {view === 'destination' && renderAccountList(true)}
          {view === 'category' && renderCategoryList()}
          {view === 'recurring' && renderRecurringList()}
        </motion.div>
      </AnimatePresence>

      {/* Render Add Account overlay if requested */}
      {showAddAccount && <AccountsSettings onClose={() => setShowAddAccount(false)} />}
    </>
  );
}
