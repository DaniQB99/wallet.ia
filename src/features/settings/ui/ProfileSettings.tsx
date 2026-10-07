import { useState, useRef } from 'react';
import { X, User, Lock, Save, Camera } from 'lucide-react';
import { useAuthContext } from '../../../app/providers/AuthContext';
import { supabase } from '../../../shared/api/supabase';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import { motion } from 'framer-motion';

/**
 * Componente estructurado en pestañas (tabs) enfocado a las credenciales y el perfil del usuario.
 * Facilita un dashboard de control para actualizar de manera asíncrona el `displayName` de Supabase
 * y reconfigurar la contraseña del sistema si aplica.
 *
 * @param props - Incluye utilidades del renderizado del modal, como `onClose`.
 */
export default function ProfileSettings({ onClose }: { onClose: () => void }) {
  const { user, updateProfile, updateAvatarUrl } = useAuthContext();
  const { t } = useLocaleCurrency();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Estado del perfil
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Ref para subida de imagen
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Estado de seguridad
  const [currentPassword, setCurrentPassword] = useState('');
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      
      // Basic validation
      if (!file.type.startsWith('image/')) {
        setProfileMessage({ text: t('validImageRequired'), type: 'error' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setProfileMessage({ text: t('imageMaxLimit'), type: 'error' });
        return;
      }

      setIsUploadingAvatar(true);
      setProfileMessage(null);

      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Update local state
      updateAvatarUrl(publicUrl);
      setProfileMessage({ text: t('avatarUpdatedSuccess'), type: 'success' });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setProfileMessage({ text: error.message || t('avatarUploadError'), type: 'error' });
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      setSecurityMessage({ text: t('currentPasswordRequired'), type: 'error' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setSecurityMessage({ text: t('passwordMin'), type: 'error' });
      return;
    }
    if (currentPassword === newPassword) {
      setSecurityMessage({ text: t('newPasswordMustBeDifferent'), type: 'error' });
      return;
    }

    setIsSavingPassword(true);
    setSecurityMessage(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error(t('currentPasswordIncorrect'));
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setSecurityMessage({ text: t('updatePassword'), type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setSecurityMessage({ text: err.message || t('updating'), type: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        className="modal animate-in"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(92vh, 92dvh, 720px)',
          minHeight: 0,
          margin: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border)', marginBottom: 0, flexShrink: 0 }}>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            style={{ left: '20px' }}
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
          <h2 className="modal-title">
            {t('profileManagement')}
          </h2>
        </div>

        <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
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

        <div className="modal-scroll-area" style={{ padding: '24px', flex: 1, overflowY: 'auto', minHeight: 0, touchAction: 'pan-y', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          {activeTab === 'profile' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', overflow: 'hidden' }}>
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      displayName.charAt(0) || user?.display_name?.charAt(0) || '?'
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleAvatarUpload} 
                  />
                  <button 
                    className="btn-icon" 
                    style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '50%', padding: '6px' }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Camera size={14} color={isUploadingAvatar ? "var(--text-tertiary)" : "var(--text-secondary)"} />
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
                <label>{t('currentPassword')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('enterCurrentPassword')}
                  className="input"
                />
              </div>

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
                disabled={isSavingPassword || !currentPassword || !newPassword || newPassword.length < 6 || currentPassword === newPassword}
              >
                {isSavingPassword ? t('updating') : (<><Lock size={18} /> {t('updatePassword')}</>)}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
