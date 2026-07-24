import { useState, useEffect, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle, X } from 'lucide-react';
import { useAuthContext } from '../app/providers/AuthContext';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';

type AuthMode = 'login' | 'register';

/**
 * Página principal de Autenticación de la aplicación Wallet.ia.
 * Gestiona el flujo completo de inicio de sesión y registro de cuentas (Email/Password, OAuth con Google/GitHub).
 * Integra recuperación de contraseñas y retroalimentación interactiva de estado mediante notificaciones visuales (toasts).
 */
export default function AuthPage() {
  const { user, loading, error, signIn, signUp, signInWithOAuth, resetPassword, clearError } = useAuthContext();
  const { t } = useLocaleCurrency();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

    const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Descartar notificación de éxito automáticamente
  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => setRegistrationSuccess(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [registrationSuccess]);

  // Si ya está autenticado, redirigir al dashboard
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearError();
    setLocalError(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setRegistrationSuccess(false);
    setResetSent(false);

    if (mode === 'register' && !validateEmail(email)) {
      setLocalError('El correo electrónico no tiene un formato válido.');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        const success = await signUp(email, password, displayName);
        if (success) {
          setEmail('');
          setPassword('');
          setDisplayName('');
          setRegistrationSuccess(true);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    clearError();
    setLocalError(null);
    setResetSent(false);

    if (!validateEmail(email)) {
      setLocalError('Introduce un email válido para recuperar la contraseña.');
      return;
    }
    const success = await resetPassword(email);
    setResetSent(success);
  };

  return (
    <div className="auth-page">
      {/* Success toast */}
      {registrationSuccess && (
        <div className="auth-toast auth-toast-success">
          <CheckCircle size={20} />
          <div className="auth-toast-content">
            <div className="auth-toast-title">¡Cuenta creada con éxito!</div>
            <div className="auth-toast-message">Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.</div>
          </div>
          <button className="auth-toast-close" onClick={() => setRegistrationSuccess(false)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Background decoration */}
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
          {/* Header */}
          <div className="auth-card-header">
            <h1 className="auth-title">
              {mode === 'login' ? t('welcomeBack') : t('createAccount')}
            </h1>
            <p className="auth-subtitle">
              {mode === 'login'
                ? t('authLoginSubtitle')
                : t('authRegisterSubtitle')}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="toggle-group" style={{ marginBottom: '28px' }}>
            <button
              className={`toggle-item ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
              type="button"
            >
              {t('login')}
            </button>
            <button
              className={`toggle-item ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
              type="button"
            >
              {t('register')}
            </button>
          </div>

          {/* Error message */}
          {(error || localError) && (
            <div className="auth-error">
              <span>⚠️</span>
              <span>{error || localError}</span>
            </div>
          )}
          {resetSent && (
            <div className="auth-error" style={{ background: 'var(--success-bg)', borderColor: 'rgba(16,185,129,0.25)', color: 'var(--success)' }}>
              <span>✅</span>
              <span>Revisa tu correo. Te hemos enviado el enlace de recuperación.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="auth-field">
                <label className="form-label">{t('name')}</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

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
                />
              </div>
            </div>

            {mode === 'login' && (
              <button
                type="button"
                className="auth-link"
                onClick={handleResetPassword}
                style={{ alignSelf: 'flex-end', marginTop: '-10px' }}
              >
                {t('forgotPassword')}
              </button>
            )}

            <div className="auth-field">
              <label className="form-label">{t('password')}</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={submitting || loading}
            >
              {submitting ? (
                <>
                  <div className="loading-spinner-sm" />
                  {mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* OAuth Divider */}
          <div className="auth-divider">
            <span>o continúa con</span>
          </div>

          {/* OAuth Buttons */}
          <div className="auth-oauth-group">
            <button
              type="button"
              className="auth-oauth-btn auth-oauth-btn-github"
              onClick={() => signInWithOAuth('github')}
              disabled={submitting || loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              GitHub
            </button>
            <button
              type="button"
              className="auth-oauth-btn auth-oauth-btn-google"
              onClick={() => signInWithOAuth('google')}
              disabled={submitting || loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
          </div>

          {/* Footer */}
          <div className="auth-footer">
            {mode === 'login' ? (
              <p>
                {t('noAccount')}{' '}
                <button type="button" className="auth-link" onClick={() => switchMode('register')}>
                  {t('signUpHere')}
                </button>
              </p>
            ) : (
              <p>
                {t('alreadyHaveAccount')}{' '}
                <button type="button" className="auth-link" onClick={() => switchMode('login')}>
                  {t('signInHere')}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Value Proposition Section */}
        <div className="auth-value-props">
          <div className="auth-tagline">
            <span>Finanzas en pareja, </span>
            <span className="auth-tagline-highlight">simplificadas ✨</span>
          </div>

          <div className="value-props-grid">
            <div className="value-prop-card">
              <div className="vp-icon">📈</div>
              <h3>{t('valueProp1Title')}</h3>
              <p>{t('valueProp1Desc')}</p>
            </div>
            <div className="value-prop-card">
              <div className="vp-icon">🤝</div>
              <h3>{t('valueProp2Title')}</h3>
              <p>{t('valueProp2Desc')}</p>
            </div>
            <div className="value-prop-card">
              <div className="vp-icon">🔒</div>
              <h3>{t('valueProp3Title')}</h3>
              <p>{t('valueProp3Desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
