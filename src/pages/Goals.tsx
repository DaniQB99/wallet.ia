import { useEffect, useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, Trash2, ChevronRight, Calendar, Info } from 'lucide-react';
import type { Goal, GoalType } from '../types/database';
import { useLocaleCurrency } from '../contexts/LocaleCurrencyContext';

export default function Goals() {
  const [tab, setTab] = useState<GoalType>('personal');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailedGoal, setDetailedGoal] = useState<Goal | null>(null);
  const navigate = useNavigate();
  const { currency, formatMoney, prefetchRates, locale, t } = useLocaleCurrency();

    const { goals, addGoal, updateGoal, deleteGoal, loading } = useGoals(tab);
  const { transactions } = useTransactions('all');
  useEffect(() => {
    void prefetchRates(transactions.map((tx) => tx.date));
  }, [transactions, prefetchRates]);

  // Categorías para auto-vincular
  // Utilizamos el tab actual ('personal' -> personal, 'shared' -> shared)
  const categoryScope = tab === 'personal' ? 'personal' : 'shared';
  const { categories } = useCategories(categoryScope);

    const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formIcon, setFormIcon] = useState('🎯');
  const [formColor, setFormColor] = useState('#3B82F6');
  const [submitting, setSubmitting] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormName('');
    setFormTarget('');
    setFormCategory('');
    setFormDeadline('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormIcon('🎯');
    setFormColor('#3B82F6');
  };

  const handleEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setFormName(goal.name);
    setFormTarget(goal.target_amount.toString());
    setFormCategory(goal.category_id || '');

    // Parseo seguro de fecha límite
    if (goal.deadline) {
      try {
        setFormDeadline(new Date(goal.deadline).toISOString().split('T')[0]);
      } catch (e) {
        setFormDeadline('');
      }
    } else {
      setFormDeadline('');
    }

    // Parseo seguro de fecha de inicio
    if (goal.start_date) {
      try {
        setFormStartDate(new Date(goal.start_date).toISOString().split('T')[0]);
      } catch (e) {
        setFormStartDate(new Date().toISOString().split('T')[0]);
      }
    } else {
      setFormStartDate(new Date().toISOString().split('T')[0]);
    }

    setFormIcon(goal.icon || '🎯');
    setFormColor(goal.color || '#3B82F6');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const targetAmt = parseFloat(formTarget);
    let error;

    if (editingId) {
      error = await updateGoal(editingId, {
        name: formName,
        target_amount: targetAmt,
        deadline: formDeadline || undefined,
        start_date: formStartDate,
        category_id: formCategory || undefined,
        icon: formIcon,
        color: formColor
      });
    } else {
      error = await addGoal({
        type: tab,
        name: formName,
        target_amount: targetAmt,
        deadline: formDeadline || undefined,
        start_date: formStartDate,
        category_id: formCategory || undefined,
        icon: formIcon,
        color: formColor
      });
    }

    setSubmitting(false);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      handleCloseModal();
    }
  };

  const handleDelete = async () => {
    if (!editingId || !window.confirm('¿Seguro que quieres eliminar esta meta? Las transacciones asociadas no se borrarán, pero perderán el vínculo.')) return;
    setSubmitting(true);
    const error = await deleteGoal(editingId);
    setSubmitting(false);
    if (!error) handleCloseModal();
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('goals')}</h1>
          <p>{t('goalsLinkedByCategory')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          {t('newGoal')}
        </button>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div style={{ marginBottom: '24px' }}>
          <div className="toggle-group">
            <button
              className={`toggle-item ${tab === 'personal' ? 'active' : ''}`}
              onClick={() => setTab('personal')}
            >
              {t('personal')}
            </button>
            <button
              className={`toggle-item ${tab === 'shared' ? 'active' : ''}`}
              onClick={() => setTab('shared')}
            >
              {t('shared')}
            </button>
          </div>
        </div>

        {/* List of Goals */}
        <div className="goals-grid" style={{ display: 'grid', gap: '16px' }}>
          {loading ? (
            <div className="loading-state">{t('loadingGoals')}</div>
          ) : goals.length === 0 ? (
            <div className="empty-state">
              <Target size={48} color="var(--text-tertiary)" />
              <h3>{t('noGoals')}</h3>
              <p>{t('createFirstGoal')}</p>
            </div>
          ) : (
            goals.map(goal => {
              const progressPercentage = Math.min(100, (goal.current_amount / goal.target_amount) * 100) || 0;

              return (
                <div key={goal.id} className="card animate-in" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '20px' }} onClick={() => setDetailedGoal(goal)}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="transaction-icon" style={{ background: `${goal.color}18`, fontSize: '1.5rem', marginRight: '16px' }}>
                        {goal.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{goal.name}</h3>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                            {t('since')}: {(() => {
                              try {
                                return goal.start_date ? new Date(goal.start_date).toLocaleDateString(locale) : 'N/A';
                              } catch(e) { return 'Fecha inválida'; }
                            })()}
                          </span>
                          {goal.deadline && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              <Target size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                              {t('deadline')}: {(() => {
                                try {
                                  return new Date(goal.deadline).toLocaleDateString(locale);
                                } catch(e) { return 'Fecha inválida'; }
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatMoney(goal.current_amount)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                          de {formatMoney(goal.target_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${progressPercentage}%`,
                        height: '100%',
                        background: goal.color,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                      }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                        <Info size={12} style={{ marginRight: '4px' }} />
                        {t('tapToViewMovements')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: goal.color, fontWeight: 600 }}>
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px 20px',
                      background: 'var(--bg-secondary)',
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <button
                      className="btn-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleEdit(goal);
                      }}
                      style={{
                        color: 'var(--primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: 'var(--primary)10'
                      }}
                    >
                      {t('editGoal')}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Goal Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editingId ? 'Editar Meta' : 'Nueva Meta'}</div>
            <div className="modal-subtitle">Establece tu objetivo de ahorro</div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del objetivo</label>
                <input
                  type="text"
                  className="form-input"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej. Coche nuevo, Viaje a Japón..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cantidad Objetivo ({currency})</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formTarget}
                    onChange={e => setFormTarget(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha Límite (Opcional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formDeadline}
                    onChange={e => setFormDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha de Inicio</label>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                    Solo contarán movimientos desde este día.
                  </p>
                  <input
                    type="date"
                    className="form-input"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Categoría Asociada</label>
                <div className="modal-subtitle" style={{ fontSize: '0.75rem', marginTop: '-4px', marginBottom: '8px' }}>
                  Los ingresos/gastos de esta categoría sumarán automáticamente a esta meta.
                </div>
                <select
                  className="form-select"
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  required
                >
                  <option value="">Selecciona una categoría...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Icono (Emoji)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formIcon}
                    onChange={e => setFormIcon(e.target.value)}
                    maxLength={2}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color del progreso</label>
                  <input
                    type="color"
                    className="form-input"
                    value={formColor}
                    onChange={e => setFormColor(e.target.value)}
                    style={{ height: '42px', padding: '2px 8px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                {editingId && (
                  <button
                    type="button"
                    className="btn"
                    style={{ background: 'var(--danger)15', color: 'var(--danger)' }}
                    onClick={handleDelete}
                    disabled={submitting}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div style={{ flex: 1 }}></div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Guardar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Detailed Goal Transactions Modal */}
      {detailedGoal && (
        <div className="modal-overlay" onClick={() => setDetailedGoal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div className="transaction-icon" style={{ background: `${detailedGoal.color}18`, marginRight: '16px' }}>
                {detailedGoal.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div className="modal-title" style={{ marginBottom: '4px' }}>{detailedGoal.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {t('movements')} {t('since').toLowerCase()} {new Date(detailedGoal.start_date).toLocaleDateString(locale)}
                </div>
              </div>
              <button className="btn-icon" onClick={() => setDetailedGoal(null)}>×</button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
              {(() => {
                const linkedTx = transactions.filter(tx => {
                  const isGoalMatch = tx.goal_id === detailedGoal.id;
                  const isCategoryMatch = detailedGoal.category_id &&
                                        tx.category_id === detailedGoal.category_id &&
                                        tx.type === detailedGoal.type;
                  const isDateMatch = tx.date >= detailedGoal.start_date;
                  return (isGoalMatch || isCategoryMatch) && isDateMatch;
                });

                if (linkedTx.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
                      <Calendar size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p>No hay movimientos registrados para esta meta desde su fecha de inicio.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {linkedTx.map(tx => (
                      <div
                        key={tx.id}
                        className="card"
                        style={{
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)'
                        }}
                        onClick={() => navigate(`/transactions?edit=${tx.id}`)}
                      >
                        <div className="transaction-icon" style={{ fontSize: '1.2rem', marginRight: '12px', width: '36px', height: '36px' }}>
                          {tx.category?.icon || '💰'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{tx.description || tx.category?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            {new Date(tx.date).toLocaleDateString(locale)}
                          </div>
                        </div>
                        <div style={{
                          fontWeight: 700,
                          color: tx.amount >= 0 ? 'var(--success)' : 'var(--text-primary)'
                        }}>
                          {tx.amount >= 0 ? '+' : ''}{formatMoney(tx.amount, tx.date)}
                        </div>
                        <ChevronRight size={16} style={{ marginLeft: '8px', color: 'var(--text-tertiary)' }} />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setDetailedGoal(null)}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
