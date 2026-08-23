import { useState, useId } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Calendar, Trash2, ChevronLeft } from 'lucide-react';
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

  const { formatMoney, locale, t } = useLocaleCurrency();
  const [tab, setTab] = useState<'personal' | 'shared'>('personal');
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals(tab);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState<'budget' | 'savings'>('budget');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingGoal(null);
    setName('');
    setGoalType('budget');
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
    setStartDate(goal.start_date ? goal.start_date.slice(0, 10) : '');
    setDeadline(goal.deadline ? goal.deadline.slice(0, 10) : '');
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
      setErrorMsg('Por favor ingresa un nombre para el presupuesto');
      return;
    }
    if (!startDate || !deadline) {
      setErrorMsg('Las fechas son obligatorias');
      return;
    }
    if (new Date(startDate) > new Date(deadline)) {
      setErrorMsg('La fecha de inicio no puede ser posterior al fin');
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
          type: tab,
          goal_type: goalType,
        });
        if (err) throw err;
      } else {
        const err = await addGoal({
          name: name.trim(),
          start_date: startDate,
          deadline: deadline,
          type: tab,
          goal_type: goalType,
          category_id: null,
          icon: goalType === 'budget' ? '🎯' : '💰',
          color: goalType === 'budget' ? '#ef4444' : '#10b981',
          target_amount: 0,
        });
        if (err) throw err;
      }
      setShowCreateModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
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
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Encontrar el selectedGoal actualizado en base al goals local
  const currentSelectedGoal = selectedGoal ? goals.find(g => g.id === selectedGoal.id) || selectedGoal : null;

  return (
    <>
      <Helmet>
        <title>{t('navGoals') || 'Metas (Presupuestos y Ahorros)'} - Wallet.ia</title>
        <meta name="description" content="Gestiona tus presupuestos compartidos y ahorros." />
      </Helmet>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('goals') || 'Metas'}</h1>
          <p>{t('createFirstGoal') || 'Controla tus gastos asignando límites o crea metas de ahorro'}</p>
        </div>
        <button type="button" className="btn btn-primary btn-glow" onClick={openCreateModal}>
          <Plus size={18} />
          {t('newGoal') || 'Nueva Meta'}
        </button>
      </div>

      <div className="page-content">
        {/* Toggle Tabs */}
        <div
          className="tab-group"
          style={{
            display: 'inline-flex',
            gap: '8px',
            background: 'var(--bg-tertiary, rgba(255,255,255,0.05))',
            padding: '4px',
            borderRadius: '14px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            className={`btn ${tab === 'personal' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('personal')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            {t('personal') || 'Personales'}
          </button>
          <button
            type="button"
            className={`btn ${tab === 'shared' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('shared')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            {t('shared') || 'Compartidas'}
          </button>
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" />
            <div className="empty-state-title">Cargando presupuestos...</div>
          </div>
        ) : goals.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <div className="empty-state-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              🎯
            </div>
            <h2 className="empty-state-title">Sin metas todavía</h2>
            <p className="empty-state-desc" style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              Crea tu primera meta de presupuesto o de ahorro para empezar a controlar tu dinero por categorías.
            </p>
            <button type="button" className="btn btn-primary btn-glow" onClick={openCreateModal}>
              <Plus size={18} />
              Nueva Meta
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            {goals.map((goal) => {
              const target = goal.target_amount || 0;
              const current = goal.current_amount || 0;

              let percent = 0;
              if (goal.goal_type === 'budget') {
                percent = target > 0 ? Math.max(0, Math.round(((target - current) / target) * 100)) : 100;
              } else {
                percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              }
              const isOverBudget = goal.goal_type === 'budget' && current > target;
              const catsCount = goal.goal_categories?.length || 0;
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
                          {goal.start_date ? new Date(goal.start_date).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : ''}
                          {goal.deadline ? ' - ' + new Date(goal.deadline).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: barColor,
                      }}
                    >
                      {percent}%
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
                      {goal.goal_type === 'budget' ? 'Gastado:' : 'Ahorrado:'} <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(current)}</strong>
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Objetivo ({catsCount} cats): <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(target)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Crear / Editar Meta */}
      {showCreateModal && (
        <AnimatePresence>
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <motion.div
              className="modal-content"
              style={{ maxWidth: '480px', width: '100%', borderRadius: '20px' }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <button type="button" className="btn-icon" onClick={() => setShowCreateModal(false)}>
                  <ChevronLeft size={20} />
                </button>
                <h2 className="modal-title" style={{ flex: 1, textAlign: 'center', paddingRight: '32px' }}>
                  {editingGoal
                    ? (goalType === 'budget' ? 'Editar presupuesto' : 'Editar ahorro')
                    : (goalType === 'budget' ? 'Crear presupuesto' : 'Crear ahorro')}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                {errorMsg && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '14px' }}>
                    {errorMsg}
                  </div>
                )}
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Configura los detalles de tu presupuesto
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                    Tipo de Meta
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setGoalType('budget')}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: goalType === 'budget' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', opacity: goalType === 'budget' ? 1 : 0.6 }}
                    >
                      Presupuesto (Gastar)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalType('savings')}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: goalType === 'savings' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', opacity: goalType === 'savings' ? 1 : 0.6 }}
                    >
                      Ahorro (Ingresar)
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor={goalNameId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                    {goalType === 'budget' ? 'Nombre del presupuesto' : 'Nombre del ahorro'}
                  </label>
                  <input
                    id={goalNameId}
                    type="text"
                    placeholder={goalType === 'budget' ? 'Presupuesto Agosto' : 'Ahorro Vacaciones'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                    Período de tiempo
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id={startDateId}
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                    <input
                      id={deadlineId}
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      required
                      style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
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
                      <Trash2 size={16} /> Eliminar
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ width: editingGoal ? 'auto' : '100%', padding: '14px', borderRadius: '14px', fontWeight: 600 }} disabled={submitting}>
                    {submitting
                      ? 'Guardando...'
                      : editingGoal
                        ? 'Actualizar'
                        : (goalType === 'budget' ? 'Crear presupuesto' : 'Crear ahorro')}
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
        titleStep1="¿Eliminar meta?"
        descStep1="Estás a punto de eliminar esta meta y todo su progreso."
        titleStep2="¿Estás seguro?"
        descStep2="Esta acción no se puede deshacer. Todos los datos asociados se perderán."
        loading={submitting}
      />
    </>
  );
}
