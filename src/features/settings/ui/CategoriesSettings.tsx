import { useState } from 'react';
import { useCategories } from '../../../entities/categories/model/useCategories';
import { X, Edit, Trash2, User, Users } from 'lucide-react';
import type { TransactionType } from '../../../shared/types/database';
import EmojiPickerModal from '../../../shared/ui/EmojiPickerModal';
import ColorPickerModal from '../../../shared/ui/ColorPickerModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import DoubleConfirmModal from '../../../shared/ui/DoubleConfirmModal';

/**
 * Componente modal que administra y personaliza el listado de categorías transaccionales de la base de datos.
 * Funciona como centro de control para crear, estructurar o borrar categorías, tanto en el marco
 * personal como dentro del régimen compartido de la pareja.
 *
 * @param props - Permite inyectar funciones de control como `onClose` para desmontar el modal.
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
    <div className="modal-overlay" style={{ zIndex }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        className="modal animate-in"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
          <h2 className="modal-title">
            {t('categoriesManagement')}
          </h2>
        </div>

        {!hideTabs && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              width: '100%',
              marginBottom: '24px',
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
                boxShadow: tab === 'personal' ? '0 4px 14px var(--accent-primary-glow, rgba(99,102,241,0.35))' : 'none',
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
                boxShadow: tab === 'shared' ? '0 4px 14px var(--accent-primary-glow, rgba(99,102,241,0.35))' : 'none',
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

        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '24px', padding: '20px', border: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                {t('icon')}
              </label>
              <button
                type="button"
                className="btn-icon"
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowColorPicker(false); }}
                style={{ width: '44px', height: '44px', fontSize: '1.4rem', background: `${color}15`, border: `2px solid ${color}40`, color: color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s ease' }}
              >
                {icon}
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
                style={{ width: '44px', height: '44px', background: color, border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', padding: 0, cursor: 'pointer', boxShadow: `0 2px 8px ${color}40`, transition: 'transform 0.15s ease' }}
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
              <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ flex: 1 }}>{t('cancel')}</button>
            )}
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              {editingId ? t('updateCategory') : t('createCategory')}
            </button>
          </div>
        </form>

        <div className="transaction-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
              <div key={cat.id} className="transaction-item" style={{ background: 'var(--bg-secondary)', marginBottom: '8px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center' }}>
                <div className="transaction-icon" style={{ background: `${cat.color}15`, color: cat.color }}>
                  {cat.icon}
                </div>
                <div className="transaction-details" style={{ flex: 1 }}>
                  <div className="transaction-title" style={{ fontWeight: 600 }}>{translateEntityName(cat.name, 'category')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {cat.scope === 'shared' ? t('sharedLabel') : t('personalLabel')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                  <button className="btn-icon" onClick={() => handleEdit(cat)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
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
