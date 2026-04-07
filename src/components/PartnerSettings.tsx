import { useState } from 'react';
import { X, Heart, Copy, Check, UserPlus, Unlink, Loader2 } from 'lucide-react';
import { useCouple } from '../hooks/useCouple';
import { motion, AnimatePresence } from 'framer-motion';

interface PartnerSettingsProps {
  onClose: () => void;
}

export default function PartnerSettings({ onClose }: PartnerSettingsProps) {
  const { couple, partner, loading, generateInvite, acceptInvite, unlinkCouple } = useCouple();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [acceptCode, setAcceptCode] = useState(['', '', '', '', '', '']);
  const [acceptError, setAcceptError] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

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
    if (value.length > 1) return;
    const newCode = [...acceptCode];
    newCode[index] = value.toUpperCase();
    setAcceptCode(newCode);
    setAcceptError('');

    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`accept-code-${index + 1}`);
      next?.focus();
    }
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
      setAcceptError('Introduce los 6 caracteres del código');
      return;
    }
    setAcceptLoading(true);
    const result = await acceptInvite(fullCode);
    if (result.error) {
      setAcceptError(result.error);
    } else {
      setShowAcceptModal(false);
      setAcceptCode(['', '', '', '', '', '']);
      // After linking, the parent component might need to refresh or the hook handles it
    }
    setAcceptLoading(false);
  };

  const handleUnlink = async () => {
    await unlinkCouple();
    setShowUnlinkConfirm(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        className="modal animate-in"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Estado de pareja</h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <Loader2 size={32} className="loading-spinner" />
          </div>
        ) : couple && partner ? (
          /* ─── LINKED STATE ─── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="partner-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="avatar avatar-lg" style={{ background: 'var(--accent-gradient)', color: 'white' }}>
                {partner.display_name?.charAt(0) || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '2px' }}>
                  {partner.display_name || 'Tu pareja'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                  {partner.email}
                </div>
                <div className="partner-status">
                  <span className="partner-status-dot" />
                  Vinculado/a
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <h4 style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Zona de peligro</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Si desvinculas a tu pareja, dejaréis de compartir transacciones en tiempo real.
              </p>
              <button
                className="btn btn-danger"
                style={{ width: '100%' }}
                onClick={() => setShowUnlinkConfirm(true)}
              >
                <Unlink size={16} /> Desvincular pareja
              </button>
            </div>
          </div>
        ) : (
          /* ─── UNLINKED STATE ─── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '8px' }}>
              Vincula tu cuenta con tu pareja para gestionar vuestro dinero juntos.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button
                className="btn btn-primary"
                style={{ flexDirection: 'column', height: 'auto', padding: '24px 16px', gap: '12px' }}
                onClick={handleGenerateCode}
                disabled={generatingCode}
              >
                {generatingCode ? <Loader2 size={24} className="loading-spinner" /> : <UserPlus size={24} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Invitar</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 400 }}>Dar mi código</span>
                </div>
              </button>

              <button
                className="btn btn-secondary"
                style={{ flexDirection: 'column', height: 'auto', padding: '24px 16px', gap: '12px' }}
                onClick={() => setShowAcceptModal(true)}
              >
                <Heart size={24} color="#EC4899" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Unirse</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>Tengo un código</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* --- Sub-modals for better UX inside the main modal --- */}
        <AnimatePresence>
          {showInviteModal && (
            <motion.div
              className="modal-overlay"
              style={{ zIndex: 1100 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
            >
              <motion.div
                className="modal"
                style={{ maxWidth: '400px' }}
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="modal-title" style={{ textAlign: 'center' }}>Tu código de invitación</div>
                <p className="modal-subtitle" style={{ textAlign: 'center' }}>Comparte este código con tu pareja. Expira en 24h.</p>

                <div className="invite-code-display">
                  {inviteCode.split('').map((char, i) => (
                    <div key={i} className="invite-code-char">{char}</div>
                  ))}
                </div>

                <button className="btn btn-primary" onClick={handleCopyCode} style={{ width: '100%' }}>
                  {copiedCode ? <Check size={18} /> : <Copy size={18} />}
                  {copiedCode ? '¡Copiado!' : 'Copiar código'}
                </button>
              </motion.div>
            </motion.div>
          )}

          {showAcceptModal && (
            <motion.div
              className="modal-overlay"
              style={{ zIndex: 1100 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAcceptModal(false)}
            >
              <motion.div
                className="modal"
                style={{ maxWidth: '400px' }}
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="modal-title" style={{ textAlign: 'center' }}>Ingresar código</div>
                <p className="modal-subtitle" style={{ textAlign: 'center' }}>Ingresa los 6 caracteres del código de tu pareja.</p>

                <div className="invite-code-input-group">
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
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {acceptError && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '16px' }}>
                    {acceptError}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleAcceptInvite}
                  disabled={acceptLoading}
                >
                  {acceptLoading ? <Loader2 size={18} className="loading-spinner" /> : null}
                  {acceptLoading ? 'Vinculando...' : 'Vincular ahora'}
                </button>
              </motion.div>
            </motion.div>
          )}

          {showUnlinkConfirm && (
            <motion.div
              className="modal-overlay"
              style={{ zIndex: 1100 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUnlinkConfirm(false)}
            >
              <motion.div
                className="modal"
                style={{ maxWidth: '360px', textAlign: 'center' }}
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                <div className="modal-title">¿Desvincular pareja?</div>
                <p className="modal-subtitle" style={{ marginBottom: '24px' }}>Esta acción es inmediata. No podrás ver las transacciones compartidas nuevas de tu pareja.</p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowUnlinkConfirm(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleUnlink}>
                    Confirmar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
