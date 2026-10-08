import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Camera } from 'lucide-react';
import { useAuthContext } from '../../../app/providers/AuthContext';
import { supabase } from '../../../shared/api/supabase';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';
import { motion } from 'framer-motion';

/**
 * Modal para la gestión y actualización del perfil del usuario (nombre y avatar).
 * Sigue el Window Header Contract y se renderiza en un portal para evitar interferencias.
 */
export default function ProfileSettings({ onClose }: { onClose: () => void }) {
  const { user, updateProfile, updateAvatarUrl } = useAuthContext();
  const { t } = useLocaleCurrency();

  // Estado del perfil
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Ref para subida de imagen
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];

      // Validaciones básicas de archivo
      if (!file.type.startsWith('image/')) {
        setProfileMessage({ text: t('validImageRequired'), type: 'error' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // Límite de 5MB
        setProfileMessage({ text: t('imageMaxLimit'), type: 'error' });
        return;
      }

      setIsUploadingAvatar(true);
      setProfileMessage(null);

      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar_${Date.now()}.${fileExt}`;

      // Subida al bucket avatars en Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Actualizar registro en base de datos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Sincronizar estado local en memoria
      updateAvatarUrl(publicUrl);
      setProfileMessage({ text: t('avatarUpdatedSuccess'), type: 'success' });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setProfileMessage({
        text: error.message || t('avatarUploadError'),
        type: 'error',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      style={{ zIndex: 1100 }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
          width: '100%',
          maxWidth: '440px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera estandarizada (Window Header Contract) */}
        <div
          style={{
            position: 'relative',
            padding: '24px 20px 16px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
            textAlign: 'center',
          }}
        >
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('close')}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
            }}
          >
            <X size={20} />
          </button>
          <h2
            className="modal-title"
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {t('profileManagement')}
          </h2>
          <p
            className="modal-subtitle"
            style={{
              margin: '6px 0 0',
              fontSize: '0.85rem',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
            }}
          >
            {t('profileSubtitle')}
          </p>
        </div>

        <div
          className="modal-scroll-area"
          style={{
            padding: '24px',
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative' }}>
                <div
                  className="avatar"
                  style={{
                    width: '88px',
                    height: '88px',
                    fontSize: '2.2rem',
                    overflow: 'hidden',
                    borderRadius: '50%',
                    border: '2px solid var(--border)',
                  }}
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    displayName.charAt(0) ||
                    user?.display_name?.charAt(0) ||
                    '?'
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
                  type="button"
                  className="btn-icon"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '50%',
                    padding: '8px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  aria-label={t('edit')}
                >
                  <Camera
                    size={16}
                    color={
                      isUploadingAvatar
                        ? 'var(--text-tertiary)'
                        : 'var(--text-secondary)'
                    }
                  />
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
                onChange={e => setDisplayName(e.target.value)}
                placeholder={t('name')}
                className="input"
              />
            </div>

            {profileMessage && (
              <div
                className={`alert ${profileMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}
              >
                {profileMessage.text}
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={handleUpdateProfile}
              disabled={
                isSavingName ||
                displayName === user?.display_name ||
                !displayName.trim()
              }
            >
              {isSavingName ? (
                t('saving')
              ) : (
                <>
                  <Save size={18} /> {t('saveChanges')}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
