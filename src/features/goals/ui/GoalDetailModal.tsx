import React, { useState } from 'react';
import { ChevronLeft, Plus, Edit2, Copy, Trash2, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../../app/providers/DataProvider';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import type { Goal, Category } from '../../../shared/types/database';
import DoubleConfirmModal from '../../../shared/ui/DoubleConfirmModal';
import CategoriesSettings from '../../settings/ui/CategoriesSettings';

interface GoalDetailModalProps {
  goal: Goal;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function GoalDetailModal({ goal, onClose, onEdit, onDelete }: GoalDetailModalProps) {
  const { categories, addGoalCategory, removeGoalCategory } = useData();
  const { formatMoney, locale } = useLocaleCurrency();
  const [addingCategory, setAddingCategory] = useState<Category | null>(null);
  const [targetInput, setTargetInput] = useState<string>('');
  const [categoryToRemove, setCategoryToRemove] = useState<string | null>(null);
  const [showCategoriesSettings, setShowCategoriesSettings] = useState(false);

  const percent = goal.target_amount && goal.target_amount > 0
    ? (goal.goal_type === 'budget'
      ? Math.max(0, Math.round((((goal.target_amount - (goal.current_amount || 0))) / goal.target_amount) * 100))
      : Math.min(100, Math.round(((goal.current_amount || 0) / goal.target_amount) * 100)))
    : (goal.goal_type === 'budget' ? 100 : 0);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingCategory) return;
    const numTarget = parseFloat(targetInput);
    if (isNaN(numTarget) || numTarget <= 0) return;

    await addGoalCategory({
      goal_id: goal.id,
      category_id: addingCategory.id,
      target_amount: numTarget
    });
    setAddingCategory(null);
    setTargetInput('');
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ zIndex: 1000, background: 'var(--bg-primary)' }}>
        <motion.div
          className="modal-content"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            borderRadius: '0',
            background: 'var(--bg-primary)',
            padding: '20px',
            overflowY: 'auto'
          }}
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1.2rem', margin: 0, paddingRight: '40px' }}>
              {goal.goal_type === 'budget' ? 'Detalle de presupuesto' : 'Detalle de ahorro'}
            </h2>
          </div>

          {/* Goal Overview Card */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{goal.name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginTop: '4px' }}>
                  {formatDate(goal.start_date)} a {formatDate(goal.deadline)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)' }}>
                <button onClick={onEdit} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}><Edit2 size={18} /></button>
                <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}><Copy size={18} /></button>
                <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}><Trash2 size={18} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{formatMoney(goal.target_amount || 0)}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{percent}%</div>
            </div>

            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ height: '100%', width: `${percent}%`, background: (goal.goal_type === 'budget' && (goal.current_amount || 0) > (goal.target_amount || 0)) ? '#ef4444' : 'var(--accent-primary)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>{formatMoney(goal.current_amount || 0)} {goal.goal_type === 'budget' ? 'gastado' : 'ahorrado'}</span>
              <span>{formatMoney(Math.max(0, (goal.target_amount || 0) - (goal.current_amount || 0)))} {goal.goal_type === 'budget' ? 'por gastar' : 'por ahorrar'}</span>
            </div>
          </div>

          {/* Categories Carousel */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>{goal.goal_type === 'budget' ? 'Categorías de gasto 💸📁' : 'Categorías de ingreso 💰📁'}</h3>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '16px',
            paddingBottom: '16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {categories.filter(c => c.scope === goal.type).map(cat => (
              <div
                key={cat.id}
                onClick={() => setAddingCategory(cat)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '70px',
                  cursor: 'pointer',
                  opacity: addingCategory?.id === cat.id ? 1 : 0.7
                }}
              >
                <div style={{
                  width: '50px', height: '50px',
                  borderRadius: '16px',
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '8px',
                  border: addingCategory?.id === cat.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                }}>
                  {cat.icon}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {cat.name}
                </span>
              </div>
            ))}
            <div
              onClick={() => setShowCategoriesSettings(true)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px', cursor: 'pointer'
              }}
            >
              <div style={{
                width: '50px', height: '50px', borderRadius: '16px',
                background: 'var(--bg-secondary)', border: '1px dashed var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'
              }}>
                <Plus size={24} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Nueva</span>
            </div>
          </div>

          {/* Add Category Form (if selected) */}
          <AnimatePresence>
            {addingCategory && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddCategory}
                style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', marginBottom: '24px', overflow: 'hidden' }}
              >
                <h4 style={{ margin: '0 0 12px 0' }}>Añadir {addingCategory.name}</h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Monto objetivo..."
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    required
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', borderRadius: '10px' }}>Añadir</button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Added Categories List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {goal.goal_categories?.map(gc => {
              const cat = gc.category || categories.find(c => c.id === gc.category_id);
              const currentGcAmount = (gc as any).current_amount || 0;
              const gcPercent = gc.target_amount > 0
                ? (goal.goal_type === 'budget'
                  ? Math.max(0, Math.round(((gc.target_amount - currentGcAmount) / gc.target_amount) * 100))
                  : Math.min(100, Math.round((currentGcAmount / gc.target_amount) * 100)))
                : (goal.goal_type === 'budget' ? 100 : 0);
              const barColor = (goal.goal_type === 'budget' && currentGcAmount > gc.target_amount) ? '#ef4444' : 'var(--accent-primary)';

              return (
                <div key={gc.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    {cat?.icon || '📁'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{cat?.name || 'Categoría'}</span>
                      <span style={{ fontWeight: 600 }}>{formatMoney(gc.target_amount)}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{ height: '100%', width: `${gcPercent}%`, background: barColor, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      <span>{formatMoney(currentGcAmount)}</span>
                      <span>{formatMoney(Math.max(0, gc.target_amount - currentGcAmount))}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setCategoryToRemove(gc.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', padding: '8px' }}
                  >
                    <Trash size={18} />
                  </button>
                </div>
              );
            })}
          </div>

        </motion.div>
      </div>

      <DoubleConfirmModal
        isOpen={!!categoryToRemove}
        onClose={() => setCategoryToRemove(null)}
        onConfirm={async () => {
          if (categoryToRemove) {
            await removeGoalCategory(categoryToRemove);
            setCategoryToRemove(null);
          }
        }}
        titleStep1="¿Quitar categoría?"
        descStep1="Estás a punto de quitar esta categoría."
        titleStep2="¿Estás seguro?"
        descStep2="Esta acción eliminará el objetivo asociado a esta categoría permanentemente."
      />

      {showCategoriesSettings && (
        <CategoriesSettings
          onClose={() => setShowCategoriesSettings(false)}
          initialTab={goal.type as 'personal' | 'shared'}
          hideTabs
        />
      )}
    </AnimatePresence>
  );
}
