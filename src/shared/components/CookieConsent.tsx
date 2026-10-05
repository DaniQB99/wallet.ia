import { useState, useEffect } from 'react';
import { useAuthContext } from '../../app/providers/AuthContext';
import { supabase } from '../api/supabase';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';

/**
 * Banner de Consentimiento (Cookies y Privacidad) - RGPD / LSSI-CE
 * Muestra el banner a los usuarios hasta que aceptan.
 * Si el usuario está autenticado, registra el consentimiento en la BD.
 */
export default function CookieConsent() {
  const { user } = useAuthContext();
  const [show, setShow] = useState(false);
  const { t } = useLocaleCurrency();

  useEffect(() => {
    const hasConsented = localStorage.getItem('wallet_ia_consent');
    if (!hasConsented) {
      setShow(true);
    }
  }, []);

  const handleAccept = async () => {
    localStorage.setItem('wallet_ia_consent', 'true');
    setShow(false);

    if (user) {
      // Registrar consentimiento en base de datos (Auditoría RGPD)
      try {
        await supabase.from('user_consents').upsert({
          user_id: user.id,
          consent_type: 'privacy_policy',
          granted: true,
          granted_at: new Date().toISOString(),
          policy_version: '1.0'
        }, { onConflict: 'user_id,consent_type,policy_version' });
      } catch (err) {
        console.error('Failed to log consent:', err);
      }
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      backgroundColor: 'var(--card-bg)',
      padding: '16px',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '640px',
      margin: '0 auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '1.5rem' }}>🍪</div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>{t('privacyAndCookies')}</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {t('cookieConsentDesc')} <a href="/settings?legal=privacy" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>{t('privacyPolicy')}</a> {t('and')} {t('termsOfUse')}.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button className="btn btn-primary btn-sm" onClick={handleAccept}>
          {t('acceptAndContinue')}
        </button>
      </div>
    </div>
  );
}
