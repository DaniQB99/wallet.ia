import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Shield, BarChart3, Sliders, Check } from 'lucide-react';
import { useAuthContext } from '../../app/providers/AuthContext';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';
import { useAppearance } from '../../app/providers/AppearanceContext';
import {
  getStoredCookieConsent,
  saveCookieConsent,
} from '../lib/cookieConsent';

/**
 * CookieConsent.tsx
 * Banner y modal de configuración de Cookies y Privacidad (RGPD / ePrivacy / LSSI-CE).
 * - Se adapta dinámicamente al tema del dispositivo del usuario (Modo Oscuro / Modo Claro).
 * - Se muestra en la parte inferior tanto para usuarios nuevos como en la pantalla de inicio de sesión.
 * - Sincronización 100% reactiva de estados entre almacenamiento y componentes.
 * - [Aceptar]: Acepta todas y guarda.
 * - [Rechazar]: Rechaza las no esenciales y guarda.
 * - [Ajustes]: Abre la ventana flotante para configurar de forma granular.
 * - [Más información]: Navega a la página completa de Política de Cookies (/cookies).
 */
export default function CookieConsent() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { t } = useLocaleCurrency();
  const { resolvedTheme } = useAppearance();
  const isLight = resolvedTheme === 'light';

  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Estados granulares de cookies
  const [analyticsAllowed, setAnalyticsAllowed] = useState(true);
  const [preferencesAllowed, setPreferencesAllowed] = useState(true);

  // Sincronizar estados locales desde el almacenamiento real
  const syncFromStorage = useCallback(() => {
    const stored = getStoredCookieConsent();
    if (stored) {
      setAnalyticsAllowed(stored.analytics);
      setPreferencesAllowed(stored.preferences);
    } else {
      // Si el usuario aún no tomó decisión, arrancan seleccionadas para previsualización
      setAnalyticsAllowed(true);
      setPreferencesAllowed(true);
    }
  }, []);

  // Comprobar consentimiento almacenado al montar
  useEffect(() => {
    syncFromStorage();
    const existing = getStoredCookieConsent();
    if (!existing) {
      setVisible(true);
    }

    // Escuchar evento para reabrir ajustes desde la pantalla de configuración
    const handleOpenSettings = () => {
      syncFromStorage();
      setShowPreferences(true);
      setVisible(true);
    };

    window.addEventListener('wallet_open_cookie_settings', handleOpenSettings);
    return () => window.removeEventListener('wallet_open_cookie_settings', handleOpenSettings);
  }, [syncFromStorage]);

  // Cada vez que se abre la vista de preferencias, refrescar los toggles desde el almacenamiento
  useEffect(() => {
    if (showPreferences) {
      syncFromStorage();
    }
  }, [showPreferences, syncFromStorage]);

  const handleOpenPreferences = () => {
    syncFromStorage();
    setShowPreferences(true);
  };

  const handleClosePreferences = () => {
    setShowPreferences(false);
    const existing = getStoredCookieConsent();
    if (existing) {
      // Si el usuario ya tenía consentimiento guardado (vino de Ajustes), cerrar el banner
      setVisible(false);
    }
  };

  // Acción: Aceptar todas las cookies
  const handleAcceptAll = async () => {
    setAnalyticsAllowed(true);
    setPreferencesAllowed(true);
    await saveCookieConsent(
      {
        status: 'accepted',
        analytics: true,
        preferences: true,
      },
      user?.id
    );
    setVisible(false);
    setShowPreferences(false);
  };

  // Acción: Rechazar todas las no esenciales
  const handleRejectAll = async () => {
    setAnalyticsAllowed(false);
    setPreferencesAllowed(false);
    await saveCookieConsent(
      {
        status: 'rejected',
        analytics: false,
        preferences: false,
      },
      user?.id
    );
    setVisible(false);
    setShowPreferences(false);
  };

  // Acción: Guardar selección personalizada
  const handleSaveCustom = async () => {
    await saveCookieConsent(
      {
        status: 'customized',
        analytics: analyticsAllowed,
        preferences: preferencesAllowed,
      },
      user?.id
    );
    setVisible(false);
    setShowPreferences(false);
  };

  if (!visible) return null;

  // Paleta dinámica adaptada a modo claro / oscuro del dispositivo
  const themeStyles = {
    bannerBg: isLight ? '#ffffff' : '#131522',
    bannerBorder: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.14)',
    bannerShadow: isLight
      ? '0 10px 32px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)'
      : '0 20px 50px rgba(0, 0, 0, 0.85)',
    textPrimary: isLight ? '#111827' : '#f1f3f9',
    textSecondary: isLight ? '#4b5563' : 'var(--text-secondary)',
    textLink: isLight ? '#6366f1' : 'var(--text-primary)',
    badgeBg: isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.18)',
    rejectBtnBg: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
    rejectBtnBorder: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.18)',
    rejectBtnColor: isLight ? '#374151' : '#ffffff',
    adjustBtnColor: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.7)',
    modalBg: isLight ? '#ffffff' : '#131522',
    modalBorder: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.12)',
    modalShadow: isLight ? '0 24px 60px rgba(0, 0, 0, 0.18)' : '0 24px 60px rgba(0, 0, 0, 0.9)',
    cardBg: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
    cardBorder: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.07)',
    switchOffBg: isLight ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.15)',
    closeBtnBg: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
    closeBtnColor: isLight ? '#374151' : '#ffffff',
    acceptAllModalBg: isLight ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.08)',
    acceptAllModalBorder: isLight ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(255, 255, 255, 0.16)',
    acceptAllModalColor: isLight ? 'var(--accent-primary)' : '#ffffff',
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: showPreferences ? 'center' : 'flex-end',
          justifyContent: 'center',
          padding: '16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Backdrop suave cuando el modal de ajustes está abierto */}
        {showPreferences && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              pointerEvents: 'auto',
            }}
            onClick={handleClosePreferences}
          />
        )}

        {/* 1. VISTA DE AJUSTES DETALLADOS (MODAL FLOTANTE) */}
        {showPreferences ? (
          <motion.div
            key="cookie-preferences-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: themeStyles.modalBg,
              border: themeStyles.modalBorder,
              borderRadius: '24px',
              padding: '24px',
              boxShadow: themeStyles.modalShadow,
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
              zIndex: 100000,
            }}
          >
            {/* Cabecera del modal: botón X arriba a la izquierda y título centrado */}
            <div className="modal-header" style={{ marginBottom: '6px' }}>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleClosePreferences}
                aria-label={t('close')}
                style={{
                  background: themeStyles.closeBtnBg,
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: themeStyles.closeBtnColor,
                }}
              >
                <X size={18} />
              </button>
              <h2 className="modal-title" style={{ fontSize: '1.2rem', color: themeStyles.textPrimary }}>
                <Cookie size={22} color="var(--accent-primary)" />
                <span>{t('cookiePreferencesTitle')}</span>
              </h2>
            </div>
            <div
              className="modal-subtitle"
              style={{
                marginTop: '-8px',
                marginBottom: '4px',
                color: themeStyles.textSecondary,
                lineHeight: 1.45,
                fontSize: '0.84rem',
              }}
            >
              {t('cookiePreferencesDesc')}
            </div>

            {/* Categorías de cookies */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Categoría 1: Técnicas y Esenciales (Obligatorias) */}
              <div
                style={{
                  background: themeStyles.cardBg,
                  border: themeStyles.cardBorder,
                  borderRadius: '16px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: themeStyles.textPrimary }}>
                      {t('necessaryCookies')}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: isLight ? '#047857' : 'var(--success)',
                      background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'var(--success-bg)',
                      padding: '3px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    {t('alwaysActive')}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: themeStyles.textSecondary, lineHeight: 1.45 }}>
                  {t('necessaryCookiesDesc')}
                </p>
              </div>

              {/* Categoría 2: Análisis y Rendimiento (Opcionales) */}
              <div
                onClick={() => setAnalyticsAllowed((prev) => !prev)}
                style={{
                  background: themeStyles.cardBg,
                  border: themeStyles.cardBorder,
                  borderRadius: '16px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: themeStyles.textPrimary }}>
                      {t('analyticsCookies')}
                    </span>
                  </div>
                  {/* Switch interactivo */}
                  <div
                    style={{
                      width: '42px',
                      height: '24px',
                      borderRadius: '12px',
                      background: analyticsAllowed ? 'var(--accent-primary)' : themeStyles.switchOffBg,
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                  >
                    <motion.div
                      animate={{ x: analyticsAllowed ? 18 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                      }}
                    />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: themeStyles.textSecondary, lineHeight: 1.45 }}>
                  {t('analyticsCookiesDesc')}
                </p>
              </div>

              {/* Categoría 3: Personalización (Opcionales) */}
              <div
                onClick={() => setPreferencesAllowed((prev) => !prev)}
                style={{
                  background: themeStyles.cardBg,
                  border: themeStyles.cardBorder,
                  borderRadius: '16px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: themeStyles.textPrimary }}>
                      {t('preferenceCookies')}
                    </span>
                  </div>
                  {/* Switch interactivo */}
                  <div
                    style={{
                      width: '42px',
                      height: '24px',
                      borderRadius: '12px',
                      background: preferencesAllowed ? 'var(--accent-primary)' : themeStyles.switchOffBg,
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                  >
                    <motion.div
                      animate={{ x: preferencesAllowed ? 18 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                      }}
                    />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: themeStyles.textSecondary, lineHeight: 1.45 }}>
                  {t('preferenceCookiesDesc')}
                </p>
              </div>
            </div>

            {/* Botones de acción del modal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleSaveCustom}
                style={{
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '11px 20px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: 'none',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Check size={16} />
                {t('savePreferences')}
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  style={{
                    flex: 1,
                    background: themeStyles.rejectBtnBg,
                    border: themeStyles.rejectBtnBorder,
                    borderRadius: '9999px',
                    padding: '10px 16px',
                    color: themeStyles.rejectBtnColor,
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? '#f3f4f6' : 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = themeStyles.rejectBtnBg)}
                >
                  {t('rejectNonEssential')}
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  style={{
                    flex: 1,
                    background: themeStyles.acceptAllModalBg,
                    border: themeStyles.acceptAllModalBorder,
                    borderRadius: '9999px',
                    padding: '10px 16px',
                    color: themeStyles.acceptAllModalColor,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  {t('acceptAll')}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* 2. VISTA BANNER PRINCIPAL (ADAPTABLE A TEMA CLARO / OSCURO) */
          <motion.div
            key="cookie-banner-bar"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%',
              maxWidth: '430px',
              background: themeStyles.bannerBg,
              border: themeStyles.bannerBorder,
              borderRadius: '24px',
              padding: '16px 20px',
              boxShadow: themeStyles.bannerShadow,
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative',
              zIndex: 100000,
            }}
          >
            {/* Fila superior: Icono circular + Texto con salto de línea */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: themeStyles.badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              >
                <Cookie size={20} />
              </div>
              <div style={{ fontSize: '0.86rem', color: themeStyles.textPrimary, lineHeight: 1.45, flex: 1 }}>
                <div>{t('cookieBannerPart1')}</div>
                <div>
                  {t('cookieBannerPart2')}{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/cookies')}
                    style={{
                      color: themeStyles.textLink,
                      textDecoration: 'underline',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      font: 'inherit',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {t('moreInfo')}
                  </button>
                </div>
              </div>
            </div>

            {/* Fila inferior de botones centrados: [Aceptar]  [Rechazar]  Ajustes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
              <button
                type="button"
                onClick={handleAcceptAll}
                style={{
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '8px 22px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                  boxShadow: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {t('accept')}
              </button>

              <button
                type="button"
                onClick={handleRejectAll}
                style={{
                  background: themeStyles.rejectBtnBg,
                  border: themeStyles.rejectBtnBorder,
                  borderRadius: '9999px',
                  padding: '7px 20px',
                  color: themeStyles.rejectBtnColor,
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.09)';
                  e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.28)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeStyles.rejectBtnBg;
                  e.currentTarget.style.borderColor = isLight ? '#e5e7eb' : 'rgba(255, 255, 255, 0.18)';
                }}
              >
                {t('reject')}
              </button>

              <button
                type="button"
                onClick={handleOpenPreferences}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: themeStyles.adjustBtnColor,
                  borderRadius: '9999px',
                  padding: '7px 14px',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = themeStyles.textPrimary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = themeStyles.adjustBtnColor)}
              >
                {t('adjust')}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
