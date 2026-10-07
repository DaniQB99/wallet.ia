import { useState, useId, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Calendar, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoals } from '../entities/goals/model/useGoals';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';
import type { Goal } from '../shared/types/database';
import GoalDetailModal from '../features/goals/ui/GoalDetailModal';
import DoubleConfirmModal from '../shared/ui/DoubleConfirmModal';

export default function Goals() {
  const goalNameId = useId();
  const startDateId = useId();
  const deadlineId = useId();

  const { formatMoney, formatDate, t } = useLocaleCurrency();
  const [tab, setTab] = useState<'personal' | 'shared'>('personal');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { goals: personalGoals, loading: loadingP, addGoal, updateGoal, deleteGoal } = useGoals('personal');
  const { goals: sharedGoals, loading: loadingS } = useGoals('shared');

  const mobileGoals = tab === 'personal' ? personalGoals : sharedGoals;
  const loadingMobile = tab === 'personal' ? loadingP : loadingS;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState<'budget' | 'savings'>('budget');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [modalContext, setModalContext] = useState<'personal' | 'shared'>('personal');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = (contextOverride?: 'personal' | 'shared') => {
    setEditingGoal(null);
    setName('');
    setGoalType('budget');
    setTargetAmount('');
    setModalContext(contextOverride || tab);
    
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);

    // Default deadline to 1 month from today
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setDeadline(nextMonth.toISOString().slice(0, 10));

    setErrorMsg(null);
    setShowCreateModal(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setGoalType((goal.goal_type as 'budget' | 'savings') || 'budget');
    setTargetAmount(goal.target_amount ? goal.target_amount.toString() : '');
    setStartDate(goal.start_date ? goal.start_date.slice(0, 10) : '');
    setDeadline(goal.deadline ? goal.deadline.slice(0, 10) : '');
    setModalContext(goal.type as 'personal' | 'shared' || 'personal');
    setErrorMsg(null);
    setShowDetailModal(false);
    setShowCreateModal(true);
  };

  const openDetailModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDetailModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(t('goalNameRequired'));
      return;
    }
    if (!startDate || !deadline) {
      setErrorMsg(t('datesRequired'));
      return;
    }
    if (new Date(startDate) > new Date(deadline)) {
      setErrorMsg(t('startDateAfterDeadlineError'));
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingGoal) {
        const err = await updateGoal(editingGoal.id, {
          name: name.trim(),
          start_date: startDate,
          deadline: deadline,
          type: modalContext,
          goal_type: goalType,
          target_amount: parseFloat(targetAmount) || 0,
        });
        if (err) throw err;
      } else {
        const err = await addGoal({
          name: name.trim(),
          start_date: startDate,
          deadline: deadline,
          type: modalContext,
          goal_type: goalType,
          category_id: null,
          icon: goalType === 'budget' ? '🎯' : '💰',
          color: goalType === 'budget' ? '#ef4444' : '#10b981',
          target_amount: parseFloat(targetAmount) || 0,
        });
        if (err) throw err;
      }
      setShowCreateModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('saveError');
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (goalId: string) => {
    setGoalToDelete(goalId);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    setSubmitting(true);
    try {
      const err = await deleteGoal(goalToDelete);
      if (err) throw err;
      setShowCreateModal(false);
      setShowDetailModal(false);
      setGoalToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('deleteError');
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Encontrar el selectedGoal actualizado en base al goals local
  const currentSelectedGoal = selectedGoal 
    ? (personalGoals.find(g => g.id === selectedGoal.id) || sharedGoals.find(g => g.id === selectedGoal.id) || selectedGoal)
    : null;

  const renderGoalCard = (goal: Goal) => {
    const target = goal.target_amount || 0;
    const current = goal.current_amount || 0;

    let percent = 0;
    if (goal.goal_type === 'budget') {
      percent = target > 0 ? Math.max(0, Math.round(((target - current) / target) * 100)) : 100;
    } else {
      percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    }
    const isOverBudget = goal.goal_type === 'budget' && current > target;

    const barColor = isOverBudget ? '#ef4444' : goal.color || 'var(--accent-primary)';

    return (
      <div
        key={goal.id}
        className="card"
        onClick={() => openDetailModal(goal)}
        style={{
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: goal.color ? `${goal.color}22` : 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
              }}
            >
              {goal.icon || (goal.goal_type === 'budget' ? '🎯' : '💰')}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{goal.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                <Calendar size={12} />
                {goal.start_date ? formatDate(goal.start_date, { day: 'numeric', month: 'short' }) : ''}
                {goal.deadline ? ' - ' + formatDate(goal.deadline, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: barColor,
            }}
          >
            {formatMoney(target)}
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: 'var(--bg-tertiary, rgba(255,255,255,0.1))',
            overflow: 'hidden',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percent}%`,
              background: barColor,
              borderRadius: '4px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {(() => {
              const label = goal.goal_type === 'budget' ? t('spent') : t('saved');
              return label.charAt(0).toUpperCase() + label.slice(1);
            })()}: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(current)}</strong>
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(Math.max(0, target - current))}</strong> {goal.goal_type === 'budget' ? t('toSpend') : t('toSave')}
          </span>
        </div>
      </div>
    );
  };

  const renderGoalsGrid = (gridGoals: Goal[], gridLoading: boolean, defaultContext?: 'personal' | 'shared') => {
    if (gridLoading) {
      return (
        <div className="empty-state">
          <div className="loading-spinner" />
          <div className="empty-state-title">{t('loadingGoals')}</div>
        </div>
      );
    }
    if (gridGoals.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            🎯
          </div>
          <h2 className="empty-state-title">{t('noGoals')}</h2>
          <p className="empty-state-desc" style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {t('createFirstGoal')}
          </p>
          <button type="button" className="btn btn-primary btn-glow" onClick={() => openCreateModal(defaultContext || tab)}>
            <Plus size={18} />
            {t('newGoal')}
          </button>
        </div>
      );
    }
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {gridGoals.map(renderGoalCard)}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>{t('goals')} - Wallet.ia</title>
        <meta name="description" content={t('goalsMetaDesc')} />
      </Helmet>
      
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          textAlign: 'center',
          padding: isDesktop ? '28px 36px 20px' : '20px 20px 16px',
        }}
      >
        <div style={{ width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{t('goals')}</h1>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              margin: '6px auto 0',
              maxWidth: isDesktop ? '800px' : '100%',
              lineHeight: 1.5,
            }}
          >
            {t('goalsDescription')}
          </p>
        </div>
      </div>

      <div className="page-content" style={{ width: '100%' }}>
        {!isDesktop && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-primary btn-glow"
              onClick={() => openCreateModal(tab)}
              style={{ width: '100%', padding: '12px', borderRadius: '14px', fontWeight: 600, fontSize: '0.95rem' }}
            >
              {t('newGoal')}
            </button>
            <div
              className="tab-group"
              style={{
                display: 'flex',
                width: '100%',
                gap: '8px',
                background: 'var(--bg-tertiary, rgba(255,255,255,0.05))',
                padding: '4px',
                borderRadius: '14px',
              }}
            >
              <button
                type="button"
                className={`btn ${tab === 'personal' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTab('personal')}
                style={{ flex: 1, padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                {t('personal')}
              </button>
              <button
                type="button"
                className={`btn ${tab === 'shared' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTab('shared')}
                style={{ flex: 1, padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                {t('shared')}
              </button>
            </div>
          </div>
        )}

        {isDesktop ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  {t('personal')}
                </h2>
                <button
                  type="button"
                  onClick={() => openCreateModal('personal')}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary-glow, rgba(99, 102, 241, 0.15))',
                    border: '1.5px solid var(--accent-primary)',
                    color: 'var(--accent-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = 'var(--accent-primary)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'var(--accent-primary-glow, rgba(99, 102, 241, 0.15))';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  title={t('newPersonalGoal')}
                  aria-label={t('newPersonalGoal')}
                >
                  <Plus size={18} />
                </button>
              </div>
              <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid var(--border-subtle)', width: '100%' }}>
                {renderGoalsGrid(personalGoals, loadingP, 'personal')}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  {t('shared')}
                </h2>
                <button
                  type="button"
                  onClick={() => openCreateModal('shared')}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary-glow, rgba(99, 102, 241, 0.15))',
                    border: '1.5px solid var(--accent-primary)',
                    color: 'var(--accent-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = 'var(--accent-primary)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'var(--accent-primary-glow, rgba(99, 102, 241, 0.15))';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  title={t('newSharedGoal')}
                  aria-label={t('newSharedGoal')}
                >
                  <Plus size={18} />
                </button>
              </div>
              <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid var(--border-subtle)', width: '100%' }}>
                {renderGoalsGrid(sharedGoals, loadingS, 'shared')}
              </div>
            </div>
          </div>
        ) : (
          renderGoalsGrid(mobileGoals, loadingMobile, tab)
        )}
      </div>

      {/* Modal para Crear / Editar Meta */}
      {showCreateModal && (
        <AnimatePresence>
          <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
            <motion.div
              className="modal animate-in"
              style={{ maxWidth: '480px', width: '100%', margin: 'auto' }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowCreateModal(false)}
                  aria-label={t('close')}
                >
                  <X size={20} />
                </button>
                <h2 className="modal-title">
                  {editingGoal
                    ? (goalType === 'budget' ? t('editBudget') : t('editSavings'))
                    : (goalType === 'budget' ? t('createBudget') : t('createSavings'))}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="card" style={{ padding: '20px', border: '1px solid var(--border)', position: 'relative', zIndex: 10, margin: 0 }}>
                {errorMsg && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '14px' }}>
                    {errorMsg}
                  </div>
                )}
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  {t('configureGoalDesc')}
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                    {t('context')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setModalContext('personal')}
                      style={{ flex: 1, padding: '8px', borderRadius: '10px', border: modalContext === 'personal' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', opacity: modalContext === 'personal' ? 1 : 0.6 }}
                    >
                      {t('personalLabel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalContext('shared')}
                      style={{ flex: 1, padding: '8px', borderRadius: '10px', border: modalContext === 'shared' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', opacity: modalContext === 'shared' ? 1 : 0.6 }}
                    >
                      {t('sharedLabel')}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                    {t('goalType')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setGoalType('budget')}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: goalType === 'budget' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', opacity: goalType === 'budget' ? 1 : 0.6 }}
                    >
                      {t('budgetSpend')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalType('savings')}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: goalType === 'savings' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', opacity: goalType === 'savings' ? 1 : 0.6 }}
                    >
                      {t('savingsDeposit')}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor={goalNameId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                    {goalType === 'budget' ? t('budgetName') : t('savingsName')}
                  </label>
                  <input
                    id={goalNameId}
                    type="text"
                    placeholder={goalType === 'budget' ? t('budgetPlaceholder') : t('savingsPlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                    {t('amount')} ({goalType === 'budget' ? t('limit') : t('target')})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '10px', fontSize: '0.875rem' }}>
                    {t('timePeriod')}
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ width: '100%' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{t('from')}</span>
                      <input
                        id={startDateId}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div style={{ width: '100%' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{t('to')}</span>
                      <input
                        id={deadlineId}
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        required
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: editingGoal ? 'space-between' : 'center', marginTop: '30px' }}>
                  {editingGoal && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDelete(editingGoal.id)}
                      disabled={submitting}
                      style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={16} /> {t('delete')}
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ width: editingGoal ? 'auto' : '100%', padding: '14px', borderRadius: '14px', fontWeight: 600 }} disabled={submitting}>
                    {submitting
                      ? t('saving')
                      : editingGoal
                        ? t('update')
                        : (goalType === 'budget' ? t('createBudget') : t('createSavings'))}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Goal Detail Modal */}
      {showDetailModal && currentSelectedGoal && (
        <GoalDetailModal
          goal={currentSelectedGoal}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => openEditModal(currentSelectedGoal)}
          onDelete={() => handleDelete(currentSelectedGoal.id)}
        />
      )}

      <DoubleConfirmModal
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={confirmDelete}
        titleStep1={t('deleteGoalConfirmTitle')}
        descStep1={t('deleteGoalConfirmDesc1')}
        titleStep2={t('deleteGoalConfirmStep2')}
        descStep2={t('deleteGoalConfirmDesc2')}
        loading={submitting}
      />
    </>
  );
}
