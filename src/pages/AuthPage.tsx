import { useState, useEffect, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle, X } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const { user, loading, error, signIn, signUp, clearError } = useAuthContext();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Auto-dismiss success toast
  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => setRegistrationSuccess(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [registrationSuccess]);

  // If already authenticated, redirect to dashboard
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
              {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
            </h1>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Inicia sesión para gestionar tus finanzas'
                : 'Empieza a controlar tus gastos en pareja'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="toggle-group" style={{ marginBottom: '28px' }}>
            <button
              className={`toggle-item ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
              type="button"
            >
              Iniciar sesión
            </button>
            <button
              className={`toggle-item ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
              type="button"
            >
              Registrarse
            </button>
          </div>

          {/* Error message */}
          {(error || localError) && (
            <div className="auth-error">
              <span>⚠️</span>
              <span>{error || localError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="auth-field">
                <label className="form-label">Nombre</label>
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
              <label className="form-label">Email</label>
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

            <div className="auth-field">
              <label className="form-label">Contraseña</label>
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

          {/* Footer */}
          <div className="auth-footer">
            {mode === 'login' ? (
              <p>
                ¿No tienes cuenta?{' '}
                <button type="button" className="auth-link" onClick={() => switchMode('register')}>
                  Regístrate aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes cuenta?{' '}
                <button type="button" className="auth-link" onClick={() => switchMode('login')}>
                  Inicia sesión
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="auth-tagline">
          Finanzas en pareja, simplificadas ✨
        </div>
      </div>
    </div>
  );
}
