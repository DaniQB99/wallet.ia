import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle,
  MoreVertical,
  Download,
  Sparkles,
  Info
} from 'lucide-react';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: unknown;
  onInstallSuccess?: () => void;
}

export default function InstallAppModal({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}: InstallAppModalProps) {
  const { t } = useLocaleCurrency();

  const isApple = typeof navigator !== 'undefined' && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(isApple ? 'ios' : 'android');
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAutoInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      (deferredPrompt as any).prompt();
      const choiceResult = await (deferredPrompt as any).userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        setInstalledSuccess(true);
        if (onInstallSuccess) onInstallSuccess();
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error('Error triggering PWA installation:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="modal-overlay"
        style={{ zIndex: 1100 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="modal animate-in"
          style={{ maxWidth: '480px', width: '100%', margin: 'auto' }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con botón X en la esquina superior izquierda */}
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
              {t('installAppModalTitle')}
            </h2>
          </div>

          <p
            className="modal-subtitle"
            style={{ textAlign: 'center', marginBottom: '20px' }}
          >
            {t('installAppSubtitle')}
          </p>

          {/* Selector de plataforma: iOS vs Android */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              background: 'var(--bg-primary)',
              padding: '4px',
              borderRadius: '14px',
              marginBottom: '20px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'ios' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'ios' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeTab === 'ios' ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <Smartphone size={16} />
              {t('installTabIos')}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('android')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'android' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'android' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeTab === 'android' ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <Smartphone size={16} />
              {t('installTabAndroid')}
            </button>
          </div>

          {/* Pasos para iOS */}
          {activeTab === 'ios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Share size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                    {t('installIosStep1Title')}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {t('installIosStep1')}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PlusSquare size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                    {t('installIosStep2Title')}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {t('installIosStep2')}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                    {t('installIosStep3Title')}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {t('installIosStep3')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pasos para Android */}
          {activeTab === 'android' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MoreVertical size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                    {t('installAndroidStep1Title')}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {t('installAndroidStep1')}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Download size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                    {t('installAndroidStep2Title')}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {t('installAndroidStep2')}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                    {t('installAndroidStep3Title')}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {t('installAndroidStep3')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sección de automatización al final del paso a paso */}
          <div style={{ marginTop: 'auto' }}>
            {installedSuccess ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                <CheckCircle size={18} />
                {t('installAutoSuccess')}
              </div>
            ) : deferredPrompt ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAutoInstall}
                disabled={installing}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                }}
              >
                <Sparkles size={18} />
                {installing ? t('saving') : t('installAutoBtn')}
              </button>
            ) : activeTab === 'ios' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-primary)' }} />
                <span>{t('installIosNotice')}</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-primary)' }} />
                <span>{t('installAlreadyDoneNotice')}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
