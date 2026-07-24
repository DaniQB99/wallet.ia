import { X, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../model/useNotifications';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';

interface NotificationsModalProps {
  onClose: () => void;
}

const typeIcons: Record<string, string> = {
  shared_transaction: '💳',
  goal_contribution: '🎯',
  goal_reached: '🎉',
  couple_linked: '💕',
  couple_unlinked: '💔',
};

const typeColors: Record<string, string> = {
  shared_transaction: 'var(--accent-primary-glow)',
  goal_contribution: 'var(--success-bg)',
  goal_reached: 'var(--warning-bg)',
  couple_linked: 'rgba(236, 72, 153, 0.12)',
  couple_unlinked: 'var(--danger-bg)',
};

function timeAgo(dateStr: string, locale: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

/**
 * Modal dinámico e interactivo que presenta la bandeja de entrada de notificaciones
 * para el usuario activo. Gestiona notificaciones en tiempo real, permite marcar leídas y resalta alertas.
 *
 * @param props - Incluye utilidades del renderizado del modal, como `onClose`.
 */
export default function NotificationsModal({ onClose }: NotificationsModalProps) {
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const { locale, t } = useLocaleCurrency();

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="modal-content fullscreen"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-header-left">
              <button className="btn-icon" onClick={onClose}>
                <X size={24} />
              </button>
              <h2 className="modal-title">{t('inbox')}</h2>
            </div>
            {unreadCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>
                <CheckCheck size={16} /> {t('markAllRead')}
              </button>
            )}
          </div>

          <div className="modal-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="empty-state">
                <div className="loading-spinner" />
                <div className="empty-state-title">{t('loadingModule')}</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔔</div>
                <div className="empty-state-title">{t('noNotifications')}</div>
                <div className="empty-state-desc">
                  {t('notificationsDesc')}
                </div>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    {!notif.is_read && <div className="notification-dot" />}
                    <div
                      className="notification-icon"
                      style={{ background: typeColors[notif.type] || 'var(--bg-glass)' }}
                    >
                      {typeIcons[notif.type] || '🔔'}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notif.title}</div>
                      <div className="notification-message">{notif.message}</div>
                      <div className="notification-time">{timeAgo(notif.created_at, locale)}</div>
                    </div>
                    {!notif.is_read && (
                      <button
                        className="btn btn-sm btn-secondary btn-icon"
                        onClick={e => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`
        .notification-list {
          display: flex;
          flex-direction: column;
        }

        .notification-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: var(--transition-fast);
          position: relative;
        }

        .notification-item:hover {
          background: var(--bg-hover);
        }

        .notification-item.unread {
          background: var(--accent-primary-alpha);
        }

        .notification-dot {
          position: absolute;
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: var(--accent-primary);
          border-radius: var(--radius-full);
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .notification-message {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .notification-time {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin-top: 4px;
        }
      `}</style>
    </AnimatePresence>
  );
}
