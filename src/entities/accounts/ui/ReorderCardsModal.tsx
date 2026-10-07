import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  X,
  GripVertical,
  Check,
  Loader2,
  Users,
  User,
} from 'lucide-react';
import type { Account } from '../../../shared/types/database';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';

interface ReorderCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSave: (reordered: Account[]) => Promise<unknown>;
  zIndex?: number;
}

export default function ReorderCardsModal({
  isOpen,
  onClose,
  accounts,
  onSave,
  zIndex = 1500,
}: ReorderCardsModalProps) {
  const { t, formatMoney, translateEntityName } = useLocaleCurrency();
  const [items, setItems] = useState<Account[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar elementos locales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setItems([...accounts]);
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(items);
      onClose();
    } catch (err) {
      console.error('Error saving account order:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div
        className="modal-overlay"
        style={{
          zIndex,
          background: 'rgba(5, 7, 15, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSaving) onClose();
        }}
      >
        <motion.div
          className="card card-modal animate-in"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '440px',
            width: '100%',
            maxHeight: 'min(92vh, 92dvh, 720px)',
            minHeight: 0,
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            margin: 'auto',
            gap: '16px',
          }}
        >
          {/* Cabecera del Modal con X a la izquierda y Título centrado */}
          <div style={{ width: '100%', position: 'relative', flexShrink: 0 }}>
            <div
              className="modal-header"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '36px',
                marginBottom: '6px',
                width: '100%',
              }}
            >
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                disabled={isSaving}
                aria-label={t('close')}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={18} />
              </button>

              <h2
                className="modal-title"
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  margin: 0,
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                  width: '100%',
                  padding: '0 44px',
                }}
              >
                {t('reorderCards')}
              </h2>
            </div>

            {/* Descripción centrada más abajo */}
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-tertiary, #94a3b8)',
                margin: '0 auto',
                textAlign: 'center',
                maxWidth: '340px',
                lineHeight: 1.4,
              }}
            >
              {t('reorderCardsDesc')}
            </p>
          </div>

          {/* Lista Interactiva Reordenable con Framer Motion (Solo con Grip de puntos a la izquierda) */}
          <Reorder.Group
            axis="y"
            values={items}
            onReorder={setItems}
            className="modal-scroll-area"
            style={{
              listStyle: 'none',
              padding: '2px',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: '1 1 auto',
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {items.map((acc) => {
              const cardBg = acc.color || '#6366F1';

              return (
                <Reorder.Item
                  key={acc.id}
                  value={acc}
                  whileDrag={{
                    scale: 1.02,
                    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.6)',
                    cursor: 'grabbing',
                    zIndex: 20,
                  }}
                  transition={{ duration: 0.18 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    backdropFilter: 'blur(8px)',
                    userSelect: 'none',
                    position: 'relative',
                  }}
                >
                  {/* Grip Handle de puntitos para arrastre fluido */}
                  <div
                    style={{
                      cursor: 'grab',
                      touchAction: 'none',
                      color: 'var(--text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      flexShrink: 0,
                    }}
                    title={t('reorderCards')}
                  >
                    <GripVertical size={20} />
                  </div>

                  {/* Píldora Visual de la Tarjeta */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${cardBg}dd 0%, #0b0f19 100%)`,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                    }}
                  >
                    {acc.icon || '🏦'}
                  </div>

                  {/* Información de la Tarjeta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {translateEntityName(acc.name, 'account')}
                      </span>
                      {acc.scope === 'shared' ? (
                        <Users size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      ) : (
                        <User size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        marginTop: '2px',
                      }}
                    >
                      {formatMoney(acc.balance || 0)}
                    </div>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
              style={{
                flex: 1,
                borderRadius: '14px',
                height: '44px',
                fontWeight: 600,
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: 1.5,
                borderRadius: '14px',
                height: '44px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>{t('saveOrder')}</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>{t('saveOrder')}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
