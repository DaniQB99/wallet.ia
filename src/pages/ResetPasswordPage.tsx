import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../shared/api/supabase';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';
import { getAuthErrorI18nKey } from '../shared/lib/supabaseErrors';

/**
 * Página dedicada y segura para la recuperación y restablecimiento de contraseña.
 * Soporta solicitud de enlace por correo, verificación directa de código OTP y
 * establecimiento de nueva clave con validación en tiempo real.
 */
export default function ResetPasswordPage() {
  const { t } = useLocaleCurrency();
  const navigate = useNavigate();
  const location = useLocation();

  // Estados del flujo
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [email, setEmail] = useState((location.state as { email?: string })?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Estados para nueva contraseña
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  // Estados de carga y feedback
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  // Validaciones de seguridad en tiempo real
  const hasMinLength = newPassword.length >= 6;
  const hasLower = /[a-z]/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === repeatPassword;
  const isFormValid =
    hasMinLength && hasLower && hasUpper && hasNumber && hasSymbol && passwordsMatch;

  // Detectar token de recuperación o sesión activa de tipo recovery
  useEffect(() => {
    // 1. Escuchar eventos de Supabase Auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
        setErrorKey(null);
      }
    });

    // 2. Verificar parámetros en URL (hash o query params de Supabase)
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('type=recovery') || search.includes('type=recovery') || search.includes('code=')) {
      setIsRecoverySession(true);
    }

    // 3. Comprobar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && (hash.includes('type=recovery') || search.includes('code='))) {
        setIsRecoverySession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const clearMessages = () => {
    setErrorKey(null);
    setCustomError(null);
  };

  // Paso 1: Enviar enlace al correo
  const handleSendLink = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCustomError(t('invalidEmailFormat'));
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setErrorKey(getAuthErrorI18nKey(resetError.message));
      } else {
        setLinkSent(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setErrorKey(getAuthErrorI18nKey(message));
    } finally {
      setLoading(false);
    }
  };

  // Paso 1B: Verificar código OTP si el usuario lo tiene
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email || !otpCode.trim()) {
      setCustomError(t('enterEmailAndCode'));
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: 'recovery',
      });

      if (otpError) {
        setErrorKey(getAuthErrorI18nKey(otpError.message));
      } else {
        setIsRecoverySession(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setErrorKey(getAuthErrorI18nKey(message));
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Guardar nueva contraseña
  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!isFormValid) {
      setErrorKey('passwordRequirementsNotMet');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setErrorKey(getAuthErrorI18nKey(updateError.message));
      } else {
        setSuccess(true);
        // Redirigir suavemente tras 3 segundos
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setErrorKey(getAuthErrorI18nKey(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('resetPasswordTitle')} - Wallet.ia</title>
        <meta
          name="description"
          content="Recupera el acceso a tu cuenta de Wallet.ia de forma rápida y segura."
        />
      </Helmet>

      <div className="auth-page auth-page--centered">
        {/* Esferas decorativas */}
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />

        <div className="auth-container">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Sparkles size={28} />
            </div>
            <span className="auth-logo-text">wallet.ia</span>
          </div>

          <div className="auth-card">
            {/* Cabecera */}
            <div className="auth-card-header">
              <h1 className="auth-title">{t('resetPasswordTitle')}</h1>
              <p className="auth-subtitle">{t('resetPasswordSubtitle')}</p>
            </div>

            {/* Notificaciones de error */}
            {(errorKey || customError) && (
              <div className="auth-error" role="alert">
                <AlertCircle size={18} />
                <span>{customError || (errorKey ? t(errorKey) : '')}</span>
              </div>
            )}

            {/* Éxito total */}
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '16px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--success-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--success)',
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {t('passwordResetSuccessTitle')}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  {t('passwordResetSuccessDesc')}
                </p>
                <Link
                  to="/auth"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {t('goToLogin')}
                </Link>
              </motion.div>
            ) : isRecoverySession ? (
              /* Paso 2: Establecer nueva contraseña */
              <form onSubmit={handleUpdatePassword} className="auth-form">
                <div className="auth-field">
                  <label className="form-label">{t('newPassword')}</label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowNew(!showNew)}
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="form-label">{t('repeatNewPassword')}</label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type={showRepeat ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowRepeat(!showRepeat)}
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showRepeat ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Requisitos visuales de seguridad */}
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      color: hasMinLength ? 'var(--success)' : 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: hasMinLength ? 'var(--success)' : 'var(--text-tertiary)',
                      }}
                    />
                    {t('passwordMinLength')}
                  </div>
                  <div
                    style={{
                      color: hasUpper ? 'var(--success)' : 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: hasUpper ? 'var(--success)' : 'var(--text-tertiary)',
                      }}
                    />
                    {t('passwordAtLeastOneUpper')}
                  </div>
                  <div
                    style={{
                      color: hasLower ? 'var(--success)' : 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: hasLower ? 'var(--success)' : 'var(--text-tertiary)',
                      }}
                    />
                    {t('passwordAtLeastOneLower')}
                  </div>
                  <div
                    style={{
                      color: hasNumber ? 'var(--success)' : 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: hasNumber ? 'var(--success)' : 'var(--text-tertiary)',
                      }}
                    />
                    {t('passwordAtLeastOneNumber')}
                  </div>
                  <div
                    style={{
                      color: hasSymbol ? 'var(--success)' : 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: hasSymbol ? 'var(--success)' : 'var(--text-tertiary)',
                      }}
                    />
                    {t('passwordAtLeastOneSymbol')}
                  </div>
                  <div
                    style={{
                      color: passwordsMatch ? 'var(--success)' : 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: passwordsMatch ? 'var(--success)' : 'var(--text-tertiary)',
                      }}
                    />
                    {passwordsMatch ? t('passwordsMatch') : t('passwordsDoNotMatch')}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg auth-submit"
                  disabled={loading || !isFormValid}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner-sm" />
                      <span>{t('saving')}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>{t('saveNewPassword')}</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Paso 1: Solicitar enlace o código */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {linkSent ? (
                  <div
                    className="auth-error"
                    style={{
                      background: 'var(--success-bg)',
                      borderColor: 'rgba(16,185,129,0.25)',
                      color: 'var(--success)',
                    }}
                  >
                    <CheckCircle size={18} />
                    <span>{t('resetLinkSent')}</span>
                  </div>
                ) : null}

                {!showOtpInput ? (
                  <form onSubmit={handleSendLink} className="auth-form">
                    <div className="auth-field">
                      <label className="form-label">{t('email')}</label>
                      <div className="auth-input-wrapper">
                        <Mail size={18} className="auth-input-icon" />
                        <input
                          type="email"
                          placeholder="tu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg auth-submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner-sm" />
                          <span>{t('sending')}</span>
                        </>
                      ) : (
                        <>
                          <span>{t('sendResetLink')}</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="auth-form">
                    <div className="auth-field">
                      <label className="form-label">{t('email')}</label>
                      <div className="auth-input-wrapper">
                        <Mail size={18} className="auth-input-icon" />
                        <input
                          type="email"
                          placeholder="tu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="auth-field">
                      <label className="form-label">{t('otpCode')}</label>
                      <div className="auth-input-wrapper">
                        <KeyRound size={18} className="auth-input-icon" />
                        <input
                          type="text"
                          placeholder={t('enterOtpCode')}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          required
                          disabled={loading}
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg auth-submit"
                      disabled={loading || !otpCode.trim()}
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner-sm" />
                          <span>{t('verifying')}</span>
                        </>
                      ) : (
                        <>
                          <span>{t('verifyCode')}</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Alternar entre Enlace y Código OTP */}
                <div style={{ textAlign: 'center', marginTop: '-8px' }}>
                  <button
                    type="button"
                    className="auth-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                    onClick={() => {
                      clearMessages();
                      setShowOtpInput(!showOtpInput);
                    }}
                  >
                    {showOtpInput ? t('resetPasswordEmailPrompt') : t('haveOtpCodePrompt')}
                  </button>
                </div>
              </div>
            )}

            {/* Pie de página con regreso a login */}
            <div className="auth-footer">
              <Link to="/auth" className="auth-link">
                ← {t('backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
