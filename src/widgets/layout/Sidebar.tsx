import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuthContext } from '../../app/providers/AuthContext';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';

/**
 * Barra lateral (Sidebar) de navegación diseñada para pantallas grandes (Desktop UI).
 * Orquesta enlaces a las vistas primarias e incluye un sub-componente en el pie
 * para mostrar la sesión del usuario actual y cerrar sesión (`LogOut`).
 */
export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { t } = useLocaleCurrency();

  const navItems: { path: string; icon: LucideIcon; label: string; badge?: number }[] = [
    { path: '/', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/analytics', icon: BarChart3, label: t('analytics') },
    { path: '/transactions', icon: ArrowLeftRight, label: t('transactions') },
    { path: '/goals', icon: Target, label: t('goals') },
    { path: '/settings', icon: Settings, label: t('settings') },
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
        <div className="sidebar-section-label">{t('mainMenu')}</div>
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
            <div className="sidebar-profile-name">{user?.display_name || 'User'}</div>
            <div className="sidebar-profile-email">{user?.email || ''}</div>
          </div>
          <button
            onClick={handleLogout}
            title={t('logout')}
            style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

