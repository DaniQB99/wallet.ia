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
              <Shield size={20} color="var(--accent-primary)" />
              {t('dataPrivacy')}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)' }}>
            <div className="privacy-item" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#6366f1' }}>
                <Shield size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{t('dataCollectedTitle')}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {t('dataCollectedDesc')}
                </p>
              </div>
            </div>

            <div className="privacy-item" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{t('secureStorageTitle')}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {t('secureStorageDesc')}
                </p>
              </div>
            </div>

            <div className="privacy-item" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ padding: '10px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '12px', color: '#ec4899' }}>
                <EyeOff size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{t('financialPrivacyTitle')}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {t('financialPrivacyDesc')}
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
              {t('understood')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
