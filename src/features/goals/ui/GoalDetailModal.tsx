import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoals } from '../../../entities/goals/model/useGoals';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import type { Goal, Category } from '../../../shared/types/database';
import DoubleConfirmModal from '../../../shared/ui/DoubleConfirmModal';
import CategoriesSettings from '../../settings/ui/CategoriesSettings';
import CategoryDetailModal from './CategoryDetailModal';
import { useCategories } from '../../../entities/categories/model/useCategories';

interface GoalDetailModalProps {
  goal: Goal;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function GoalDetailModal({ goal, onClose, onEdit, onDelete }: GoalDetailModalProps) {
  const { addGoalCategory, removeGoalCategory, updateGoalCategory } = useGoals(goal.type as 'personal' | 'shared');
  const { categories } = useCategories();
  const { formatMoney, formatDate, t, translateEntityName } = useLocaleCurrency();
  const [addingCategory, setAddingCategory] = useState<Category | null>(null);
  const [targetInput, setTargetInput] = useState<string>('');
  const [categoryToRemove, setCategoryToRemove] = useState<string | null>(null);
  const [showCategoriesSettings, setShowCategoriesSettings] = useState(false);
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<{ gc: any, cat: Category } | null>(null);

  const percent = goal.target_amount && goal.target_amount > 0
    ? (goal.goal_type === 'budget'
      ? Math.max(0, Math.round((((goal.target_amount - (goal.current_amount || 0))) / goal.target_amount) * 100))
      : Math.min(100, Math.round(((goal.current_amount || 0) / goal.target_amount) * 100)))
    : (goal.goal_type === 'budget' ? 100 : 0);

  const localFormatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return formatDate(dateString, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingCategory) return;
    const numTarget = parseFloat(targetInput);
    if (isNaN(numTarget) || numTarget <= 0) return;

    const existingGc = goal.goal_categories?.find(gc => gc.category_id === addingCategory.id);

    if (existingGc) {
      await updateGoalCategory(existingGc.id, { target_amount: numTarget });
    } else {
      await addGoalCategory({
        goal_id: goal.id,
        category_id: addingCategory.id,
        target_amount: numTarget
      });
    }

    setAddingCategory(null);
    setTargetInput('');
  };

  const barColor = goal.goal_type === 'budget' ? '#ef4444' : '#10b981';

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ zIndex: 1000, padding: '20px' }} onClick={onClose}>
        <motion.div
          className="modal-content card"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: 'min(92vh, 92dvh, 760px)',
            maxWidth: '600px',
            borderRadius: '20px',
            background: 'var(--bg-secondary)',
            padding: '24px',
            overflowY: 'auto',
            margin: 'auto'
          }}
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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
              {goal.goal_type === 'budget' ? t('budgetDetail') : t('savingsDetail')}
            </h2>
          </div>

          {/* Goal Overview Card */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{goal.name}</h3>
                <div style={{ fontSize: '0.85rem', color: goal.color || 'var(--accent-primary)', marginTop: '4px' }}>
                  {localFormatDate(goal.start_date)} - {localFormatDate(goal.deadline)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)' }}>
                <button onClick={onEdit} style={{ background: 'none', border: 'none', color: goal.color || 'var(--accent-primary)', cursor: 'pointer' }}><Edit2 size={18} /></button>
                <button onClick={onDelete} style={{ background: 'none', border: 'none', color: goal.color || 'var(--accent-primary)', cursor: 'pointer' }}><Trash2 size={18} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{formatMoney(goal.target_amount || 0)}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{percent}%</div>
            </div>

            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ height: '100%', width: `${percent}%`, background: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>{formatMoney(goal.current_amount || 0)} {goal.goal_type === 'budget' ? t('spent') : t('saved')}</span>
              <span>{formatMoney(Math.max(0, (goal.target_amount || 0) - (goal.current_amount || 0)))} {goal.goal_type === 'budget' ? t('toSpend') : t('toSave')}</span>
            </div>
          </div>

          {/* Categories Carousel */}
          <h3 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>{goal.goal_type === 'budget' ? `${t('expenseCategories')} 💸📁` : `${t('incomeCategories')} 💰📁`}</h3>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '16px',
            paddingTop: '4px',
            paddingBottom: '16px',
            paddingRight: '20px',
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
                  {translateEntityName(cat.name, 'category')}
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{t('new')}</span>
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
                <h4 style={{ margin: '0 0 12px 0' }}>{t('add')} {translateEntityName(addingCategory.name, 'category')}</h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    required
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', borderRadius: '10px' }}>{t('add')}</button>
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
              const barColor = goal.goal_type === 'budget' ? '#ef4444' : '#10b981';

              return (
                <div
                  key={gc.id}
                  className="card"
                  onClick={() => setSelectedCategoryDetail({ gc, cat: cat! })}
                  style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    {cat?.icon || '📁'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{cat?.name ? translateEntityName(cat.name, 'category') : t('category')}</span>
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
                  <div style={{ color: 'var(--text-tertiary)' }}>
                    <ChevronRight size={20} />
                  </div>
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
        titleStep1={t('removeCategoryTitle')}
        descStep1={t('removeCategoryDesc1')}
        titleStep2={t('deleteTransactionConfirmTitle')}
        descStep2={t('removeCategoryDesc2')}
      />

      {showCategoriesSettings && (
        <CategoriesSettings
          onClose={() => setShowCategoriesSettings(false)}
          initialTab={goal.type as 'personal' | 'shared'}
          hideTabs
        />
      )}

      {selectedCategoryDetail && (
        <CategoryDetailModal
          goal={goal}
          goalCategory={selectedCategoryDetail.gc}
          category={selectedCategoryDetail.cat}
          onClose={() => setSelectedCategoryDetail(null)}
          onRemoveCategory={() => removeGoalCategory(selectedCategoryDetail.gc.id)}
          onEditTarget={() => {
            // Cierra el detalle y prepara la adición
            setSelectedCategoryDetail(null);
            setAddingCategory(selectedCategoryDetail.cat);
            setTargetInput(selectedCategoryDetail.gc.target_amount.toString());
          }}
        />
      )}
    </AnimatePresence>
  );
}
