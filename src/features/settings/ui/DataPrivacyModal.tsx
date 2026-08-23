import { X, Shield, Lock, EyeOff } from 'lucide-react';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';

interface DataPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DataPrivacyModal({ isOpen, onClose }: DataPrivacyModalProps) {
  const { t } = useLocaleCurrency();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="modal-content"
          style={{ maxWidth: '500px', padding: '24px' }}
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header" style={{ marginBottom: '24px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, color: 'var(--text-primary)' }}>
              <Shield size={24} color="var(--accent-primary)" />
              {t('dataPrivacy') || 'Privacidad de Datos'}
            </h2>
            <button onClick={onClose} className="modal-close-btn" aria-label="Close">
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)' }}>
            <div className="privacy-item" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#6366f1' }}>
                <Shield size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Datos recopilados</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Solo almacenamos la información estrictamente necesaria para que tu cuenta funcione: tu correo electrónico y tu nombre de perfil.
                </p>
              </div>
            </div>

            <div className="privacy-item" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Almacenamiento seguro</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Tus contraseñas e inicio de sesión están fuertemente cifrados por nuestro proveedor de seguridad (Supabase Auth). Ni siquiera nosotros podemos ver tu contraseña real.
                </p>
              </div>
            </div>

            <div className="privacy-item" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ padding: '10px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '12px', color: '#ec4899' }}>
                <EyeOff size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Privacidad Financiera Total</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Tus transacciones, balances y movimientos son 100% privados. Están protegidos mediante <strong>RLS (Seguridad a Nivel de Fila)</strong>. Esto garantiza que solo tú (y tu pareja si la vinculas) tengan acceso a leer tus datos financieros. Nadie más, ni siquiera los desarrolladores de la plataforma, tiene permisos para leer esos datos.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              onClick={onClose}
              style={{ padding: '10px 24px' }}
            >
              {t('confirm') || 'Entendido'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
