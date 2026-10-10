import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, Copy, Check, UserPlus, Unlink, Loader2, CreditCard } from 'lucide-react';
import { useCouple } from '../../auth/model/useCouple';
import { useAccounts } from '../../../entities/accounts/model/useAccounts';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import { getSupabaseErrorI18nKey } from '../../../shared/lib/supabaseErrors';
import DoubleConfirmModal from '../../../shared/ui/DoubleConfirmModal';

interface PartnerSettingsProps {
  onClose: () => void;
}

/**
 * Modal central para el manejo de la característica de "Finanzas Compartidas".
 * Encapsula la lógica de invitaciones (generar o aceptar códigos efímeros), el toggle
 * interactivo para los permisos de edición sobre movimientos conjuntos, y la zona de peligro
 * para desvincular un partner activo.
 *
 * @param props - Objeto de propiedades con la acción de cierre.
 */
export default function PartnerSettings({ onClose }: PartnerSettingsProps) {
  const { t, formatMoney } = useLocaleCurrency();
  const { couple, partner, loading, generateInvite, acceptInvite, unlinkCouple, togglePermission } = useCouple();
  const { accounts } = useAccounts();
  const sharedAccounts = accounts.filter(a => a.scope === 'shared');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [acceptCode, setAcceptCode] = useState(['', '', '', '', '', '']);
  const [acceptError, setAcceptError] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [togglingPerm, setTogglingPerm] = useState(false);

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    const code = await generateInvite();
    if (code) {
      setInviteCode(code);
      setShowInviteModal(true);
    }
    setGeneratingCode(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAcceptCodeChange = (index: number, value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      const newCode = [...acceptCode];
      chars.forEach((c, idx) => {
        if (index + idx < 6) newCode[index + idx] = c;
      });
      setAcceptCode(newCode);
      setAcceptError('');
      const nextIdx = Math.min(index + chars.length, 5);
      document.getElementById(`accept-code-${nextIdx}`)?.focus();
      return;
    }
    const newCode = [...acceptCode];
    newCode[index] = clean;
    setAcceptCode(newCode);
    setAcceptError('');

    // Auto - foco en la siguiente entrada
    if (clean && index < 5) {
      const next = document.getElementById(`accept-code-${index + 1}`);
      next?.focus();
    }
  };

  const handleAcceptPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    const chars = pasted.split('');
    const newCode = ['', '', '', '', '', ''];
    chars.forEach((c, idx) => {
      if (idx < 6) newCode[idx] = c;
    });
    setAcceptCode(newCode);
    setAcceptError('');
    const nextIdx = Math.min(chars.length, 5);
    document.getElementById(`accept-code-${nextIdx}`)?.focus();
  };

  const handleAcceptKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !acceptCode[index] && index > 0) {
      const prev = document.getElementById(`accept-code-${index - 1}`);
      prev?.focus();
    }
  };

  const handleAcceptInvite = async () => {
    const fullCode = acceptCode.join('');
    if (fullCode.length !== 6) {
      setAcceptError(t('enterCodeDesc'));
      return;
    }
    setAcceptLoading(true);
    const result = await acceptInvite(fullCode);
    if (result.error) {
      setAcceptError(t(getSupabaseErrorI18nKey(result.error)));
    } else {
      setShowAcceptModal(false);
      setAcceptCode(['', '', '', '', '', '']);
    }
    setAcceptLoading(false);
  };

  const handleUnlink = async () => {
    await unlinkCouple();
    setShowUnlinkConfirm(false);
  };

  return createPortal(
    <>
      <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div
          className="modal animate-in"
          style={{ width: '100%', maxWidth: '460px', padding: '24px 20px', margin: 'auto' }}
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          {/* Header estandarizado */}
          <div style={{ position: 'relative', marginBottom: '20px', width: '100%', flexShrink: 0 }}>
            <div className="modal-header" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label={t('close')}
              >
                <X size={20} />
              </button>
              <h2 className="modal-title">
                {t('partnerStatus')}
              </h2>
            </div>
            {(!couple || !partner) && (
              <p className="modal-subtitle" style={{ textAlign: 'center', margin: '6px auto 0 auto' }}>
                {t('invitePartnerDesc')}
              </p>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <Loader2 size={32} className="loading-spinner" />
            </div>
          ) : couple && partner ? (
            /* ─── ESTADO VINCULADO ─── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div className="partner-card" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)' }}>
                <div className="avatar avatar-lg" style={{ background: 'var(--accent-gradient)', color: 'white' }}>
                  {partner.display_name?.charAt(0) || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '2px' }}>
                    {partner.display_name || t('partner')}
                  </div>
                  <div className="partner-status">
                    <span className="partner-status-dot" />
                    {t('linked')}
                  </div>
                </div>
              </div>

              {/* ─── Toggle de permiso ─── */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{t('sharedPermission')}</h4>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '12px', lineHeight: 1.4 }}>
                  {t('permissionDesc')}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn ${couple.shared_permission === 'read_only' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: '0.8rem', padding: '8px 12px', gap: '4px' }}
                    onClick={async () => {
                      if (couple.shared_permission !== 'read_only') {
                        setTogglingPerm(true);
                        await togglePermission();
                        setTogglingPerm(false);
                      }
                    }}
                    disabled={togglingPerm}
                  >
                    🔒 {t('readOnly')}
                  </button>
                  <button
                    className={`btn ${couple.shared_permission === 'read_write' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: '0.8rem', padding: '8px 12px', gap: '4px' }}
                    onClick={async () => {
                      if (couple.shared_permission !== 'read_write') {
                        setTogglingPerm(true);
                        await togglePermission();
                        setTogglingPerm(false);
                      }
                    }}
                    disabled={togglingPerm}
                  >
                    ✏️ {t('readWrite')}
                  </button>
                </div>
              </div>

              {/* ─── Cuentas y Tarjetas Compartidas ─── */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={15} color="var(--accent-primary)" />
                    {t('sharedCardsTitle')}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    {sharedAccounts.length}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '12px', lineHeight: 1.4 }}>
                  {t('sharedCardsDesc')}
                </p>

                {sharedAccounts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sharedAccounts.map(acc => (
                      <div
                        key={acc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.25rem' }}>{acc.icon || '💳'}</span>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{acc.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{acc.currency}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatMoney(acc.balance, acc.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                    }}
                  >
                    {t('noSharedCardsYet')}
                  </div>
                )}
              </div>

              {/* ─── Zona de peligro ─── */}
              <div style={{ padding: '16px 20px', background: 'rgba(239, 68, 68, 0.04)' }}>
                <h4 style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>{t('dangerZone')}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '12px', lineHeight: 1.4 }}>
                  {t('unlinkWarning')}
                </p>
                <button
                  className="btn btn-danger"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  onClick={() => setShowUnlinkConfirm(true)}
                >
                  <Unlink size={16} /> {t('unlinkPartner')}
                </button>
              </div>
            </div>
          ) : (
            /* ─── ESTADO DESVINCULADO ─── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flexDirection: 'column', height: 'auto', padding: '22px 14px', gap: '10px' }}
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                >
                  {generatingCode ? <Loader2 size={24} className="loading-spinner" /> : <UserPlus size={24} />}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t('invite')}</span>
                    <span style={{ fontSize: '0.72rem', opacity: 0.8, fontWeight: 400 }}>{t('giveMyCode')}</span>
                  </div>
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ flexDirection: 'column', height: 'auto', padding: '22px 14px', gap: '10px' }}
                  onClick={() => setShowAcceptModal(true)}
                >
                  <UserCheck size={24} color="var(--accent-primary)" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t('join')}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>{t('iHaveCode')}</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── SUB-MODAL 1: TU CÓDIGO DE INVITACIÓN (Portal a document.body) ─── */}
      <AnimatePresence>
        {showInviteModal && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              className="modal animate-in"
              style={{
                width: '100%',
                maxWidth: '440px',
                padding: '24px 20px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                margin: 'auto',
              }}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header estandarizado */}
              <div style={{ position: 'relative', marginBottom: '16px', width: '100%' }}>
                <div className="modal-header" style={{ marginBottom: 0 }}>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowInviteModal(false)}
                    aria-label={t('close')}
                  >
                    <X size={20} />
                  </button>
                  <h2 className="modal-title">{t('invitationCodeTitle')}</h2>
                </div>
                <p className="modal-subtitle" style={{ textAlign: 'center', margin: '6px auto 0 auto' }}>
                  {t('invitationCodeDesc')}
                </p>
              </div>

              <div
                className="invite-code-display"
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  margin: '24px 0',
                  width: '100%',
                }}
              >
                {inviteCode.split('').map((char, i) => (
                  <div
                    key={i}
                    className="invite-code-char"
                    style={{
                      flex: 1,
                      maxWidth: '52px',
                      minWidth: '38px',
                      height: '62px',
                      fontSize: '1.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {char}
                  </div>
                ))}
              </div>

              <button
                className="btn btn-primary"
                onClick={handleCopyCode}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '14px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  gap: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {copiedCode ? <Check size={18} /> : <Copy size={18} />}
                {copiedCode ? t('copied') : t('copyCode')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── SUB-MODAL 2: INGRESAR CÓDIGO (Portal a document.body) ─── */}
      <AnimatePresence>
        {showAcceptModal && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setShowAcceptModal(false)}
          >
            <motion.div
              className="modal animate-in"
              style={{
                width: '100%',
                maxWidth: '440px',
                padding: '24px 20px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                margin: 'auto',
              }}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header estandarizado */}
              <div style={{ position: 'relative', marginBottom: '16px', width: '100%' }}>
                <div className="modal-header" style={{ marginBottom: 0 }}>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowAcceptModal(false)}
                    aria-label={t('close')}
                  >
                    <X size={20} />
                  </button>
                  <h2 className="modal-title">{t('enterCode')}</h2>
                </div>
                <p className="modal-subtitle" style={{ textAlign: 'center', margin: '6px auto 0 auto' }}>
                  {t('enterCodeDesc')}
                </p>
              </div>

              <div
                className="invite-code-input-group"
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  margin: '24px 0',
                  width: '100%',
                }}
              >
                {acceptCode.map((char, i) => (
                  <input
                    key={i}
                    id={`accept-code-${i}`}
                    className="invite-code-input-char"
                    type="text"
                    maxLength={1}
                    value={char}
                    onChange={e => handleAcceptCodeChange(i, e.target.value)}
                    onKeyDown={e => handleAcceptKeyDown(i, e)}
                    onPaste={handleAcceptPaste}
                    autoFocus={i === 0}
                    style={{
                      flex: 1,
                      maxWidth: '52px',
                      minWidth: '38px',
                      height: '62px',
                      fontSize: '1.6rem',
                      textAlign: 'center',
                    }}
                  />
                ))}
              </div>

              {acceptError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '16px', lineHeight: 1.4 }}>
                  {acceptError}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '14px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  gap: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={handleAcceptInvite}
                disabled={acceptLoading}
              >
                {acceptLoading ? <Loader2 size={18} className="loading-spinner" /> : null}
                {acceptLoading ? t('linking') : t('linkNow')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL DE DOBLE CONFIRMACIÓN PARA DESVINCULAR (DoubleConfirmModal) ─── */}
      <DoubleConfirmModal
        isOpen={showUnlinkConfirm}
        onClose={() => setShowUnlinkConfirm(false)}
        onConfirm={handleUnlink}
        titleStep1={t('unlinkConfirmTitle')}
        descStep1={t('unlinkConfirmDesc')}
        titleStep2={t('dangerZone')}
        descStep2={t('unlinkWarning')}
      />
    </>,
    document.body
  );
}
