import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { X, Edit, Trash2 } from 'lucide-react';
import type { TransactionType } from '../types/database';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleCurrency } from '../contexts/LocaleCurrencyContext';

const COLOR_PRESETS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B',
  '#EF4444', '#3B82F6', '#8B5CF6', '#F97316',
  '#06B6D4', '#84CC16', '#64748B', '#000000'
];

export default function CategoriesSettings({ onClose }: { onClose: () => void }) {
  const { t } = useLocaleCurrency();
  const [tab, setTab] = useState<TransactionType>('shared');
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useCategories(tab);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState('#EC4899');

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateCategory(editingId, { name, icon, color, scope: tab as 'personal' | 'shared' });
    } else {
      await addCategory({ name, icon, color, scope: tab as 'personal' | 'shared' });
    }
    resetForm();
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
  };

  const handleDelete = async (id: string) => {
    if (confirm(`${t('delete')}?`)) {
      await deleteCategory(id);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setIcon('📌');
    setColor('#EC4899');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        className="modal animate-in"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{t('categoriesManagement')}</h2>
          <button className="btn-icon" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="toggle-group" style={{ marginBottom: '24px', display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`toggle-item ${tab === 'personal' ? 'active' : ''}`}
            onClick={() => { setTab('personal'); resetForm(); }}
            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)', background: tab === 'personal' ? 'var(--bg-primary)' : 'transparent', color: tab === 'personal' ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {t('personal')}
          </button>
          <button
            className={`toggle-item ${tab === 'shared' ? 'active' : ''}`}
            onClick={() => { setTab('shared'); resetForm(); }}
            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)', background: tab === 'shared' ? 'var(--bg-primary)' : 'transparent', color: tab === 'shared' ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {t('shared')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '24px', padding: '20px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <label className="form-label">{t('icon')}</label>
              <button
                type="button"
                className="btn-icon"
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowColorPicker(false); }}
                style={{ width: '48px', height: '48px', fontSize: '1.5rem', background: `${color}15`, border: `2px solid ${color}30`, color: color, borderRadius: 'var(--radius-md)' }}
              >
                {icon}
              </button>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1100, marginTop: '8px' }}
                  >
                    <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                      <Picker
                        data={data}
                        onEmojiSelect={(emoji: any) => { setIcon(emoji.native); setShowEmojiPicker(false); }}
                        theme="dark"
                        locale="es"
                        set="native"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ flex: 1 }}>
              <label className="form-label">{t('categoryName')}</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('categoryPlaceholder')}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="form-label">{t('color')}</label>
              <button
                type="button"
                className="btn-icon"
                onClick={() => { setShowColorPicker(!showColorPicker); setShowEmojiPicker(false); }}
                style={{ width: '40px', height: '40px', background: color, border: 'none', borderRadius: 'var(--radius-full)', padding: 0 }}
              />

              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1100, marginTop: '8px' }}
                  >
                    <div className="card" style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', boxShadow: 'var(--shadow-lg)' }}>
                      {COLOR_PRESETS.map(c => (
                        <button
                          key={c}
                          type="button"
                          className={`kebo-color-dot ${color === c ? 'selected' : ''}`}
                          style={{ background: c, width: '24px', height: '24px' }}
                          onClick={() => { setColor(c); setShowColorPicker(false); }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ flex: 1 }}>{t('replace')}</button>
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
              <div key={cat.id} className="transaction-item" style={{ background: 'var(--bg-secondary)', marginBottom: '8px', borderRadius: 'var(--radius-md)' }}>
                <div className="transaction-icon" style={{ background: `${cat.color}15`, color: cat.color }}>
                  {cat.icon}
                </div>
                <div className="transaction-details">
                  <div className="transaction-title" style={{ fontWeight: 600 }}>{cat.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {cat.scope === 'shared' ? t('sharedLabel') : t('personalLabel')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
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
    </div>
  );
}
