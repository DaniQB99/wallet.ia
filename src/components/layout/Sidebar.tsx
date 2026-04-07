import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

export default function Sidebar() {
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: ArrowLeftRight, label: 'Transacciones' },
    { path: '/goals', icon: Target, label: 'Metas' },
    {
      path: '/notifications',
      icon: Bell,
      label: 'Notificaciones',
      badge: unreadCount,
    },
    { path: '/settings', icon: Settings, label: 'Ajustes' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">W</div>
        <span className="sidebar-logo-text">wallet.ia</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menú principal</div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon />
              {item.label}
              {item.badge ? <span className="badge">{item.badge}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-profile">
          <div className="avatar">
            {user?.display_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">{user?.display_name || 'Usuario'}</div>
            <div className="sidebar-profile-email">{user?.email || ''}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

