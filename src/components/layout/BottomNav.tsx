import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Plus,
  Settings,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Inicio' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Movimientos' },
  { path: '/transactions?add=true', icon: Plus, label: '', isAdd: true },
  { path: '/goals', icon: Target, label: 'Metas' },
  { path: '/settings', icon: Settings, label: 'Ajustes' },
];

export default function BottomNav() {
  const location = useLocation();

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
                  aria-label="Añadir transacción"
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
