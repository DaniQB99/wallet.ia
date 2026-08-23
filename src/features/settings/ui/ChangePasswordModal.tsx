import { useState } from 'react';
import { X, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../shared/api/supabase';
import { useAuthContext } from '../../../app/providers/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { t } = useLocaleCurrency();
  const { user } = useAuthContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validaciones
  const hasMinLength = newPassword.length >= 6;
  const hasLower = /[a-z]/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const resetState = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Frontend validations
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('La nueva contraseña no puede ser igual a la actual.');
      return;
    }
    if (!hasMinLength || !hasLower || !hasUpper || !hasNumber || !hasSymbol) {
      setError('La nueva contraseña no cumple con todos los requisitos de seguridad.');
      return;
    }

    if (!user?.email) {
      setError('No se pudo verificar el usuario actual.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify current password by signing in again
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta.');
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Contraseña actualizada correctamente.');
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div 
          className="modal-content"
          style={{ maxWidth: '420px', padding: '24px' }}
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header" style={{ marginBottom: '24px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, color: 'var(--text-primary)' }}>
              <Lock size={24} color="var(--accent-primary)" />
              {t('changePassword') || 'Cambiar Contraseña'}
            </h2>
            <button onClick={handleClose} className="modal-close-btn" disabled={loading}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-group">
              <label>Contraseña Actual</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading || !!success}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Nueva Contraseña</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading || !!success}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Requisitos visuales */}
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ color: hasMinLength ? 'var(--success)' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: hasMinLength ? 'var(--success)' : 'var(--text-tertiary)' }} />
                  Mínimo 6 caracteres
                </div>
                <div style={{ color: hasUpper ? 'var(--success)' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: hasUpper ? 'var(--success)' : 'var(--text-tertiary)' }} />
                  Al menos una letra mayúscula
                </div>
                <div style={{ color: hasLower ? 'var(--success)' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: hasLower ? 'var(--success)' : 'var(--text-tertiary)' }} />
                  Al menos una letra minúscula
                </div>
                <div style={{ color: hasNumber ? 'var(--success)' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: hasNumber ? 'var(--success)' : 'var(--text-tertiary)' }} />
                  Al menos un número
                </div>
                <div style={{ color: hasSymbol ? 'var(--success)' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: hasSymbol ? 'var(--success)' : 'var(--text-tertiary)' }} />
                  Al menos un símbolo (ej. !@#$)
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Repetir Nueva Contraseña</label>
              <input
                type={showNew ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || !!success}
                style={{ width: '100%', borderColor: confirmPassword && newPassword !== confirmPassword ? 'var(--danger)' : '' }}
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem' }}
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}
              >
                {success}
              </motion.div>
            )}

            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={handleClose}
                disabled={loading || !!success}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={loading || !!success || !newPassword || !currentPassword || !confirmPassword}
              >
                {loading ? 'Actualizando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
