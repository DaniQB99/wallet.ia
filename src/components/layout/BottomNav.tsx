import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Plus,
  Settings,
} from 'lucide-react';
import { useLocaleCurrency } from '../../contexts/LocaleCurrencyContext';

export default function BottomNav() {
  const location = useLocation();
  const { t } = useLocaleCurrency();
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('home') },
    { path: '/transactions', icon: ArrowLeftRight, label: t('movements') },
    { path: '/transactions?add=true', icon: Plus, label: '', isAdd: true },
    { path: '/goals', icon: Target, label: t('goals') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-items">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          if (item.isAdd) {
            return (
              <div key="add" className="bottom-nav-slot">
                <NavLink
                  to={item.path}
                  className="bottom-nav-add-btn"
                  aria-label={t('addTransaction')}
                >
                  <Icon />
                </NavLink>
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
