import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccounts } from '../../../entities/accounts/model/useAccounts';
import { X, Trash2, CreditCard, Users, User, ArrowUpDown, Plus, Lock, ChevronLeft } from 'lucide-react';
import { useCouple } from '../../auth/model/useCouple';
import EmojiPickerModal from '../../../shared/ui/EmojiPickerModal';
import ColorPickerModal from '../../../shared/ui/ColorPickerModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleCurrency, type SupportedCurrency } from '../../../app/providers/LocaleCurrencyContext';
import type { Account } from '../../../shared/types/database';
import DoubleConfirmModal from '../../../shared/ui/DoubleConfirmModal';
import ReorderCardsModal from '../../../entities/accounts/ui/ReorderCardsModal';
import CreateAccountWizardModal from './CreateAccountWizardModal';
import { sanitizeEmoji } from '../../../shared/lib/emoji';

interface AccountsSettingsProps {
  onClose: () => void;
  initialEditingAccountId?: string | null;
  zIndex?: number;
}

const PRESET_COLORS = [
  '#6366F1', '#3B82F6', '#10B981', '#F59E0B',
  '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444',
];

interface SwipeableAccountCardProps {
  acc: Account;
  currency: SupportedCurrency;
  formatMoney: (amount: number, date?: string, currencyOverride?: SupportedCurrency) => string;
  getCurrencySymbol: (currencyOverride?: SupportedCurrency) => string;
  translateEntityName: (name: string, type: 'category' | 'account') => string;
  t: (key: string) => string;
  onEdit: (acc: Account) => void;
  onDelete: (id: string) => void;
}

