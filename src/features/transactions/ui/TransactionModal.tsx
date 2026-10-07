import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Calendar,
  RefreshCw,
  Trash2,
  Plus,
  Wallet,
  ArrowDownCircle,
  ArrowLeftRight,
  ChevronDown,
  Tag,
  Mic,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transaction } from '../../../shared/types/database';
import { useTransactions } from '../../../entities/transactions/model/useTransactions';
import { useCategories } from '../../../entities/categories/model/useCategories';
import { useAccounts } from '../../../entities/accounts/model/useAccounts';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import AccountsSettings from '../../settings/ui/AccountsSettings';
import CategoriesSettings from '../../settings/ui/CategoriesSettings';
import DoubleConfirmModal from '../../../shared/ui/DoubleConfirmModal';

// Helpers para manejo de fechas de calendario sin sesgo por zona horaria (UTC vs Local)
const toLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatYYYYMMDD = (year: number, monthZeroIndexed: number, day: number): string => {
  const m = String(monthZeroIndexed + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const parseLocalDateString = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const cleanStr = dateStr.split('T')[0];
  const [y, m, d] = cleanStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
};

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
  initialFlowType?: 'expense' | 'income' | 'transfer';
  initialAccountId?: string | null;
}

/**
 * TransactionModal.tsx
 * Modal de creación y edición de transacciones de alta gama (Liquid Glass).
 * Utiliza el teclado numérico nativo del dispositivo móvil (inputMode="decimal") con auto-focus
 * para desplegar el teclado propio del sistema operativo (iOS/Android), liberando espacio vertical,
 * eliminando teclados HTML redundantes, garantizando ajuste 100% responsivo en cualquier pantalla,
 * y manteniendo sub-vistas fluidas para cuentas, categorías, recurrencias y calendario personalizado.
 */
