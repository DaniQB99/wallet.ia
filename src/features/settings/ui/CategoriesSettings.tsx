import { useState, useRef } from 'react';
import { useCategories } from '../../../entities/categories/model/useCategories';
import { X, Trash2, User, Users, ChevronLeft } from 'lucide-react';
import type { TransactionType } from '../../../shared/types/database';
import EmojiPickerModal from '../../../shared/ui/EmojiPickerModal';
import ColorPickerModal from '../../../shared/ui/ColorPickerModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import DoubleConfirmModal from '../../../shared/ui/DoubleConfirmModal';
import { sanitizeEmoji } from '../../../shared/lib/emoji';

interface SwipeableCategoryCardProps {
  cat: any;
  translateEntityName: (name: string, type: 'category' | 'account') => string;
  t: (key: string) => string;
  onEdit: (cat: any) => void;
  onDelete: (id: string) => void;
}

function SwipeableCategoryCard({
  cat,
  translateEntityName,
  t,
  onEdit,
  onDelete,
}: SwipeableCategoryCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDraggingRef = useRef(false);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'var(--bg-tertiary)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '10px',
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
            onDelete(cat.id);
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
          <Trash2 size={18} color="#ef4444" />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.02em' }}>
            {t('delete')}
          </span>
        </button>
      </div>

      {/* Capa Delantera Deslizable: Clickeable para editar directamente */}
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
          onEdit(cat);
        }}
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          borderRadius: '16px',
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
        {/* Acento lateral con color de la categoría */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '20%',
            bottom: '20%',
            width: '3.5px',
            borderRadius: '0 3px 3px 0',
            background: cat.color || 'var(--accent-primary)',
          }}
        />

        {/* Icono con contenedor adaptativo */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0,
            color: cat.color || 'var(--text-primary)',
          }}
        >
          {sanitizeEmoji(cat.icon)}
        </div>

        {/* Detalles de la categoría: Nombre e icono de ámbito minimalista al lado (sin texto redundante) */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {translateEntityName(cat.name, 'category')}
          </span>
          {cat.scope === 'shared' ? (
            <Users size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          ) : (
            <User size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          )}
        </div>

        {/* Indicador táctil sutil de deslizamiento estilo iOS < */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: '4px',
            color: 'var(--text-tertiary)',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
          title={isOpen ? t('close') : t('swipeToDelete')}
        >
          <ChevronLeft size={16} />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Componente modal que administra y personaliza el listado de categorías transaccionales de la base de datos.
 * Funciona como centro de control para crear, estructurar o borrar categorías, tanto en el marco
 * personal como dentro del régimen compartido de la pareja.
 */
export default function CategoriesSettings({
  onClose,
  initialTab = 'shared',
  hideTabs = false,
  zIndex = 1300,
}: {
  onClose: () => void;
  initialTab?: TransactionType;
  hideTabs?: boolean;
  zIndex?: number;
}) {
  const { t, translateEntityName } = useLocaleCurrency();
  const [tab, setTab] = useState<TransactionType>(initialTab);
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useCategories(tab);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState('#EC4899');

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameExists = categories.some(
      cat => cat.name.trim().toLowerCase() === name.trim().toLowerCase() && cat.id !== editingId
    );

    if (nameExists) {
      setError(t('categoryExists') || 'Ya existe una categoría con este nombre');
      return;
    }

    if (editingId) {
      await updateCategory(editingId, { name: name.trim(), icon, color, scope: tab as 'personal' | 'shared' });
    } else {
      await addCategory({ name: name.trim(), icon, color, scope: tab as 'personal' | 'shared' });
    }
    resetForm();
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    if (cat.scope) {
      setTab(cat.scope as 'personal' | 'shared');
    }
  };

  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    await deleteCategory(categoryToDelete);
    setDeleting(false);
    setCategoryToDelete(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setIcon('📌');
    setColor('#EC4899');
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="card card-modal animate-in"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '100%',
          maxHeight: 'min(92vh, 92dvh, 760px)',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '22px',
          margin: 'auto',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 📐 CABECERA ESTANDARIZADA: X a la izquierda arriba, Título al centro a la altura de X, Descripción debajo centrada y responsive */}
        <div style={{ position: 'relative', marginBottom: '16px', flexShrink: 0 }}>
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
                width: '36px',
                height: '36px',
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
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                textAlign: 'center',
                padding: '0 40px',
              }}
            >
              {t('categoriesManagement')}
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
            {t('categoriesSubtitle')}
          </p>
        </div>

        {!hideTabs && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              background: 'var(--bg-tertiary)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              width: '100%',
              marginBottom: '16px',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => { setTab('personal'); resetForm(); }}
              style={{
                flex: '1 1 120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: tab === 'personal' ? 'var(--accent-primary)' : 'transparent',
                color: tab === 'personal' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: tab === 'personal' ? '0 4px 14px var(--accent-primary-glow)' : 'none',
                minWidth: 0,
              }}
            >
              <User size={16} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('personalLabel')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setTab('shared'); resetForm(); }}
              style={{
                flex: '1 1 120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: tab === 'shared' ? 'var(--accent-primary)' : 'transparent',
                color: tab === 'shared' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: tab === 'shared' ? '0 4px 14px var(--accent-primary-glow)' : 'none',
                minWidth: 0,
              }}
            >
              <Users size={16} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('sharedLabel')}
              </span>
            </button>
          </div>
        )}

        {/* Formulario de creación/edición en Liquid Glass */}
        <form
          onSubmit={handleSubmit}
          className="card"
          style={{
            marginBottom: '16px',
            padding: '16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            position: 'relative',
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                {t('icon')}
              </label>
              <button
                type="button"
                className="btn-icon"
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowColorPicker(false); }}
                style={{
                  width: '44px',
                  height: '44px',
                  fontSize: '1.4rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
              >
                {sanitizeEmoji(icon)}
              </button>

              <EmojiPickerModal
                isOpen={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onSelect={(selectedEmoji) => setIcon(selectedEmoji)}
                currentEmoji={icon}
                zIndex={1500}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('categoryName')}
              </label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder=""
                className="form-input"
                style={{ width: '100%', height: '44px', borderRadius: '12px' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                {t('color')}
              </label>
              <button
                type="button"
                className="btn-icon"
                onClick={() => { setShowColorPicker(!showColorPicker); setShowEmojiPicker(false); }}
                style={{
                  width: '44px',
                  height: '44px',
                  background: color,
                  border: '2px solid var(--border)',
                  borderRadius: '50%',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
              />

              <ColorPickerModal
                isOpen={showColorPicker}
                onClose={() => setShowColorPicker(false)}
                onSelect={(newColor) => setColor(newColor)}
                initialColor={color}
                zIndex={1500}
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ overflow: 'hidden', marginBottom: '16px' }}
              >
                <div style={{ padding: '12px', background: 'var(--danger-light, #fee2e2)', color: 'var(--danger, #ef4444)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', border: '1px solid var(--danger, #ef4444)' }}>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', gap: '12px' }}>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ flex: 1, height: '42px', borderRadius: '12px' }}>
                {t('cancel')}
              </button>
            )}
            <button type="submit" className="btn btn-primary" style={{ flex: 2, height: '42px', borderRadius: '12px', fontWeight: 700 }}>
              {editingId ? t('updateCategory') : t('createCategory')}
            </button>
          </div>
        </form>

        {/* Lista de Categorías con Deslizamiento (Swipe-to-Action) */}
        <div
          className="modal-scroll-area"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            minHeight: 0,
            paddingRight: '4px',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="loading-spinner" />
            </div>
          ) : categories.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              {t('noCategoriesYet')}
            </div>
          ) : (
            categories.map(cat => (
              <SwipeableCategoryCard
                key={cat.id}
                cat={cat}
                translateEntityName={translateEntityName}
                t={t}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </motion.div>

      <DoubleConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDelete}
        titleStep1={t('deleteCategoryTitle')}
        descStep1={t('deleteCategoryDesc')}
        titleStep2={t('finalConfirmation')}
        descStep2={t('finalConfirmationDesc')}
        loading={deleting}
      />
    </div>
  );
}
