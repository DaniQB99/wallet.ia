import { useState } from 'react';
import { X, User, Lock, Save, Camera } from 'lucide-react';
import { useAuthContext } from '../../../app/providers/AuthContext';
import { supabase } from '../../../shared/api/supabase';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';

/**
 * Componente estructurado en pestañas (tabs) enfocado a las credenciales y el perfil del usuario.
 * Facilita un dashboard de control para actualizar de manera asíncrona el `displayName` de Supabase
 * y reconfigurar la contraseña del sistema si aplica.
 *
 * @param props - Incluye utilidades del renderizado del modal, como `onClose`.
 */
export default function ProfileSettings({ onClose }: { onClose: () => void }) {
  const { user, updateProfile } = useAuthContext();
  const { t } = useLocaleCurrency();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Estado del perfil
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Estado de seguridad
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) return;
    setIsSavingName(true);
    setProfileMessage(null);

    const success = await updateProfile(displayName);
    if (success) {
      setProfileMessage({ text: t('saveChanges'), type: 'success' });
    } else {
      setProfileMessage({ text: t('updating'), type: 'error' });
    }
    setIsSavingName(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setSecurityMessage({ text: t('passwordMin'), type: 'error' });
      return;
    }

    setIsSavingPassword(true);
    setSecurityMessage(null);

    try {
      // En una aplicación real, podríamos verificar la contraseña actual primero a través de una reautenticación,
      // pero supabase.auth.updateUser solo necesita la sesión activa.
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setSecurityMessage({ text: t('updatePassword'), type: 'success' });
      setNewPassword('');
    } catch (err: any) {
      setSecurityMessage({ text: err.message || t('updating'), type: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content profile-modal animate-in" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('profileManagement')}</h2>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'profile' ? 600 : 400, cursor: 'pointer' }}
          >
            <User size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> {t('profileTab')}
          </button>
          <button
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: activeTab === 'security' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'security' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'security' ? 600 : 400, cursor: 'pointer' }}
          >
            <Lock size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> {t('securityTab')}
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'profile' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                    {displayName.charAt(0) || user?.display_name?.charAt(0) || '?'}
                  </div>
                  <button className="btn-icon" style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '50%', padding: '6px' }}>
                    <Camera size={14} color="var(--text-secondary)" />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>{t('emailAddress')}</label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="input"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>{t('displayName')}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('name')}
                  className="input"
                />
              </div>

              {profileMessage && (
                <div className={`alert ${profileMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {profileMessage.text}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={handleUpdateProfile}
                disabled={isSavingName || displayName === user?.display_name || !displayName.trim()}
              >
                {isSavingName ? t('saving') : (<><Save size={18} /> {t('saveChanges')}</>)}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label>{t('newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('passwordMin')}
                  className="input"
                />
              </div>

              {securityMessage && (
                <div className={`alert ${securityMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {securityMessage.text}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={handleUpdatePassword}
                disabled={isSavingPassword || !newPassword || newPassword.length < 6}
              >
                {isSavingPassword ? t('updating') : (<><Lock size={18} /> {t('updatePassword')}</>)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
