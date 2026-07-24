import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import type { Category } from '../../../shared/types/database';
import { useState } from 'react';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';

interface CategorySelectorProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  selected: Category | null;
  onSelect: (cat: Category) => void;
  onAddCategory: (cat: Partial<Category>) => Promise<unknown>;
}

const EMOJI_PRESETS = ['🍕', '🚗', '🏠', '💡', '🎮', '👕', '📱', '📚', '🏥', '✈️', '🎁', '🛒', '💸', '🐾', '🎬', '⛽', '🏦', '🎵', '💪', '🧹'];

/**
 * Selector de categorías con capacidad de creación rápida.
 *
 * Permite al usuario elegir una categoría existente o crear una nueva
 * sin salir del flujo de transacción mediante un panel expansible.
 * Incluye un grid de emojis predefinidos y paleta de colores.
 */
export default function CategorySelector({
  open, onClose, categories, selected, onSelect, onAddCategory
}: CategorySelectorProps) {
  const { t } = useLocaleCurrency();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newColor, setNewColor] = useState('#6366F1');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await onAddCategory({
      name: newName,
      icon: newIcon,
      color: newColor,
      scope: 'personal',
      is_active: true,
    });
    setShowAdd(false);
    setNewName('');
    setNewIcon('📦');
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="kebo-sheet-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="kebo-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="kebo-sheet-header">
            <span className="kebo-sheet-title">{t('category')}s</span>
            <button className="kebo-sheet-close" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="kebo-category-grid">
            {/* Add button */}
            <button className="kebo-category-item kebo-cat-add" onClick={() => setShowAdd(true)}>
              <span className="kebo-cat-icon-wrap kebo-cat-add-icon">+</span>
              <span className="kebo-cat-name">{t('add')}</span>
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                className={`kebo-category-item ${selected?.id === cat.id ? 'selected' : ''}`}
                onClick={() => onSelect(cat)}
              >
                <span className="kebo-cat-icon-wrap" style={{ background: `${cat.color}20` }}>
                  {cat.icon}
                </span>
                <span className="kebo-cat-name">{cat.name}</span>
                {selected?.id === cat.id && (
                  <span className="kebo-cat-check"><Check size={14} /></span>
                )}
              </button>
            ))}
          </div>

          {/* Add Category Panel */}
          {showAdd && (
            <div className="kebo-add-category-panel">
              <div className="kebo-add-cat-header">
                <span>{t('newCategory')}</span>
                <button onClick={() => setShowAdd(false)}><X size={16} /></button>
              </div>
              <div className="kebo-add-cat-body">
                <div className="kebo-emoji-picker-grid">
                  {EMOJI_PRESETS.map(emoji => (
                    <button
                      key={emoji}
                      className={`kebo-emoji-btn ${newIcon === emoji ? 'selected' : ''}`}
                      onClick={() => setNewIcon(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  className="kebo-add-cat-input"
                  placeholder={t('categoryNamePlaceholder')}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                />
                <div className="kebo-color-picker">
                  {['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#F97316'].map(c => (
                    <button
                      key={c}
                      className={`kebo-color-dot ${newColor === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setNewColor(c)}
                    />
                  ))}
                </div>
                <button className="kebo-add-cat-submit" onClick={handleAdd}>
                  {t('createCategoryBtn')}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