export default function TransactionModal({
  open,
  onClose,
  editTransaction,
  initialFlowType,
  initialAccountId,
}: TransactionModalProps) {
  // Servicios
  const { currency, t, formatMoney, formatDate, getCurrencySymbol, translateEntityName } = useLocaleCurrency();
  const { addTransaction, addRecurringTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { categories: personalCategories, deleteCategory: deletePersonalCategory } = useCategories('personal');
  const { categories: sharedCategories, deleteCategory: deleteSharedCategory } = useCategories('shared');

  // Estados principales
  const [flowType, setFlowType] = useState<'expense' | 'income' | 'transfer'>(initialFlowType || 'expense');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [description, setDescription] = useState<string>('');
  const [scope, setScope] = useState<'personal' | 'shared'>('personal');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(() => toLocalDateString());
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Navegación de vistas internas
  const [view, setView] = useState<'main' | 'account' | 'destination' | 'category' | 'recurring' | 'date'>('main');
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showCategoriesSettings, setShowCategoriesSettings] = useState(false);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [shakeField, setShakeField] = useState<'amount' | 'account' | 'destination' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const activeCategories = scope === 'shared' ? sharedCategories : personalCategories;
  const descriptionRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Inicialización y sincronización
  useEffect(() => {
    if (open) {
      setSubmitError(null);
      if (editTransaction) {
        setAmountStr(Math.abs(editTransaction.amount).toString().replace('.', ','));
        setFlowType(
          editTransaction.transfer_group_id ? 'transfer' :
            editTransaction.amount < 0 ? 'expense' : 'income'
        );
        setDescription(editTransaction.description || '');
        setAccountId(editTransaction.account_id || '');
        setScope((editTransaction.type as 'personal' | 'shared') || 'personal');
        setCategoryId(editTransaction.category_id || '');
        const txDate = editTransaction.date.split('T')[0];
        setDate(txDate);
        setCalendarViewDate(parseLocalDateString(txDate));
      } else {
        setAmountStr('0');
        setFlowType(initialFlowType || 'expense');
        setDescription('');
        const targetAcc =
          (initialAccountId ? accounts.find(a => a.id === initialAccountId) : null) ||
          (accounts.length > 0 ? accounts[0] : null);
        setAccountId(targetAcc ? targetAcc.id : '');
        setScope(targetAcc ? (targetAcc.scope as 'personal' | 'shared') : 'personal');
        setDestinationAccountId('');
        setCategoryId('');
        const todayStr = toLocalDateString();
        setDate(todayStr);
        setCalendarViewDate(new Date());
        setIsRecurring(false);
        setInterval('monthly');
      }
      setView('main');

      // Auto-focus para activar inmediatamente el teclado nativo del móvil
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setView('main');
      setShowCategoriesSettings(false);
      setIsEditingCategories(false);
      setCategoryToDelete(null);
      setShowDeleteConfirm(false);
      setShowAddAccount(false);
      setShakeField(null);
      setSubmitting(false);
      setIsListening(false);
    }
  }, [editTransaction, open, accounts.length, initialFlowType, initialAccountId]);

  // Si volvemos a la vista principal, asegurar foco en el importe
  useEffect(() => {
    if (open && view === 'main') {
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, view]);

  useEffect(() => {
    if (activeCategories.length > 0) {
      const exists = activeCategories.some((c) => c.id === categoryId);
      if (!exists && !categoryId) {
        setCategoryId(activeCategories[0].id);
      }
    }
  }, [scope, activeCategories, categoryId]);

  // Manejo de entrada de importe nativo
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace('.', ',');
    // Solo permitir números y una única coma
    val = val.replace(/[^0-9,]/g, '');
    const parts = val.split(',');
    if (parts.length > 2) {
      val = parts[0] + ',' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      val = parts[0] + ',' + parts[1].slice(0, 2);
    }
    if (val === '') {
      val = '0';
    } else if (val.length > 1 && val.startsWith('0') && !val.startsWith('0,')) {
      val = val.replace(/^0+/, '') || '0';
    }
    setAmountStr(val);
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const parseAmount = (str: string) => parseFloat(str.replace(',', '.'));

  const handleDelete = () => {
    if (!editTransaction) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!editTransaction) return;
    setSubmitting(true);
    try {
      const err = await deleteTransaction(editTransaction.id);
      if (err) throw err;
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCategoryDelete = async () => {
    if (!categoryToDelete) return;
    setSubmitting(true);
    try {
      const isPersonal = personalCategories.some(c => c.id === categoryToDelete);
      if (isPersonal) {
        await deletePersonalCategory(categoryToDelete);
      } else {
        await deleteSharedCategory(categoryToDelete);
      }
      setCategoryToDelete(null);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Enviar transacción
  const handleSubmit = async () => {
    const triggerShake = (field: 'amount' | 'account' | 'destination') => {
      setShakeField(field);
      setTimeout(() => setShakeField(null), 500);
    };

    const numAmount = parseAmount(amountStr);
    if (isNaN(numAmount) || numAmount <= 0) {
      triggerShake('amount');
      amountInputRef.current?.focus();
      return;
    }
    if (!accountId) {
      triggerShake('account');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const finalAmount = flowType === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

    try {
      if (editTransaction) {
        const err = await updateTransaction(editTransaction.id, {
          amount: finalAmount,
          base_amount: finalAmount,
          currency: editTransaction.currency || currency || 'EUR',
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
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || t('saveError') || 'Error al guardar');
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

  // Reconocimiento de voz para descripción
  const handleVoiceInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setDescription(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const formatDateDisplay = (d: string) => {
    try {
      const localDate = parseLocalDateString(d);
      const parts = formatDate(localDate, { weekday: 'short', day: 'numeric', month: 'short' });
      return parts.charAt(0).toUpperCase() + parts.slice(1);
    } catch {
      return d;
    }
  };

  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedDestAccount = accounts.find(a => a.id === destinationAccountId);
  const selectedCategory = activeCategories.find(c => c.id === categoryId);

  // Título modal centrado según flujo
  const getModalTitle = () => {
    if (editTransaction) {
      if (flowType === 'expense') return t('editExpense');
      if (flowType === 'income') return t('editIncome');
      return t('editTransfer');
    }
    if (flowType === 'expense') return t('newExpense');
    if (flowType === 'income') return t('newIncome');
    return t('newTransfer');
  };

  // Sub-vista: Calendario Liquid Glass Moderno
  const renderCalendarView = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const monthLabel = formatDate(calendarViewDate, { month: 'long', year: 'numeric' });
    const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    const prevMonth = () => {
      setCalendarViewDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
      setCalendarViewDate(new Date(year, month + 1, 1));
    };

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysPrevMonth = new Date(year, month, 0).getDate();

    const calendarCells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Días del mes previo
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = totalDaysPrevMonth - i;
      const prevDateObj = new Date(year, month - 1, d);
      calendarCells.push({
        day: d,
        isCurrentMonth: false,
        dateStr: formatYYYYMMDD(prevDateObj.getFullYear(), prevDateObj.getMonth(), prevDateObj.getDate()),
      });
    }

    // Días del mes actual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      calendarCells.push({
        day: d,
        isCurrentMonth: true,
        dateStr: formatYYYYMMDD(year, month, d),
      });
    }

    // Días del mes siguiente para completar la cuadrícula (múltiplos de 7)
    const remaining = (7 - (calendarCells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDateObj = new Date(year, month + 1, d);
      calendarCells.push({
        day: d,
        isCurrentMonth: false,
        dateStr: formatYYYYMMDD(nextDateObj.getFullYear(), nextDateObj.getMonth(), nextDateObj.getDate()),
      });
    }

    const todayStr = toLocalDateString(new Date());

    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yesterdayStr = toLocalDateString(yestDate);

    const tomDate = new Date();
    tomDate.setDate(tomDate.getDate() + 1);
    const tomorrowStr = toLocalDateString(tomDate);

    const handleSelectDay = (targetDateStr: string) => {
      setDate(targetDateStr);
      setView('main');
    };

    const weekDayLabels = [1, 2, 3, 4, 5, 6, 7].map(d => {
      // 2026-10-04 es domingo, 2026-10-05 es lunes
      const dayDate = new Date(2026, 9, 4 + d, 12, 0, 0);
      return formatDate(dayDate, { weekday: 'narrow' }).toUpperCase();
    });

    return (
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
      >
        <div className="modal-header" style={{ marginBottom: '12px' }}>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setView('main')}
            aria-label={t('back')}
          >
            <X size={20} />
          </button>
          <h2 className="modal-title">{t('selectDate')}</h2>
        </div>

        {/* Atajos rápidos: Ayer, Hoy, Mañana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
          <button
            type="button"
            onClick={() => handleSelectDay(yesterdayStr)}
            style={{
              padding: '8px 4px',
              borderRadius: '12px',
              border: date === yesterdayStr ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
              background: date === yesterdayStr ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
              color: date === yesterdayStr ? '#ffffff' : 'rgba(255,255,255,0.7)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {t('yesterday')}
          </button>
          <button
            type="button"
            onClick={() => handleSelectDay(todayStr)}
            style={{
              padding: '8px 4px',
              borderRadius: '12px',
              border: date === todayStr ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
              background: date === todayStr ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
              color: date === todayStr ? '#ffffff' : 'rgba(255,255,255,0.7)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {t('today')}
          </button>
          <button
            type="button"
            onClick={() => handleSelectDay(tomorrowStr)}
            style={{
              padding: '8px 4px',
              borderRadius: '12px',
              border: date === tomorrowStr ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
              background: date === tomorrowStr ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
              color: date === tomorrowStr ? '#ffffff' : 'rgba(255,255,255,0.7)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {t('tomorrow')}
          </button>
        </div>

        {/* Selector de Mes / Año */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '12px',
          }}
        >
          <button
            type="button"
            onClick={prevMonth}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={t('previousMonth')}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: '0.98rem', fontWeight: 600, color: '#ffffff' }}>
            {capitalizedMonthLabel}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={t('nextMonth')}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Días de la semana */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            marginBottom: '8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.45)',
          }}
        >
          {weekDayLabels.map((d, i) => (
            <div key={i} style={{ padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Cuadrícula de Días */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '16px',
          }}
        >
          {calendarCells.map((cell, idx) => {
            const isSelected = date === cell.dateStr;
            const isToday = cell.dateStr === todayStr;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectDay(cell.dateStr)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  border: isSelected
                    ? '1px solid var(--accent-primary)'
                    : isToday
                      ? '1px solid rgba(99, 102, 241, 0.4)'
                      : '1px solid transparent',
                  background: isSelected
                    ? 'var(--accent-primary)'
                    : isToday
                      ? 'rgba(99, 102, 241, 0.12)'
                      : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected
                    ? '#ffffff'
                    : cell.isCurrentMonth
                      ? '#ffffff'
                      : 'rgba(255, 255, 255, 0.25)',
                  fontSize: '0.9rem',
                  fontWeight: isSelected ? 700 : cell.isCurrentMonth ? 500 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
                }}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setView('main')}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '14px',
            background: 'var(--accent-primary)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            marginTop: 'auto',
            marginBottom: '10px',
          }}
        >
          {t('confirmDate')}
        </button>
      </motion.div>
    );
  };

  // Vista principal del modal
  const renderMainView = () => (
    <motion.div
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      exit={{ x: -40, opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', position: 'relative' }}
    >
      {/* Píldora sutil superior tipo tirador/handle */}
      <div
        style={{
          width: '38px',
          height: '4px',
          borderRadius: '2px',
          background: 'rgba(255, 255, 255, 0.2)',
          margin: '0 auto 10px auto',
          flexShrink: 0,
        }}
      />

      {/* Cabecera Estandarizada: Cerrar izquierda, Título centrado, Eliminar derecha si edita */}
      <div className="modal-header" style={{ marginBottom: '12px', position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label={t('close')}
        >
          <X size={20} />
        </button>
        <h2 className="modal-title" style={{ margin: '0 auto', fontSize: '1.05rem', fontWeight: 600 }}>
          {getModalTitle()}
        </h2>
        {editTransaction && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={t('delete')}
            title={t('delete')}
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Selector de Flujo (Pestañas estilo Imagen 2 - 100% responsivas en cuadrícula) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          width: '100%',
          marginBottom: '12px',
          flexShrink: 0,
        }}
      >
        {/* Pestaña Gasto */}
        <button
          type="button"
          onClick={() => {
            setFlowType('expense');
            amountInputRef.current?.focus();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 4px',
            borderRadius: '20px',
            border: flowType === 'expense' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
            background: flowType === 'expense' ? 'rgba(239, 68, 68, 0.14)' : 'rgba(255, 255, 255, 0.03)',
            color: flowType === 'expense' ? '#f87171' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.82rem',
            fontWeight: flowType === 'expense' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            width: '100%',
            minWidth: 0,
          }}
        >
          <Wallet size={15} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('expenseFlow')}
          </span>
        </button>

        {/* Pestaña Ingreso */}
        <button
          type="button"
          onClick={() => {
            setFlowType('income');
            amountInputRef.current?.focus();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 4px',
            borderRadius: '20px',
            border: flowType === 'income' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
            background: flowType === 'income' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.03)',
            color: flowType === 'income' ? '#34d399' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.82rem',
            fontWeight: flowType === 'income' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            width: '100%',
            minWidth: 0,
          }}
        >
          <ArrowDownCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('incomeFlow')}
          </span>
        </button>

        {/* Pestaña Transferencia */}
        <button
          type="button"
          onClick={() => {
            setFlowType('transfer');
            amountInputRef.current?.focus();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 4px',
            borderRadius: '20px',
            border: flowType === 'transfer' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
            background: flowType === 'transfer' ? 'rgba(99, 102, 241, 0.14)' : 'rgba(255, 255, 255, 0.03)',
            color: flowType === 'transfer' ? '#a5b4fc' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.82rem',
            fontWeight: flowType === 'transfer' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            width: '100%',
            minWidth: 0,
          }}
        >
          <ArrowLeftRight size={15} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('transferShort')}
          </span>
        </button>
      </div>

      {/* Visualización del Importe con Input Decimal Nativo */}
      <motion.div
        animate={shakeField === 'amount' ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '8px 0 16px 0',
          position: 'relative',
          cursor: 'text',
          flexShrink: 0,
        }}
        onClick={() => amountInputRef.current?.focus()}
      >
        <input
          ref={amountInputRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={amountStr}
          onChange={handleAmountChange}
          onKeyDown={handleAmountKeyDown}
          onFocus={(e) => {
            if (amountStr === '0') {
              e.target.select();
            }
          }}
          style={{
            fontSize: '3.4rem',
            fontWeight: 600,
            color: '#ffffff',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            textAlign: 'right',
            width: `${Math.max(amountStr.length * 2.1, 2.4)}rem`,
            maxWidth: '280px',
            padding: 0,
            fontFamily: 'inherit',
            caretColor:
              flowType === 'expense' ? '#ef4444' : flowType === 'income' ? '#10b981' : '#6366f1',
          }}
        />
        <span
          style={{
            fontSize: '2rem',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.75)',
            marginLeft: '8px',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {getCurrencySymbol()}
        </span>
      </motion.div>

      {/* Campos de Transacción con encabezados en mayúsculas estilo Imagen 2 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '14px',
          flexShrink: 0,
        }}
      >
        {/* SECCIÓN: CUENTA */}
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.45)',
              textTransform: 'uppercase',
              marginBottom: '5px',
            }}
          >
            {flowType === 'transfer'
              ? t('sourceAccountUpper')
              : t('accountUpper')}
          </div>

          <motion.div
            className="tx-field-card"
            style={{ padding: '10px 14px' }}
            onClick={() => setView('account')}
            animate={
              shakeField === 'account'
                ? { x: [-10, 10, -10, 10, 0], borderColor: ['rgba(255,255,255,0.08)', '#ef4444', 'rgba(255,255,255,0.08)'] }
                : {}
            }
            transition={{ duration: 0.4 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: selectedAccount?.color ? `${selectedAccount.color}25` : 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                }}
              >
                {selectedAccount?.icon || '🏦'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedAccount ? translateEntityName(selectedAccount.name, 'account') : t('selectAccount')}
                </span>
                <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  {t('balanceStr')}: {formatMoney(selectedAccount?.balance || 0)}
                </span>
              </div>
            </div>
            <ChevronDown size={18} color="rgba(255, 255, 255, 0.4)" style={{ flexShrink: 0 }} />
          </motion.div>
        </div>

        {/* SECCIÓN CONDICIONAL: CUENTA DESTINO */}
        {flowType === 'transfer' && (
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.45)',
                textTransform: 'uppercase',
                marginBottom: '5px',
              }}
            >
              {t('destinationAccountUpper')}
            </div>

            <motion.div
              className="tx-field-card"
              style={{ padding: '10px 14px' }}
              onClick={() => setView('destination')}
              animate={
                shakeField === 'destination'
                  ? { x: [-10, 10, -10, 10, 0], borderColor: ['rgba(255,255,255,0.08)', '#ef4444', 'rgba(255,255,255,0.08)'] }
                  : {}
            }
              transition={{ duration: 0.4 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: selectedDestAccount?.color ? `${selectedDestAccount.color}25` : 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  {selectedDestAccount?.icon || '🏦'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedDestAccount
                      ? translateEntityName(selectedDestAccount.name, 'account')
                      : t('selectAccount')}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {t('balanceStr')}: {formatMoney(selectedDestAccount?.balance || 0)}
                  </span>
                </div>
              </div>
              <ChevronDown size={18} color="rgba(255, 255, 255, 0.4)" style={{ flexShrink: 0 }} />
            </motion.div>
          </div>
        )}

        {/* SECCIÓN: DESCRIPCIÓN con soporte de voz */}
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.45)',
              textTransform: 'uppercase',
              marginBottom: '5px',
            }}
          >
            {t('descriptionUpper')}
          </div>

          <div
            className="tx-field-card"
            style={{ padding: '10px 14px', cursor: 'text' }}
            onClick={() => descriptionRef.current?.focus()}
          >
            <Tag size={17} color="rgba(255, 255, 255, 0.45)" style={{ marginRight: '10px', flexShrink: 0 }} />
            <input
              ref={descriptionRef}
              type="text"
              placeholder={t('transactionDescriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.92rem',
                width: '100%',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              style={{
                background: isListening ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0,
              }}
              title={t('dictateDescription')}
              aria-label={t('dictateDescription')}
            >
              <Mic size={17} />
            </button>
          </div>
        </div>

        {/* SECCIÓN: CATEGORÍA (Excepto transferencias) */}
        {flowType !== 'transfer' && (
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.45)',
                textTransform: 'uppercase',
                marginBottom: '5px',
              }}
            >
              {t('categoryUpper')}
            </div>

            <div className="tx-field-card" style={{ padding: '10px 14px' }} onClick={() => setView('category')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>
                  {selectedCategory?.icon || '🏷️'}
                </span>
                <span style={{ fontSize: '0.92rem', fontWeight: 500, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedCategory
                    ? translateEntityName(selectedCategory.name, 'category')
                    : t('noCategory')}
                </span>
              </div>
              <ChevronDown size={18} color="rgba(255, 255, 255, 0.4)" style={{ flexShrink: 0 }} />
            </div>
          </div>
        )}

        {/* SECCIÓN: FECHA Y FRECUENCIA */}
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.45)',
              textTransform: 'uppercase',
              marginBottom: '5px',
            }}
          >
            {t('dateUpper')}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: flowType === 'transfer' ? '1fr' : '1fr 1fr',
              gap: '8px',
            }}
          >
            {/* Tarjeta de Fecha con apertura directa del Calendario Liquid Glass */}
            <div
              className="tx-field-card"
              style={{ padding: '10px 12px' }}
              onClick={() => {
                setCalendarViewDate(parseLocalDateString(date));
                setView('date');
              }}
            >
              <Calendar size={17} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: '8px', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '0.88rem',
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                }}
              >
                {formatDateDisplay(date)}
              </span>
              <ChevronRight size={15} color="rgba(255, 255, 255, 0.35)" style={{ flexShrink: 0 }} />
            </div>

            {/* Tarjeta de Frecuencia / Recurrencia */}
            {flowType !== 'transfer' && (
              <div className="tx-field-card" style={{ padding: '10px 12px' }} onClick={() => setView('recurring')}>
                <RefreshCw
                  size={15}
                  color={isRecurring ? '#6366f1' : 'rgba(255, 255, 255, 0.5)'}
                  style={{ marginRight: '8px', flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: '0.88rem',
                    color: isRecurring ? '#a5b4fc' : '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: isRecurring ? 600 : 400,
                    flex: 1,
                  }}
                >
                  {isRecurring
                    ? interval === 'daily'
                      ? t('daily')
                      : interval === 'weekly'
                        ? t('weekly')
                        : interval === 'monthly'
                          ? t('monthly')
                          : t('yearly')
                    : t('never')}
                </span>
                <ChevronRight size={15} color="rgba(255, 255, 255, 0.35)" style={{ flexShrink: 0 }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón de Confirmación Principal (Guardar Transacción) */}
      <div style={{ marginTop: 'auto', paddingTop: '10px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                color: '#ef4444',
                fontSize: '0.85rem',
                textAlign: 'center',
                overflow: 'hidden',
              }}
            >
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '16px',
            background:
              flowType === 'expense'
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : flowType === 'income'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1rem',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow:
              flowType === 'expense'
                ? '0 6px 20px rgba(239, 68, 68, 0.35)'
                : flowType === 'income'
                  ? '0 6px 20px rgba(16, 185, 129, 0.35)'
                  : '0 6px 20px rgba(99, 102, 241, 0.35)',
            transition: 'transform 0.15s ease, opacity 0.2s ease',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          <Check size={20} strokeWidth={2.5} />
          <span>
            {submitting
              ? '...'
              : editTransaction
                ? t('saveChanges')
                : flowType === 'expense'
                  ? t('saveExpense')
                  : flowType === 'income'
                    ? t('saveIncome')
                    : t('saveTransfer')}
          </span>
        </button>
      </div>
    </motion.div>
  );

  // Sub-vista de Selección de Cuenta
  const renderAccountList = (isDestination: boolean) => (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
    >
      <div className="modal-header">
        <button
          type="button"
          className="modal-close-btn"
          onClick={() => setView('main')}
          aria-label={t('back')}
        >
          <X size={20} />
        </button>
        <h2 className="modal-title">
          {isDestination ? t('destinationAccountUpper') : t('account')}
        </h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {accounts.filter(acc => !isDestination || acc.id !== accountId).map(acc => {
          const isSelected = isDestination ? destinationAccountId === acc.id : accountId === acc.id;

          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => handleAccountSelect(acc.id, acc.scope as 'personal' | 'shared')}
              style={{
                background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '18px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: '#ffffff',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: acc.color ? `${acc.color}25` : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {acc.icon || '🏦'}
                </div>
                <div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: '2px' }}>
                    {translateEntityName(acc.name, 'account')}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {t('balanceStr')}: {formatMoney(acc.balance || 0)}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} color={isSelected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.3)'} />
            </button>
          );
        })}
      </div>

      <div style={{ padding: '16px 0 10px 0', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={() => setShowAddAccount(true)}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '16px',
            border: '1px dashed var(--accent-primary)',
            background: 'transparent',
            color: 'var(--accent-primary)',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Plus size={18} />
          <span>{t('addAccount')}</span>
        </button>
      </div>
    </motion.div>
  );

  // Sub-vista de Selección de Categoría
  const renderCategoryList = () => (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
    >
      <div className="modal-header">
        <button
          type="button"
          className="modal-close-btn"
          onClick={() => {
            setIsEditingCategories(false);
            setView('main');
          }}
          aria-label={t('back')}
        >
          <X size={20} />
        </button>
        <h2 className="modal-title">{t('categories')}</h2>
        <button
          type="button"
          onClick={() => setIsEditingCategories(!isEditingCategories)}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: isEditingCategories ? '#ef4444' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: isEditingCategories ? 600 : 500,
            padding: '6px',
            transition: 'color 0.2s ease',
          }}
        >
          {isEditingCategories ? t('done') : t('delete')}
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoRows: 'min-content',
          gap: '14px',
          padding: '8px 0 24px 0',
        }}
      >
        {/* Botón de Agregar Categoría */}
        <button
          type="button"
          onClick={() => setShowCategoriesSettings(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            opacity: isEditingCategories ? 0.5 : 1,
            pointerEvents: isEditingCategories ? 'none' : 'auto',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '4px',
            }}
          >
            <Plus size={26} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'center' }}>
            {t('add')}
          </span>
        </button>

        {activeCategories.map(cat => (
          <div key={cat.id} style={{ position: 'relative' }}>
            {isEditingCategories && (
              <button
                type="button"
                onClick={() => setCategoryToDelete(cat.id)}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  border: '2px solid #0f141c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  padding: 0,
                }}
              >
                <X size={14} strokeWidth={3} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isEditingCategories) return;
                setCategoryId(cat.id);
                setView('main');
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 8px',
                background: categoryId === cat.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: isEditingCategories
                  ? '1px dashed rgba(255, 255, 255, 0.2)'
                  : categoryId === cat.id
                    ? '1px solid var(--accent-primary)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '18px',
                cursor: isEditingCategories ? 'default' : 'pointer',
                color: categoryId === cat.id ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.15s ease',
                width: '100%',
                height: '100%',
              }}
            >
              <span style={{ fontSize: '1.8rem', filter: categoryId === cat.id ? 'none' : 'grayscale(25%)' }}>
                {cat.icon}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: categoryId === cat.id ? 600 : 400, textAlign: 'center' }}>
                {translateEntityName(cat.name, 'category')}
              </span>
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );

  // Sub-vista de Frecuencia / Recurrencia
  const renderRecurringList = () => (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
    >
      <div className="modal-header">
        <button
          type="button"
          className="modal-close-btn"
          onClick={() => setView('main')}
          aria-label={t('back')}
        >
          <X size={20} />
        </button>
        <h2 className="modal-title">{t('frequency')}</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          onClick={() => {
            setIsRecurring(false);
            setView('main');
          }}
          className="tx-field-card"
          style={{
            border: !isRecurring ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
            background: !isRecurring ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.04)',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.95rem', fontWeight: !isRecurring ? 600 : 400 }}>{t('never')}</span>
          {!isRecurring && <Check size={18} color="var(--accent-primary)" />}
        </button>

        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(inv => {
          const isSelected = isRecurring && interval === inv;
          const label =
            inv === 'daily'
              ? t('daily')
              : inv === 'weekly'
                ? t('weekly')
                : inv === 'monthly'
                  ? t('monthly')
                  : t('yearly');

          return (
            <button
              key={inv}
              type="button"
              onClick={() => {
                setIsRecurring(true);
                setInterval(inv);
                setView('main');
              }}
              className="tx-field-card"
              style={{
                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
                background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.04)',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.95rem', fontWeight: isSelected ? 600 : 400 }}>{label}</span>
              {isSelected && <Check size={18} color="var(--accent-primary)" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 12px calc(24px + env(safe-area-inset-bottom, 0px)) 12px',
            }}
          >
            {/* Backdrop oscuro con desenfoque */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
              }}
            />

            {/* Contenedor del Modal Liquid Glass */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 25 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '430px',
                background: 'rgba(15, 20, 28, 0.94)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '28px',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 16px 20px 16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
                maxHeight: '90vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {view === 'main' && renderMainView()}
              {view === 'account' && renderAccountList(false)}
              {view === 'destination' && renderAccountList(true)}
              {view === 'category' && renderCategoryList()}
              {view === 'recurring' && renderRecurringList()}
              {view === 'date' && renderCalendarView()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modales complementarios de configuración y eliminación */}
      {showAddAccount && (
        <AccountsSettings
          onClose={() => setShowAddAccount(false)}
          zIndex={1300}
        />
      )}
      {showCategoriesSettings && (
        <CategoriesSettings
          onClose={() => setShowCategoriesSettings(false)}
          initialTab={scope}
          zIndex={1300}
        />
      )}

      <DoubleConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        titleStep1={t('deleteTransactionTitle')}
        descStep1={t('deleteTransactionDesc1')}
        titleStep2={t('deleteTransactionConfirmTitle')}
        descStep2={t('deleteTransactionConfirmDesc2')}
        loading={submitting}
      />

      <DoubleConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmCategoryDelete}
        titleStep1={t('deleteCategoryTitle')}
        descStep1={t('deleteCategoryDesc1')}
        titleStep2={t('deleteCategoryConfirmTitle')}
        descStep2={t('deleteCategoryConfirmDesc2')}
        loading={submitting}
      />
    </>
  );
}
