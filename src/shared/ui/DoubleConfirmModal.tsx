import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';

interface DoubleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titleStep1: string;
  descStep1: string;
  titleStep2: string;
  descStep2: string;
  loading?: boolean;
}

export default function DoubleConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  titleStep1,
  descStep1,
  titleStep2,
  descStep2,
  loading = false,
}: DoubleConfirmModalProps) {
  const { t } = useLocaleCurrency();
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!isOpen) {
      // Reset step when modal closes
      setTimeout(() => setStep(1), 300);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200, background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{ maxWidth: '320px', width: '90%', textAlign: 'center', padding: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div style={{ color: 'var(--warning, #f59e0b)', marginBottom: '16px' }}>
                  <AlertTriangle size={48} style={{ margin: '0 auto' }} />
                </div>
                <h3 style={{ marginBottom: '12px' }}>{titleStep1}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  {descStep1}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                    {t('no') || 'No'}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep(2)}
                    style={{ flex: 1 }}
                  >
                    {t('yes') || 'Sí'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>
                  <Trash2 size={48} style={{ margin: '0 auto' }} />
                </div>
                <h3 style={{ marginBottom: '12px' }}>{titleStep2}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  {descStep2}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                    {t('cancel') || 'Cancelar'}
                  </button>
                  <button
                    className={`btn btn-danger ${loading ? 'disabled' : ''}`}
                    onClick={onConfirm}
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? (t('deleting') || 'Eliminando...') : (t('confirm') || 'Confirmar')}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
