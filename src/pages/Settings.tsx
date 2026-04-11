import { useNavigate } from 'react-router-dom';
import {
  User,
  Heart,
  Bell,
  Shield,
  Palette,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useAppearance } from '../contexts/AppearanceContext';
import { Wallet, Tag } from 'lucide-react';
import AccountsSettings from '../components/AccountsSettings';
import CategoriesSettings from '../components/CategoriesSettings';
import ProfileSettings from '../components/ProfileSettings';
import PartnerSettings from '../components/PartnerSettings';
import NotificationsModal from '../components/NotificationsModal';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Trash2 } from 'lucide-react';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  action?: React.ReactNode;
  danger?: boolean;
}

function SettingsItem({ icon, label, desc, action, danger }: SettingsItemProps) {
  return (
    <div className="settings-item" style={{ cursor: 'pointer' }}>
      <div className="settings-item-left">
        <div className="settings-item-icon">{icon}</div>
        <div>
          <div className="settings-item-label" style={danger ? { color: 'var(--danger)' } : {}}>{label}</div>
          {desc && <div className="settings-item-desc">{desc}</div>}
        </div>
      </div>
      {action || <ChevronRight size={18} color="var(--text-tertiary)" />}
    </div>
  );
}

export default function Settings() {
  const { user, signOut } = useAuthContext();
  const { theme, setTheme, accentColor, setAccentColor } = useAppearance();
  const navigate = useNavigate();
  const [showAccounts, setShowAccounts] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const cycleAccentColor = () => {
    const colors: ('indigo' | 'emerald' | 'rose' | 'amber')[] = ['indigo', 'emerald', 'rose', 'amber'];
    const currentIndex = colors.indexOf(accentColor);
    setAccentColor(colors[(currentIndex + 1) % colors.length]);
  };

  // Prompt de instalación PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('La app ya está instalada o tu navegador no soporta esta función.');
    }
  };

  // Notificaciones
  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('Notificaciones activadas con éxito.');
    } else {
      alert('Permiso de notificaciones denegado.');
    }
  };

  // Gestión de Datos
  const handleExportData = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, type, amount, description, date,
          accounts(name), categories(name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        alert('No hay datos para exportar.');
        return;
      }

      // Convert to CSV
      const headers = ['ID', 'Tipo', 'Monto', 'Descripción', 'Fecha', 'Cuenta', 'Categoría'];
      const csvRows = [headers.join(',')];

      data.forEach(t => {
        const accName = Array.isArray(t.accounts) ? t.accounts[0]?.name : (t.accounts as any)?.name;
        const catName = Array.isArray(t.categories) ? t.categories[0]?.name : (t.categories as any)?.name;

        const row = [
          t.id,
          t.type,
          t.amount,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          t.date,
          `"${(accName || '').replace(/"/g, '""')}"`,
          `"${(catName || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `wallet_ia_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error(err);
      alert('Error exportando datos: ' + err.message);
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) {
      alert('Para eliminar tu cuenta definitivamente, por favor envía un correo a soporte@wallet.ia desde tu correo registrado o espera a la próxima actualización.');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Ajustes</h1>
          <p>Configura tu experiencia en wallet.ia</p>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: '640px' }}>
        {/* Profile */}
        <div className="card animate-in" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="avatar avatar-lg">
              {user?.display_name?.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {user?.display_name || 'Usuario'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {user?.email || ''}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowProfile(true)}>Editar</button>
          </div>
        </div>

        {/* Gestión de Datos */}
        <div className="settings-section">
          <div className="settings-section-title">Gestión de Datos</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={() => setShowAccounts(true)}>
              <SettingsItem
                icon={<Wallet size={20} color="var(--accent-primary)" />}
                label="Cuentas Bancarias"
                desc="Gestiona tus cuentas y tarjetas"
              />
            </div>
            <div onClick={() => setShowCategories(true)}>
              <SettingsItem
                icon={<Tag size={20} color="var(--accent-primary)" />}
                label="Categorías"
                desc="Personaliza tus categorías de gastos"
              />
            </div>
          </div>
        </div>

        {/* Pareja */}
        <div className="settings-section">
          <div className="settings-section-title">Pareja</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={() => setShowPartner(true)}>
              <SettingsItem
                icon={<Heart size={20} color="#EC4899" />}
                label="Estado de pareja"
                desc={'Vincula tu cuenta o gestiona tu pareja'}
              />
            </div>
          </div>
        </div>

        {/* Apariencia */}
        <div className="settings-section">
          <div className="settings-section-title">Apariencia</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={toggleTheme}>
              <SettingsItem
                icon={theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                label={theme === 'dark' ? "Tema oscuro" : "Tema claro"}
                desc={theme === 'dark' ? "Activado" : "Activado"}
                action={
                  <div style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-full)',
                    background: theme === 'dark' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    pointerEvents: 'none',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: 'var(--radius-full)',
                      background: theme === 'dark' ? 'white' : 'var(--text-secondary)',
                      position: 'absolute',
                      top: '3px',
                      right: theme === 'dark' ? '3px' : 'auto',
                      left: theme === 'dark' ? 'auto' : '3px',
                      transition: 'var(--transition-fast)',
                    }} />
                  </div>
                }
              />
            </div>

            <div onClick={cycleAccentColor}>
              <SettingsItem
                icon={<Palette size={20} />}
                label="Color de acento"
                desc={
                  accentColor === 'indigo' ? 'Índigo' :
                  accentColor === 'emerald' ? 'Esmeralda' :
                  accentColor === 'rose' ? 'Rosa' : 'Ámbar'
                }
                action={
                  <div style={{ display: 'flex', gap: '8px', pointerEvents: 'none' }}>
                    {['indigo', 'emerald', 'rose', 'amber'].map(color => (
                        <div key={color} style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: 'var(--radius-full)',
                          background: color === 'indigo' ? 'var(--accent-gradient)' :
                                      color === 'emerald' ? 'linear-gradient(135deg, #10B981, #059669)' :
                                      color === 'rose' ? 'linear-gradient(135deg, #F43F5E, #E11D48)' :
                                      'linear-gradient(135deg, #FBBF24, #F59E0B)',
                          opacity: accentColor === color ? 1 : 0.3,
                          border: accentColor === color ? '2px solid var(--border-accent)' : 'none',
                          transform: accentColor === color ? 'scale(1.1)' : 'scale(1)',
                          transition: 'var(--transition-fast)'
                        }} />
                    ))}
                  </div>
                }
              />
            </div>

            <SettingsItem
              icon={<Globe size={20} />}
              label="Idioma"
              desc="Español (predeterminado)"
            />
          </div>
        </div>

        {/* Notificaciones */}
        <div className="settings-section">
          <div className="settings-section-title">Notificaciones y App</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={() => setShowNotifications(true)}>
              <SettingsItem
                icon={<Bell size={20} />}
                label="Bandeja de entrada"
                desc="Consulta tus notificaciones recientes"
              />
            </div>
            <div onClick={requestNotifications}>
              <SettingsItem
                icon={<Smartphone size={20} />}
                label="Notificaciones push"
                desc={typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'Activadas' : 'Toca para activar'}
              />
            </div>
            <div onClick={handleInstallClick}>
              <SettingsItem
                icon={<Smartphone size={20} />}
                label="Instalar como app"
                desc={deferredPrompt ? 'Disponible para instalar' : 'Configurado'}
              />
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className="settings-section">
          <div className="settings-section-title">Seguridad y privacidad</div>
          <div className="card" style={{ padding: 0 }}>
            <SettingsItem
              icon={<Shield size={20} />}
              label="Privacidad de datos"
              desc="Tus transacciones personales son solo tuyas"
            />
            <div onClick={() => setShowProfile(true)}>
              <SettingsItem
                icon={<User size={20} />}
                label="Cambiar contraseña"
              />
            </div>
          </div>
        </div>

        {/* Cuenta y Datos */}
        <div className="settings-section">
          <div className="settings-section-title">Cuenta y datos</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={handleExportData} style={{ cursor: 'pointer' }}>
              <SettingsItem
                icon={<Download size={20} />}
                label="Exportar datos"
                desc="Descargar CSV con tus transacciones"
              />
            </div>
            <div onClick={handleDeleteAccount} style={{ cursor: 'pointer' }}>
              <SettingsItem
                icon={<Trash2 size={20} color="var(--danger)" />}
                label="Eliminar cuenta"
                desc="Acción irreversible"
                danger
              />
            </div>
          </div>
        </div>

        {/* Soporte */}
        <div className="settings-section">
          <div className="settings-section-title">Soporte</div>
          <div className="card" style={{ padding: 0 }}>
            <SettingsItem
              icon={<HelpCircle size={20} />}
              label="Centro de ayuda"
            />
            <div onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <SettingsItem
                icon={<LogOut size={20} color="var(--danger)" />}
                label="Cerrar sesión"
                danger
              />
            </div>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '24px 0',
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
        }}>
          wallet.ia v1.0.0 • Made with ❤️
        </div>
      </div>

      {showAccounts && <AccountsSettings onClose={() => setShowAccounts(false)} />}
      {showCategories && <CategoriesSettings onClose={() => setShowCategories(false)} />}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
      {showPartner && <PartnerSettings onClose={() => setShowPartner(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </>
  );
}
