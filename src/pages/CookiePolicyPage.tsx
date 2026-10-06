import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Shield,
  Sliders,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';
import { useAppearance } from '../app/providers/AppearanceContext';

/**
 * CookiePolicyPage.tsx
 * Página integral de Política de Cookies de Wallet.ia.
 * Desarrollada conforme al RGPD (UE 2016/679), LOPDGDD 3/2018, LSSI-CE 34/2002 (art. 22.2)
 * y directrices vigentes de la Agencia Española de Protección de Datos (AEPD).
 */
export default function CookiePolicyPage() {
  const navigate = useNavigate();
  const { t } = useLocaleCurrency();
  const { resolvedTheme } = useAppearance();
  const isLight = resolvedTheme === 'light';

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('wallet_open_cookie_settings'));
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/auth');
    }
  };

  // Paleta de estilos adaptativa
  const colors = {
    bg: isLight ? '#f9fafb' : '#0a0b14',
    cardBg: isLight ? '#ffffff' : '#131522',
    cardBorder: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.09)',
    cardShadow: isLight
      ? '0 4px 20px rgba(0, 0, 0, 0.04)'
      : '0 8px 32px rgba(0, 0, 0, 0.45)',
    textPrimary: isLight ? '#111827' : '#f3f4f6',
    textSecondary: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.72)',
    textMuted: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.5)',
    accent: '#7c3aed',
    accentLight: isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.18)',
    accentBorder: isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.35)',
    tableHeaderBg: isLight ? '#f3f4f6' : 'rgba(255, 255, 255, 0.04)',
    tableRowBorder: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)',
    codeBg: isLight ? '#eef2f6' : 'rgba(255, 255, 255, 0.08)',
    badgeGreenBg: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.18)',
    badgeGreenColor: isLight ? '#047857' : '#34d399',
    badgePurpleBg: isLight ? 'rgba(124, 58, 237, 0.12)' : 'rgba(124, 58, 237, 0.22)',
    badgePurpleColor: isLight ? '#6d28d9' : '#a78bfa',
    headerBg: isLight ? 'rgba(249, 250, 251, 0.88)' : 'rgba(10, 11, 20, 0.88)',
  };

  return (
    <>
      <Helmet>
        <title>{t('cookiePolicyTitle')} — Wallet.ia</title>
        <meta
          name="description"
          content="Información legal sobre el uso de cookies, almacenamiento local y tecnologías similares en Wallet.ia conforme a RGPD y LSSI-CE."
        />
      </Helmet>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: colors.bg,
          color: colors.textPrimary,
          fontFamily: 'inherit',
          transition: 'background-color 0.2s ease, color 0.2s ease',
        }}
      >
        {/* Barra superior de navegación fija y responsiva */}
        <header
          className="policy-header"
          style={{ backgroundColor: colors.headerBg }}
        >
          {/* Lado izquierdo: Botón Volver */}
          <button
            type="button"
            onClick={handleGoBack}
            className="policy-back-btn"
            aria-label={t('back')}
          >
            <ArrowLeft size={16} />
            <span className="policy-back-btn-text">{t('back')}</span>
          </button>

          {/* Centro: Marca e identificador LEGAL */}
          <div className="policy-header-brand">
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: colors.textPrimary }}>
              wallet.ia
            </span>
            <span className="policy-brand-tag">
              LEGAL
            </span>
          </div>

          {/* Lado derecho: Botón Ajustes de cookies */}
          <button
            type="button"
            onClick={handleOpenCookieSettings}
            className="policy-settings-btn"
            aria-label={t('openCookieSettings')}
          >
            <Sliders size={15} />
            <span className="policy-btn-label-desktop">{t('openCookieSettings')}</span>
            <span className="policy-btn-label-mobile">{t('adjust')}</span>
          </button>
        </header>

        {/* Contenido principal del documento legal */}
        <main
          style={{
            maxWidth: '840px',
            margin: '0 auto',
            padding: '36px 20px 120px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}
        >
          {/* Cabecera del Documento */}
          <section style={{ textAlign: 'center', paddingBottom: '16px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: colors.accent,
                backgroundColor: colors.accentLight,
                padding: '4px 12px',
                borderRadius: '9999px',
                marginBottom: '16px',
                textTransform: 'uppercase',
              }}
            >
              <Shield size={14} />
              <span>Privacidad & Cumplimiento Normativo</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.9rem, 4vw, 2.6rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: colors.textPrimary,
                margin: '0 0 12px 0',
                lineHeight: 1.18,
              }}
            >
              {t('cookiePolicyTitle')}
            </h1>

            <p
              style={{
                fontSize: '1.05rem',
                color: colors.textSecondary,
                maxWidth: '600px',
                margin: '0 auto 16px auto',
                lineHeight: 1.5,
              }}
            >
              {t('cookiePolicySubtitle')}
            </p>

            <div style={{ fontSize: '0.82rem', color: colors.textMuted }}>
              Última actualización: 6 de octubre de 2026
            </div>
          </section>

          {/* 1. Introducción */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px 0', color: colors.textPrimary }}>
              1. Introducción
            </h2>
            <p style={{ margin: '0 0 14px 0', lineHeight: 1.6, color: colors.textSecondary }}>
              En <strong>Wallet.ia</strong>, utilizamos cookies y tecnologías similares en nuestra aplicación web y Progresiva (PWA) para garantizar su correcto funcionamiento, analizar el uso de nuestros servicios, recordar tus preferencias personalizadas y proteger tu privacidad financiera en todo momento.
            </p>
            <p style={{ margin: '0 0 20px 0', lineHeight: 1.6, color: colors.textSecondary }}>
              Esta Política de Cookies detalla qué son las cookies, qué tipos utilizamos, con qué finalidad, durante cuánto tiempo se conservan y cómo puedes gestionarlas de manera informada y libre. Esta política forma parte integrante de nuestra Política de Privacidad.
            </p>

            <div
              style={{
                backgroundColor: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)',
                border: colors.cardBorder,
                borderRadius: '16px',
                padding: '16px 20px',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary, marginBottom: '10px' }}>
                Esta política se redacta en estricta conformidad con:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: colors.textSecondary, fontSize: '0.88rem' }}>
                <li>El <strong>Reglamento (UE) 2016/679 (RGPD)</strong> relativo a la protección de datos personales.</li>
                <li>La <strong>Ley Orgánica 3/2018 (LOPDGDD)</strong> de Protección de Datos Personales y garantía de los derechos digitales.</li>
                <li>La <strong>Ley 34/2002 (LSSI-CE)</strong>, en particular su artículo 22.2 relativo a la instalación de dispositivos de almacenamiento y recuperación de datos.</li>
                <li>Las directrices y resoluciones vinculantes de la <strong>Agencia Española de Protección de Datos (AEPD)</strong> sobre la utilización de cookies.</li>
              </ul>
            </div>
          </section>

          {/* 2. ¿Qué son las cookies? */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px 0', color: colors.textPrimary }}>
              2. ¿Qué son las cookies?
            </h2>
            <p style={{ margin: '0 0 14px 0', lineHeight: 1.6, color: colors.textSecondary }}>
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (ordenador, smartphone, tablet o navegador) al visitar un sitio web. Permiten que la aplicación recuerde información técnica sobre tu visita —como el inicio de sesión seguro, la divisa elegida, el idioma y tus preferencias visuales— para que tu experiencia sea fluida, rápida y coherente en cada navegación.
            </p>
            <p style={{ margin: 0, lineHeight: 1.6, color: colors.textSecondary }}>
              Existen también otras tecnologías análogas que cumplen funciones equivalentes, tales como el <strong>almacenamiento local del navegador (localStorage / sessionStorage)</strong> y los cachés de Service Workers para funcionamiento offline en PWA, los cuales se rigen bajo los mismos principios de transparencia y consentimiento descritos en este documento.
            </p>
          </section>

          {/* 3. ¿Necesitamos tu consentimiento? */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
              3. ¿Necesitamos tu consentimiento?
            </h2>
            <p style={{ margin: 0, lineHeight: 1.6, color: colors.textSecondary }}>
              De conformidad con el artículo 22.2 de la LSSI-CE y las directrices emitidas por la AEPD:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Tarjeta Necesarias */}
              <div
                style={{
                  backgroundColor: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)',
                  border: colors.cardBorder,
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.98rem', color: colors.textPrimary }}>
                    Estrictamente necesarias
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      backgroundColor: colors.badgeGreenBg,
                      color: colors.badgeGreenColor,
                      padding: '3px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    Sin consentimiento
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: colors.textSecondary, lineHeight: 1.5 }}>
                  No requieren consentimiento previo. Son imprescindibles para posibilitar la navegación segura, autenticación con Supabase y el funcionamiento esencial del Sitio.
                </p>
              </div>

              {/* Tarjeta Opcionales */}
              <div
                style={{
                  backgroundColor: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)',
                  border: colors.cardBorder,
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.98rem', color: colors.textPrimary }}>
                    Todas las demás
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      backgroundColor: colors.badgePurpleBg,
                      color: colors.badgePurpleColor,
                      padding: '3px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    Requiere consentimiento
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: colors.textSecondary, lineHeight: 1.5 }}>
                  Requieren tu consentimiento previo, libre e informado. No se activarán ni almacenarán en tu navegador hasta que las aceptes de manera afirmativa.
                </p>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.92rem', color: colors.textSecondary, lineHeight: 1.55 }}>
              Puedes prestar, denegar o modificar tu consentimiento en cualquier momento a través de nuestro panel interactivo de configuración de cookies, accesible desde el banner inferior de la app o pulsando en el botón a continuación:
            </p>

            <div>
              <button
                type="button"
                onClick={handleOpenCookieSettings}
                style={{
                  backgroundColor: colors.accent,
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '10px 22px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Sliders size={16} />
                <span>Configurar preferencias de cookies</span>
              </button>
            </div>

            {/* Aviso destacado */}
            <div
              style={{
                backgroundColor: isLight ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.88rem', color: colors.textPrimary, lineHeight: 1.5 }}>
                <strong>Importante:</strong> La mera navegación por la web, la inactividad o el desplazamiento por la pantalla <strong>NO constituyen un consentimiento válido</strong> bajo los criterios imperativos del RGPD y de la AEPD.
              </div>
            </div>
          </section>

          {/* 4. Tipos de cookies que utilizamos */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
              4. Tipos de cookies que utilizamos
            </h2>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 8px 0', color: colors.textPrimary }}>
                4.1. Según su titularidad
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: colors.textSecondary, fontSize: '0.9rem' }}>
                <li><strong>Cookies propias:</strong> Las gestiona y establece directamente Wallet.ia desde nuestro dominio para el funcionamiento de la aplicación.</li>
                <li><strong>Cookies de terceros:</strong> Las establecen dominios de proveedores tecnológicos externos auditados (como Supabase para la base de datos y autenticación, o Vercel para medición técnica de infraestructura).</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 8px 0', color: colors.textPrimary }}>
                4.2. Según su duración
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: colors.textSecondary, fontSize: '0.9rem' }}>
                <li><strong>Cookies de sesión:</strong> Son temporales y se eliminan automáticamente en cuanto cierras la pestaña o aplicación.</li>
                <li><strong>Cookies persistentes:</strong> Permanecen almacenadas en tu dispositivo durante un período temporal definido (máximo 12 meses conforme al estándar de la AEPD para consentimientos) o hasta que decidas borrarlas manualmente.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 12px 0', color: colors.textPrimary }}>
                4.3. Según su finalidad
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.tableHeaderBg, textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Categoría</th>
                      <th style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Finalidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, fontWeight: 600 }}>Estrictamente necesarias</td>
                      <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                        Funcionamiento del Sitio: inicio de sesión seguro, autenticación, protección contra falsificación de peticiones y navegación.
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, fontWeight: 600 }}>De funcionalidad y preferencias</td>
                      <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                        Recuerdan opciones seleccionadas por el usuario (idioma, divisa, tema claro/oscuro, color de acento y modo privacidad).
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, fontWeight: 600 }}>Analíticas y de rendimiento</td>
                      <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                        Información técnica agregada y anónima sobre tiempos de carga y estabilidad del sistema (Vercel Speed Insights).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                backgroundColor: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)',
                border: colors.cardBorder,
                borderRadius: '16px',
                padding: '14px 18px',
                fontSize: '0.86rem',
                color: colors.textMuted,
                fontStyle: 'italic',
              }}
            >
              <strong>Nota:</strong> Actualmente Wallet.ia <strong>NO carga cookies de publicidad, remarketing ni redes sociales</strong>. En ningún caso comercializamos tus datos ni realizamos seguimiento publicitario cruzado entre sitios web.
            </div>
          </section>

          {/* 5. Detalle de cookies utilizadas */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 6px 0', color: colors.textPrimary }}>
                5. Detalle de cookies y tecnologías utilizadas
              </h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: colors.textSecondary }}>
                A continuación se desglosan las cookies específicas que pueden ser empleadas en el Sitio. Este inventario se audita y actualiza periódicamente.
              </p>
            </div>

            {/* 5.1 Estrictamente necesarias */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: colors.textPrimary }}>
                  5.1. Estrictamente necesarias
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: colors.badgeGreenBg,
                    color: colors.badgeGreenColor,
                    padding: '3px 8px',
                    borderRadius: '12px',
                  }}
                >
                  Sin consentimiento
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.tableHeaderBg, textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Cookie / Clave</th>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Proveedor</th>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Finalidad</th>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                        <code style={{ background: colors.codeBg, padding: '2px 6px', borderRadius: '4px' }}>sb-access-token / sb-refresh-token</code>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Supabase</td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                        Autenticación segura de sesión y renovación de token JWT de acceso a base de datos.
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Sesión / 1 año</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                        <code style={{ background: colors.codeBg, padding: '2px 6px', borderRadius: '4px' }}>wallet_ia_cookie_consent</code>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Wallet.ia</td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                        Almacena el estado de consentimiento y preferencias seleccionadas por el usuario.
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>1 año</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5.2 Funcionalidad */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: colors.textPrimary }}>
                  5.2. De funcionalidad y preferencias
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: colors.badgePurpleBg,
                    color: colors.badgePurpleColor,
                    padding: '3px 8px',
                    borderRadius: '12px',
                  }}
                >
                  Requiere consentimiento
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.tableHeaderBg, textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Cookie / Clave</th>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Proveedor</th>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Finalidad</th>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                        <code style={{ background: colors.codeBg, padding: '2px 6px', borderRadius: '4px' }}>wallet_ia_locale</code>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Wallet.ia</td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                        Guarda el idioma preferido (ES, EN, DE, FR, IT, PT).
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Persistente</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                        <code style={{ background: colors.codeBg, padding: '2px 6px', borderRadius: '4px' }}>wallet_ia_theme</code>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Wallet.ia</td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                        Preferencia de tema visual (claro, oscuro o según el sistema).
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Persistente</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                        <code style={{ background: colors.codeBg, padding: '2px 6px', borderRadius: '4px' }}>wallet_ia_accent</code>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Wallet.ia</td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                        Color de acento seleccionado de la interfaz gráfica.
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Persistente</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                        <code style={{ background: colors.codeBg, padding: '2px 6px', borderRadius: '4px' }}>wallet_hide_card_balance</code>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Wallet.ia</td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                        Preferencia del modo privacidad para desenfocar saldos en pantalla.
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Persistente</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5.3 Analíticas */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: colors.textPrimary }}>
                  5.3. Analíticas y de rendimiento
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: colors.badgePurpleBg,
                    color: colors.badgePurpleColor,
                    padding: '3px 8px',
                    borderRadius: '12px',
                  }}
                >
                  Requiere consentimiento
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.tableHeaderBg, textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Cookie / Identificador</th>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Proveedor</th>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Finalidad</th>
                      <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                        <code style={{ background: colors.codeBg, padding: '2px 6px', borderRadius: '4px' }}>_vercel_speed_insights</code>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Vercel Inc.</td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                        Telemetría técnica anónima de rendimiento web y Core Web Vitals (sin perfiles de usuario).
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Sesión / 24 horas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 6. Almacenamiento local del navegador */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px 0', color: colors.textPrimary }}>
              6. Almacenamiento local del navegador
            </h2>
            <p style={{ margin: '0 0 16px 0', lineHeight: 1.6, color: colors.textSecondary }}>
              Además de las cookies convencionales, el Sitio utiliza tecnologías de almacenamiento local del cliente (<code>localStorage</code> y <code>sessionStorage</code>) con las siguientes finalidades:
            </p>

            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.tableHeaderBg, textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Clave / Elemento</th>
                    <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Finalidad</th>
                    <th style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                      Tokens de autenticación (Supabase)
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                      Mantener la sesión activa del usuario de forma cifrada en cliente.
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                      <span style={{ color: colors.badgeGreenColor, fontWeight: 600 }}>Necesario</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                      Preferencias de interfaz y diseño
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                      Recordar idioma, divisa, tema claro/oscuro y color de acento.
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                      <span style={{ color: colors.badgePurpleColor, fontWeight: 600 }}>Funcionalidad</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                      Datos de caché offline (Service Worker PWA)
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                      Mejorar el rendimiento, garantizar carga instantánea y funcionamiento offline.
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                      <span style={{ color: colors.badgeGreenColor, fontWeight: 600 }}>Necesario</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p style={{ margin: 0, fontSize: '0.88rem', color: colors.textSecondary, lineHeight: 1.5 }}>
              El almacenamiento local no se transmite automáticamente al servidor con cada petición HTTP (a diferencia de las cookies de cabecera) y permanece en tu dispositivo hasta que lo elimines o reajustes tus preferencias.
            </p>
          </section>

          {/* 7. ¿Cómo puedes gestionar las cookies? */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
              7. ¿Cómo puedes gestionar las cookies?
            </h2>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 8px 0', color: colors.textPrimary }}>
                7.1. Panel de configuración de Wallet.ia
              </h3>
              <p style={{ margin: '0 0 12px 0', lineHeight: 1.6, color: colors.textSecondary, fontSize: '0.9rem' }}>
                Accede al panel en cualquier momento desde el banner de cookies o pulsando el botón a continuación. Desde ahí puedes activar o desactivar cada categoría opcional (excepto las estrictamente necesarias):
              </p>
              <button
                type="button"
                onClick={handleOpenCookieSettings}
                style={{
                  backgroundColor: colors.accentLight,
                  border: `1px solid ${colors.accentBorder}`,
                  borderRadius: '9999px',
                  padding: '9px 20px',
                  color: colors.accent,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Sliders size={16} />
                <span>Abrir panel de configuración de cookies</span>
              </button>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 10px 0', color: colors.textPrimary }}>
                7.2. Configuración del navegador
              </h3>
              <p style={{ margin: '0 0 14px 0', lineHeight: 1.6, color: colors.textSecondary, fontSize: '0.9rem' }}>
                Puedes configurar tu navegador web para bloquear o eliminar cookies en cualquier momento. Consulta las instrucciones oficiales de tu navegador:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ backgroundColor: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)', border: colors.cardBorder, borderRadius: '14px', padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Google Chrome</div>
                  <div style={{ fontSize: '0.78rem', color: colors.textMuted }}><code>chrome://settings/cookies</code></div>
                </div>

                <div style={{ backgroundColor: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)', border: colors.cardBorder, borderRadius: '14px', padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Mozilla Firefox</div>
                  <div style={{ fontSize: '0.78rem', color: colors.textMuted }}><code>about:preferences#privacy</code></div>
                </div>

                <div style={{ backgroundColor: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)', border: colors.cardBorder, borderRadius: '14px', padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Apple Safari</div>
                  <div style={{ fontSize: '0.78rem', color: colors.textMuted }}>Ajustes &gt; Safari &gt; Privacidad</div>
                </div>

                <div style={{ backgroundColor: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)', border: colors.cardBorder, borderRadius: '14px', padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Microsoft Edge</div>
                  <div style={{ fontSize: '0.78rem', color: colors.textMuted }}><code>edge://settings/content/cookies</code></div>
                </div>

                <div style={{ backgroundColor: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)', border: colors.cardBorder, borderRadius: '14px', padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Opera</div>
                  <div style={{ fontSize: '0.78rem', color: colors.textMuted }}><code>opera://settings/content/cookies</code></div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 8px 0', color: colors.textPrimary }}>
                7.3. Señal «Do Not Track» (DNT) y Global Privacy Control (GPC)
              </h3>
              <p style={{ margin: 0, lineHeight: 1.6, color: colors.textSecondary, fontSize: '0.9rem' }}>
                Wallet.ia respeta los estándares DNT y GPC emitidos por tu navegador. Cuando se detecta dicha señal activa, no se habilitarán cookies ni telemetría no esencial a menos que manifiestes expresamente lo contrario.
              </p>
            </div>
          </section>

          {/* 8. Transferencias internacionales */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px 0', color: colors.textPrimary }}>
              8. Transferencias internacionales
            </h2>
            <p style={{ margin: '0 0 14px 0', lineHeight: 1.6, color: colors.textSecondary }}>
              Los proveedores de infraestructura tecnológica de Wallet.ia (Supabase Inc. y Vercel Inc.) almacenan los datos de nuestra base de datos en servidores localizados en el Espacio Económico Europeo (UE).
            </p>
            <p style={{ margin: 0, lineHeight: 1.6, color: colors.textSecondary }}>
              En cualquier caso de procesamiento incidental fuera del EEE, se garantiza la aplicación de las <strong>Cláusulas Contractuales Tipo (SCCs)</strong> ratificadas por la Comisión Europea y las garantías del <strong>Marco de Privacidad de Datos UE-EE.UU. (Data Privacy Framework)</strong>.
            </p>
          </section>

          {/* 9. Base legal para el uso de cookies */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px 0', color: colors.textPrimary }}>
              9. Base legal para el uso de cookies
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.tableHeaderBg, textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Categoría</th>
                    <th style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.tableRowBorder}` }}>Base legal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, fontWeight: 600 }}>Estrictamente necesarias</td>
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                      Interés legítimo / Ejecución del contrato (Art. 6.1.b y 6.1.f RGPD — exentas de consentimiento previo bajo el art. 22.2 LSSI-CE).
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, fontWeight: 600 }}>De funcionalidad y preferencias</td>
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                      Consentimiento libre, específico e informado del usuario (Art. 6.1.a RGPD).
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, fontWeight: 600 }}>Analíticas y de rendimiento</td>
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.tableRowBorder}`, color: colors.textSecondary }}>
                      Consentimiento libre, específico e informado del usuario (Art. 6.1.a RGPD).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 10. Derechos del usuario */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px 0', color: colors.textPrimary }}>
              10. Derechos del usuario
            </h2>
            <p style={{ margin: '0 0 14px 0', lineHeight: 1.6, color: colors.textSecondary }}>
              En relación con tus datos asociados a cookies y almacenamiento local, ostentas los derechos reconocidos en el RGPD y la LOPDGDD:
            </p>
            <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: colors.textSecondary, fontSize: '0.9rem' }}>
              <li><strong>Acceso, rectificación, supresión y limitación</strong> del tratamiento de tus datos.</li>
              <li><strong>Oposición y portabilidad</strong> de los datos personales.</li>
              <li><strong>Retirar tu consentimiento</strong> en cualquier instante sin que ello afecte a la licitud del tratamiento previo a su retirada.</li>
            </ul>
            <p style={{ margin: 0, lineHeight: 1.6, color: colors.textSecondary }}>
              Asimismo, tienes derecho a interponer una reclamación ante la autoridad de control competente, la <strong>Agencia Española de Protección de Datos (AEPD)</strong> en <a href="https://www.aepd.es" target="_blank" rel="noreferrer" style={{ color: colors.accent, textDecoration: 'underline' }}>www.aepd.es</a>.
            </p>
          </section>

          {/* 11. Actualizaciones de esta política */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 14px 0', color: colors.textPrimary }}>
              11. Actualizaciones de esta política
            </h2>
            <p style={{ margin: 0, lineHeight: 1.6, color: colors.textSecondary }}>
              Wallet.ia puede actualizar esta Política de Cookies periódicamente para reflejar cambios técnicos, nuevos proveedores o exigencias regulatorias. Te recomendamos revisarla habitualmente. En caso de cambios sustanciales, te lo notificaremos adecuadamente y, si procede, solicitaremos de nuevo tu consentimiento.
            </p>
          </section>

          {/* 12. Contacto */}
          <section
            style={{
              backgroundColor: colors.cardBg,
              border: colors.cardBorder,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: colors.cardShadow,
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 14px 0', color: colors.textPrimary }}>
              12. Contacto
            </h2>
            <p style={{ margin: '0 0 16px 0', lineHeight: 1.6, color: colors.textSecondary }}>
              Si tienes cualquier duda, consulta o sugerencia sobre nuestra Política de Cookies o sobre cómo gestionamos tu privacidad, puedes contactarnos a través de:
            </p>

            <div
              style={{
                backgroundColor: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)',
                border: colors.cardBorder,
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', color: colors.textMuted, marginBottom: '6px', fontWeight: 500 }}>
                  Correo de privacidad y soporte:
                </div>
                <a
                  href="mailto:daniqb99@icloud.com?subject=Consulta%20Wallet.ia%20-%20Privacidad%20y%20Soporte"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: colors.accent,
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    padding: '8px 14px',
                    backgroundColor: colors.accentLight,
                    border: `1px solid ${colors.accentBorder}`,
                    borderRadius: '12px',
                    transition: 'all 0.15s ease',
                    wordBreak: 'break-all',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.88';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  title="Abrir app de correo para enviar mensaje"
                >
                  <Mail size={18} style={{ flexShrink: 0 }} />
                  <span>daniqb99@icloud.com</span>
                </a>
              </div>
              <div style={{ fontSize: '0.84rem', color: colors.textMuted, lineHeight: 1.4 }}>
                Responsable del tratamiento: Wallet.ia
              </div>
            </div>
          </section>

          {/* Botón flotante inferior para volver a la app */}
          <div style={{ textAlign: 'center', paddingTop: '10px' }}>
            <button
              type="button"
              onClick={handleGoBack}
              style={{
                backgroundColor: colors.cardBg,
                border: colors.cardBorder,
                borderRadius: '9999px',
                padding: '11px 28px',
                color: colors.textPrimary,
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: colors.cardShadow,
              }}
            >
              <ArrowLeft size={16} />
              <span>{t('back')}</span>
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
