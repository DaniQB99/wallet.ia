import { useState, useEffect } from 'react';
import { useAccounts } from '../../../entities/accounts/model/useAccounts';
import { X, Edit, Trash2, CreditCard, Users, User } from 'lucide-react';
import { useCouple } from '../../auth/model/useCouple';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import type { Account } from '../../../shared/types/database';
import DoubleConfirmModal from '../../../shared/ui/DoubleConfirmModal';

const COLOR_PRESETS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B',
  '#EF4444', '#3B82F6', '#8B5CF6', '#F97316',
  '#06B6D4', '#84CC16', '#64748B', '#000000'
];

/**
 * Componente modal interactivo para gestionar (crear, editar, eliminar) cuentas y tarjetas financieras.
 * Permite parametrizar detalles formales como el saldo, nombre, apariencia visual y alcance (personal/compartida).
 * Dependiendo del perfil de la pareja, expone configuraciones de cuentas conjuntas.
 *
 * @param props - Propiedades del componente, incluyendo la función para cerrarlo.
 */
interface AccountsSettingsProps {
  onClose: () => void;
  initialEditingAccountId?: string | null;
}

export default function AccountsSettings({ onClose, initialEditingAccountId }: AccountsSettingsProps) {
  const { accounts, addAccount, updateAccount, deleteAccount, loading } = useAccounts();
  const { currency, formatMoney, t, translateEntityName } = useLocaleCurrency();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0');
  const [icon, setIcon] = useState('🏦');
  const [color, setColor] = useState('#6366F1');
  const [scope, setScope] = useState<'personal' | 'shared'>('personal');

  const { couple } = useCouple();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialEditingAccountId && accounts.length > 0) {
      const target = accounts.find(a => a.id === initialEditingAccountId);
      if (target) {
        setEditingId(target.id);
        setName(target.name);
        setBalance(target.balance ? target.balance.toString() : '0');
        setIcon(target.icon || '🏦');
        setColor(target.color || '#6366F1');
        setScope((target.scope as 'personal' | 'shared') || 'personal');
      }
    }
  }, [initialEditingAccountId, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accountData = {
      name,
      balance: parseFloat(balance),
      icon,
      color,
      scope,
      couple_id: scope === 'shared' && couple?.status === 'active' ? couple.id : undefined
    };

    if (editingId) {
      await updateAccount(editingId, accountData);
    } else {
      await addAccount(accountData);
    }
    resetForm();
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);
    setName(acc.name);
    setBalance(acc.balance.toString());
    setIcon(acc.icon || '🏦');
    setColor(acc.color || '#6366F1');
    setScope((acc.scope as 'personal' | 'shared') || 'personal');
  };

  const handleDelete = (id: string) => {
    setAccountToDelete(id);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    setDeleting(true);
    const error = await deleteAccount(accountToDelete);
    setDeleting(false);

    if (error) {
      alert(`${t('delete')} - ${String((error as Error).message || '')}`);
    }
    setAccountToDelete(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setBalance('0');
    setIcon('🏦');
    setColor('#6366F1');
    setScope('personal');
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
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
          <h2 className="modal-title">
            {t('accountsAndCards')}
          </h2>
        </div>

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

              <AnimatePresence>
                {showEmojiPicker && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1099 }} onClick={() => setShowEmojiPicker(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
                      animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                      exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
                      style={{ position: 'fixed', top: '50%', left: '50%', zIndex: 1100 }}
                    >
                      <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', width: '352px', maxWidth: 'calc(100vw - 32px)' }}>
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji: { native: string }) => { setIcon(emoji.native); setShowEmojiPicker(false); }}
                          theme="dark"
                          locale="es"
                          set="native"
                        />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('accountName')}
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

              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1100, marginTop: '8px' }}
                  >
                    <div className="card" style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', boxShadow: 'var(--shadow-lg)', border: `2px solid ${color}` }}>
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

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block' }}>
              {t('currentBalance')}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                required
                value={balance}
                onChange={e => {
                  const val = e.target.value.replace(/,/g, '.');
                  if (/^-?\d*\.?\d*$/.test(val) || val === '') {
                    setBalance(val);
                  }
                }}
                className="form-input"
                style={{ width: '100%', height: '44px', paddingLeft: '44px', paddingRight: '20px', textAlign: 'right', fontSize: '1.05rem', fontWeight: 600, borderRadius: '12px' }}
              />
              <span style={{ position: 'absolute', left: '16px', color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: 600 }}>
                {currency}
              </span>
            </div>
          </div>

          {couple?.status === 'active' && (
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block' }}>
                {t('accountType')}
              </label>
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
                }}
              >
                <button
                  type="button"
                  onClick={() => setScope('personal')}
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
                    background: scope === 'personal' ? 'var(--accent-primary)' : 'transparent',
                    color: scope === 'personal' ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: scope === 'personal' ? '0 4px 14px var(--accent-primary-glow, rgba(99,102,241,0.35))' : 'none',
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
                  onClick={() => setScope('shared')}
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
                    background: scope === 'shared' ? 'var(--accent-primary)' : 'transparent',
                    color: scope === 'shared' ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: scope === 'shared' ? '0 4px 14px var(--accent-primary-glow, rgba(99,102,241,0.35))' : 'none',
                    minWidth: 0,
                  }}
                >
                  <Users size={16} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('sharedLabel')}
                  </span>
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ flex: 1 }}>{t('cancel')}</button>
            )}
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              {editingId ? t('updateAccount') : t('createAccountAction')}
            </button>
          </div>
        </form>

        <div className="transaction-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="loading-spinner" />
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              {t('noAccountsYet')}
            </div>
          ) : (
            accounts.map(acc => (
              <div key={acc.id} className="transaction-item" style={{ background: 'var(--bg-secondary)', marginBottom: '8px', borderRadius: 'var(--radius-md)' }}>
                <div className="transaction-icon" style={{ background: `${acc.color || '#6366F1'}15`, color: acc.color || '#6366F1' }}>
                  {acc.icon || <CreditCard size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="transaction-title" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {translateEntityName(acc.name, 'account')}
                    {acc.scope === 'shared' && <Users size={14} color="var(--primary)" />}
                  </div>
                  <div className="transaction-amount" style={{ color: acc.balance >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem', fontWeight: 600 }}>
                    {formatMoney(acc.balance)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn-icon" onClick={() => handleEdit(acc)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(acc.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Custom Confirmation Modal */}
        <DoubleConfirmModal
          isOpen={!!accountToDelete}
          onClose={() => setAccountToDelete(null)}
          onConfirm={confirmDelete}
          titleStep1={t('deleteAccountTitle')}
          descStep1={t('deleteAccountDesc')}
          titleStep2={t('finalConfirmation')}
          descStep2={t('finalConfirmationDesc')}
          loading={deleting}
        />
      </motion.div>
    </div>
  );
}
