import { useState } from 'react';
import { useAccounts } from '../../../entities/accounts/model/useAccounts';
import { X, Edit, Trash2, CreditCard, Users, User } from 'lucide-react';
import { useCouple } from '../../auth/model/useCouple';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';

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
export default function AccountsSettings({ onClose }: { onClose: () => void }) {
  const { accounts, addAccount, updateAccount, deleteAccount, loading } = useAccounts();
  const { currency, formatMoney, t } = useLocaleCurrency();

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

  const handleEdit = (acc: { id: string; name: string; balance: number; icon: string; color: string; scope?: 'personal' | 'shared' | null }) => {
    setEditingId(acc.id);
    setName(acc.name);
    setBalance(acc.balance.toString());
    setIcon(acc.icon || '🏦');
    setColor(acc.color || '#6366F1');
    setScope(acc.scope || 'personal');
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
          <h2 className="modal-title">{t('accountsAndCards')}</h2>
          <button className="btn-icon" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)' }}>
            <X size={20} />
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
                        onEmojiSelect={(emoji: { native: string }) => { setIcon(emoji.native); setShowEmojiPicker(false); }}
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
              <label className="form-label">{t('accountName')}</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('accountPlaceholder')}
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

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">{t('currentBalance')}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                step="0.01"
                required
                value={balance}
                onChange={e => setBalance(e.target.value)}
                className="form-input"
                style={{ width: '100%', paddingLeft: '40px', paddingRight: '32px', textAlign: 'right' }}
              />
              <span style={{ position: 'absolute', left: '16px', color: 'var(--text-tertiary)' }}>
                {currency}
              </span>
            </div>
          </div>

          {couple?.status === 'active' && (
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">{t('accountType')}</label>
              <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
                <button
                  type="button"
                  className={`btn ${scope === 'personal' ? 'btn-primary' : ''}`}
                  onClick={() => setScope('personal')}
                  style={{ flex: 1, color: scope === 'personal' ? undefined : 'var(--text-secondary)' }}
                >
                  <User size={18} style={{ marginRight: '8px' }} />
                  {t('personalLabel')}
                </button>
                <button
                  type="button"
                  className={`btn ${scope === 'shared' ? 'btn-primary' : ''}`}
                  onClick={() => setScope('shared')}
                  style={{ flex: 1, color: scope === 'shared' ? undefined : 'var(--text-secondary)' }}
                >
                  <Users size={18} style={{ marginRight: '8px' }} />
                  {t('joint')}
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
                    {acc.name}
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
        <AnimatePresence>
          {accountToDelete && (
            <div className="modal-overlay" style={{ zIndex: 1200, background: 'rgba(0,0,0,0.8)' }}>
              <motion.div
                className="card"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{ maxWidth: '320px', width: '90%', textAlign: 'center', padding: '24px' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>
                  <Trash2 size={48} style={{ margin: '0 auto' }} />
                </div>
                <h3 style={{ marginBottom: '12px' }}>{t('deleteAccountTitle')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  {t('deleteAccountDesc')}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setAccountToDelete(null)} style={{ flex: 1 }}>
                    {t('cancel')}
                  </button>
                  <button
                    className={`btn btn-danger ${deleting ? 'disabled' : ''}`}
                    onClick={confirmDelete}
                    style={{ flex: 1 }}
                    disabled={deleting}
                  >
                    {deleting ? t('deleting') : t('delete')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