function SwipeableAccountCard({
  acc,
  currency,
  formatMoney,
  getCurrencySymbol,
  translateEntityName,
  t,
  onEdit,
  onDelete,
}: SwipeableAccountCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDraggingRef = React.useRef(false);
  const currSymbol = getCurrencySymbol((acc.currency as SupportedCurrency) || currency);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'var(--bg-tertiary)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Capa Trasera de Acción: Únicamente Eliminar, sobrio con fondo atenuado e icono rojo */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '76px',
          display: 'flex',
          alignItems: 'stretch',
          zIndex: 1,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            onDelete(acc.id);
          }}
          aria-label={t('delete')}
          style={{
            flex: 1,
            background: 'rgba(239, 68, 68, 0.12)',
            border: 'none',
            color: '#ef4444',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            cursor: 'pointer',
            padding: 0,
            transition: 'background 0.15s ease',
          }}
        >
          <Trash2 size={20} color="#ef4444" />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.02em' }}>
            {t('delete')}
          </span>
        </button>
      </div>

      {/* Capa Delantera Deslizable: Clickeable para editar directamente, deslizable a la izquierda para borrar */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -76, right: 0 }}
        dragElastic={0.08}
        animate={{ x: isOpen ? -76 : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={(_, info) => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 80);
          if (info.offset.x < -25 || info.velocity.x < -150) {
            setIsOpen(true);
          } else if (info.offset.x > 20 || info.velocity.x > 150) {
            setIsOpen(false);
          }
        }}
        onClick={() => {
          if (isDraggingRef.current) return;
          if (isOpen) {
            setIsOpen(false);
            return;
          }
          onEdit(acc);
        }}
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '16px 18px',
          borderRadius: '20px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          cursor: 'pointer',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        {/* Acento lateral con el color de la tarjeta (sobrio, sin sombra de neón) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '20%',
            bottom: '20%',
            width: '3.5px',
            borderRadius: '0 4px 4px 0',
            background: acc.color || 'var(--accent-primary)',
          }}
        />

        {/* Icono con contenedor adaptativo neutro */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '15px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.45rem',
            flexShrink: 0,
            color: acc.color || 'var(--text-primary)',
          }}
        >
          {sanitizeEmoji(acc.icon) || <CreditCard size={20} />}
        </div>

        {/* Contenido principal: Nombre arriba con emoticonos e indicadores minimalistas, Saldo nativo abajo */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {translateEntityName(acc.name, 'account')}
            </span>

            {/* Emoticono de ámbito junto al nombre con el color de la apariencia principal */}
            {acc.scope === 'shared' ? (
              <Users size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            ) : (
              <User size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            )}

            {/* Símbolo de la divisa de forma minimalista sin círculo */}
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.02em',
                flexShrink: 0,
              }}
            >
              {currSymbol}
            </span>
          </div>

          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {formatMoney(acc.balance, undefined, acc.currency as SupportedCurrency)}
          </span>
        </div>

        {/* Indicador táctil sutil de deslizamiento < (separado y limpio sin círculos pesados) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            flexShrink: 0,
            paddingLeft: '4px',
          }}
          title={isOpen ? t('close') : t('swipeToDelete')}
        >
          <ChevronLeft size={16} />
        </div>
      </motion.div>
    </div>
  );
}

export default function AccountsSettings({ onClose, initialEditingAccountId, zIndex = 1300 }: AccountsSettingsProps) {
  const { accounts, addAccount, updateAccount, deleteAccount, reorderAccounts, loading } = useAccounts();
  const { currency, formatMoney, getCurrencySymbol, t, translateEntityName } = useLocaleCurrency();
  const { couple } = useCouple();

  const [showWizard, setShowWizard] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Estados de edición
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('🏦');
  const [editColor, setEditColor] = useState('#6366F1');
  const [editScope, setEditScope] = useState<'personal' | 'shared'>('personal');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const startEditing = (acc: Account) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditIcon(acc.icon || '🏦');
    setEditColor(acc.color || '#6366F1');
    setEditScope((acc.scope as 'personal' | 'shared') || 'personal');
  };

  useEffect(() => {
    if (initialEditingAccountId && accounts.length > 0) {
      const target = accounts.find((a) => a.id === initialEditingAccountId);
      if (target) {
        startEditing(target);
      }
    }
  }, [initialEditingAccountId, accounts]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editName.trim()) return;
    setUpdating(true);
    try {
      await updateAccount(editingAccount.id, {
        name: editName.trim(),
        icon: editIcon,
        color: editColor,
        scope: editScope,
        couple_id: editScope === 'shared' && couple?.status === 'active' ? couple.id : null,
      });
      setEditingAccount(null);
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    setDeleting(true);
    try {
      await deleteAccount(accountToDelete);
    } finally {
      setDeleting(false);
      setAccountToDelete(null);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex,
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="card card-modal"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: 'min(92vh, 92dvh, 760px)',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          overflow: 'hidden',
          position: 'relative',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 📐 CABECERA ESTANDARIZADA: X a la izquierda, Título centrado a su altura, Descripción debajo centrada */}
        <div style={{ position: 'relative', marginBottom: '22px', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              minHeight: '38px',
            }}
          >
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              aria-label={t('close')}
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={18} />
            </button>

            <h2
              style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                textAlign: 'center',
                padding: '0 44px',
              }}
            >
              {t('accountsAndCards')}
            </h2>
          </div>

          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              margin: '6px auto 0 auto',
              textAlign: 'center',
              maxWidth: '360px',
              lineHeight: 1.4,
            }}
          >
            {t('wizardStepCurrencySubtitle')}
          </p>
        </div>

        {/* Barra de Acciones: + Nueva Tarjeta (Wizard) y Reordenar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="btn btn-primary"
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 4px 16px var(--accent-primary-glow)',
            }}
          >
            <Plus size={18} />
            <span>{t('newCardButton')}</span>
          </button>

          {accounts.length > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowReorder(true)}
              title={t('reorderCards')}
              aria-label={t('reorderCards')}
              style={{
                width: '44px',
                height: '44px',
                padding: 0,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowUpDown size={18} />
            </button>
          )}
        </div>

        {/* Lista de Tarjetas en Liquid Glass con Deslizamiento (Swipe-to-Action) */}
        <div
          className="modal-scroll-area"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingRight: '6px',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="loading-spinner" />
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              {t('noAccountsYet')}
            </div>
          ) : (
            accounts.map((acc) => (
              <SwipeableAccountCard
                key={acc.id}
                acc={acc}
                currency={currency}
                formatMoney={formatMoney}
                getCurrencySymbol={getCurrencySymbol}
                translateEntityName={translateEntityName}
                t={t}
                onEdit={startEditing}
                onDelete={setAccountToDelete}
              />
            ))
          )}
        </div>

        {/* 🎨 MODAL DE EDICIÓN DE TARJETA CON DIVISA INMUTABLE (Portal a document.body) */}
        {createPortal(
          <AnimatePresence>
            {editingAccount && (
              <div
                className="modal-overlay"
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  zIndex: zIndex + 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setEditingAccount(null);
                }}
              >
                <motion.div
                  className="card card-modal"
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 16 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{
                    width: '100%',
                    maxWidth: '440px',
                    maxHeight: 'min(92vh, 92dvh, 680px)',
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    margin: 'auto',
                    padding: '24px 20px',
                    position: 'relative',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Cabecera modal de edición estandarizada */}
                  <div style={{ flexShrink: 0, position: 'relative', marginBottom: '18px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        minHeight: '36px',
                      }}
                    >
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => setEditingAccount(null)}
                        aria-label={t('close')}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={18} />
                      </button>
                      <h3
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          margin: 0,
                          textAlign: 'center',
                          padding: '0 40px',
                        }}
                      >
                        {t('editAccountModalTitle')}
                      </h3>
                    </div>
                  </div>

                  <form
                    onSubmit={handleUpdate}
                    className="modal-scroll-area"
                    style={{
                      flex: '1 1 auto',
                      overflowY: 'auto',
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      paddingRight: '4px',
                      paddingBottom: '4px',
                      WebkitOverflowScrolling: 'touch',
                      overscrollBehavior: 'contain',
                      touchAction: 'pan-y',
                    }}
                  >
                    {/* Nombre */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block' }}>
                        {t('accountName')}
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="form-input"
                        style={{ width: '100%', height: '44px', borderRadius: '12px', fontWeight: 600 }}
                      />
                    </div>

                    {/* Icono y Color */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                          {t('icon')}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(true)}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border)',
                            fontSize: '1.35rem',
                            cursor: 'pointer',
                          }}
                        >
                          {sanitizeEmoji(editIcon)}
                        </button>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block' }}>
                          {t('color')}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: c,
                                border: editColor === c ? '2px solid var(--text-primary)' : '2px solid var(--border)',
                                cursor: 'pointer',
                                transform: editColor === c ? 'scale(1.15)' : 'scale(1)',
                                transition: 'all 0.15s ease',
                                padding: 0,
                              }}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => setShowColorPicker(true)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #f43f5e, #8b5cf6, #06b6d4)',
                              border: '2px solid var(--border)',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Divisa Bloqueada (Inmutable) */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {t('currency')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700 }}>
                          <Lock size={12} style={{ color: 'var(--accent-primary)' }} />
                          <span>{editingAccount.currency || currency} ({t('immutableCurrencyBadge')})</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        {t('currencyCannotBeChanged')}
                      </span>
                    </div>

                    {/* Ámbito */}
                    {couple?.status === 'active' && (
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block' }}>
                          {t('accountType')}
                        </label>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            background: 'var(--bg-tertiary)',
                            padding: '4px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setEditScope('personal')}
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '8px',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              background: editScope === 'personal' ? 'var(--accent-primary)' : 'transparent',
                              color: editScope === 'personal' ? '#ffffff' : 'var(--text-secondary)',
                            }}
                          >
                            {t('personalLabel')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditScope('shared')}
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '8px',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              background: editScope === 'shared' ? 'var(--accent-primary)' : 'transparent',
                              color: editScope === 'shared' ? '#ffffff' : 'var(--text-secondary)',
                            }}
                          >
                            {t('sharedLabel')}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditingAccount(null)}
                        style={{ flex: 1, height: '42px', borderRadius: '12px' }}
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={updating || !editName.trim()}
                        style={{ flex: 2, height: '42px', borderRadius: '12px', fontWeight: 700 }}
                      >
                        {updating ? t('saving') : t('updateAccount')}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Wizard para Creación Paso a Paso */}
        {createPortal(
          <CreateAccountWizardModal
            isOpen={showWizard}
            onClose={() => setShowWizard(false)}
            onSave={addAccount}
            zIndex={zIndex + 100}
          />,
          document.body
        )}

        {/* Double Confirm para Borrado Seguro */}
        {createPortal(
          <DoubleConfirmModal
            isOpen={!!accountToDelete}
            onClose={() => setAccountToDelete(null)}
            onConfirm={confirmDelete}
            titleStep1={t('deleteAccountTitle')}
            descStep1={t('deleteAccountDesc')}
            titleStep2={t('finalConfirmation')}
            descStep2={t('finalConfirmationDesc')}
            loading={deleting}
          />,
          document.body
        )}

        {/* Reordenar tarjetas */}
        {showReorder && (
          <ReorderCardsModal
            isOpen={showReorder}
            onClose={() => setShowReorder(false)}
            accounts={accounts}
            onSave={reorderAccounts}
            zIndex={zIndex + 100}
          />
        )}

        {/* Modales auxiliares */}
        <EmojiPickerModal
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelect={(emoji) => setEditIcon(emoji)}
          currentEmoji={editIcon}
        />
        <ColorPickerModal
          isOpen={showColorPicker}
          onClose={() => setShowColorPicker(false)}
          onSelect={(c) => setEditColor(c)}
          initialColor={editColor}
          zIndex={zIndex + 120}
        />
      </motion.div>
    </div>
  );
}
