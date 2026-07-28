import { useState, useId } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Calendar, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoals } from '../entities/goals/model/useGoals';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';
import type { Goal } from '../shared/types/database';

/**
 * Vista central de Metas Financieras (Ahorro y Objetivos).
 * Permite visualizar el progreso de las metas personales y compartidas,
 * así como crear, editar y eliminar metas de ahorro.
 */
export default function Goals() {
  const goalNameId = useId();
  const targetAmountId = useId();
  const iconId = useId();
  const colorId = useId();
  const deadlineId = useId();

  const { formatMoney, locale, t } = useLocaleCurrency();
  const [tab, setTab] = useState<'personal' | 'shared'>('personal');
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals(tab);

  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#6366f1');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setIcon('🎯');
    setColor('#6366f1');
    setDeadline('');
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setIcon(goal.icon || '🎯');
    setColor(goal.color || '#6366f1');
    setDeadline(goal.deadline ? goal.deadline.slice(0, 10) : '');
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa un nombre para la meta');
      return;
    }
    if (isNaN(numTarget) || numTarget <= 0) {
      setErrorMsg('Por favor ingresa un monto objetivo válido');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingGoal) {
        const err = await updateGoal(editingGoal.id, {
          name: name.trim(),
          target_amount: numTarget,
          icon,
          color,
          deadline: deadline || null,
          type: tab,
        });
        if (err) throw err;
      } else {
        const err = await addGoal({
          name: name.trim(),
          target_amount: numTarget,
          icon,
          color,
          deadline: deadline || null,
          type: tab,
          start_date: new Date().toISOString().slice(0, 10),
          category_id: null,
        });
        if (err) throw err;
      }
      setShowModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar la meta';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta meta?')) return;
    setSubmitting(true);
    try {
      const err = await deleteGoal(goalId);
      if (err) throw err;
      setShowModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar la meta';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('navGoals')} - Wallet.ia</title>
        <meta name="description" content="Alcanza tus metas de ahorro compartidas y personales." />
      </Helmet>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('goals') || 'Metas'}</h1>
          <p>{t('createFirstGoal') || 'Define tus objetivos de ahorro e inversión'}</p>
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
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('personal') || 'Personales'}
          </button>
          <button
            type="button"
            className={`btn ${tab === 'shared' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('shared')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('shared') || 'Compartidas'}
          </button>
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" />
            <div className="empty-state-title">{t('loadingGoals') || 'Cargando metas...'}</div>
          </div>
        ) : goals.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <div className="empty-state-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              🎯
            </div>
            <h2 className="empty-state-title">{t('noGoals') || 'Sin metas todavía'}</h2>
            <p className="empty-state-desc" style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              {t('createFirstGoal') || 'Crea tu primer objetivo de ahorro para empezar a medir tu progreso.'}
            </p>
            <button type="button" className="btn btn-primary btn-glow" onClick={openCreateModal}>
              <Plus size={18} />
              {t('newGoal') || 'Nueva Meta'}
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
              const current = goal.current_amount || 0;
              const percent = Math.min(100, Math.round((current / goal.target_amount) * 100));

              return (
                <div
                  key={goal.id}
                  className="card"
                  onClick={() => openEditModal(goal)}
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
                        {goal.icon || '🎯'}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{goal.name}</h3>
                        {goal.deadline && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            <Calendar size={12} />
                            {new Date(goal.deadline).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: percent >= 100 ? '#22c55e' : goal.color || 'var(--accent-primary)',
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
                        background: percent >= 100 ? '#22c55e' : goal.color || 'var(--accent-primary)',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Progreso: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(current)}</strong>
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Objetivo: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(goal.target_amount)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Crear / Editar Meta */}
      {showModal && (
        <AnimatePresence>
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal-content"
              style={{ maxWidth: '480px', width: '100%', borderRadius: '20px' }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">{editingGoal ? 'Editar Meta' : 'Nueva Meta'}</h2>
                <button type="button" className="btn-icon" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                {errorMsg && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      marginBottom: '14px',
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor={goalNameId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                    Nombre de la meta
                  </label>
                  <input
                    id={goalNameId}
                    type="text"
                    placeholder="Ej. Viaje a Japón, Fondo de Emergencia..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                      background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor={targetAmountId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                    Monto Objetivo
                  </label>
                  <input
                    id={targetAmountId}
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="1000.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                      background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                      color: 'var(--text-primary)',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label htmlFor={iconId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                      Emoji / Icono
                    </label>
                    <input
                      id={iconId}
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                        background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={colorId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                      Color
                    </label>
                    <input
                      id={colorId}
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '4px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                        background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor={deadlineId} className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                    Fecha límite (Opcional)
                  </label>
                  <input
                    id={deadlineId}
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                      background: 'var(--bg-secondary, rgba(0,0,0,0.2))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: editingGoal ? 'space-between' : 'flex-end', gap: '10px' }}>
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Guardando...' : editingGoal ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </>
  );
}
