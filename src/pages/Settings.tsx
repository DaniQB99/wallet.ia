import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Monitor,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useAppearance } from '../contexts/AppearanceContext';
import { useLocaleCurrency, type SupportedCurrency, type SupportedLocale } from '../contexts/LocaleCurrencyContext';
import { Wallet, Tag } from 'lucide-react';
import AccountsSettings from '../components/AccountsSettings';
import CategoriesSettings from '../components/CategoriesSettings';
import ProfileSettings from '../components/ProfileSettings';
import PartnerSettings from '../components/PartnerSettings';
import NotificationsModal from '../components/NotificationsModal';
import LegalDocumentModal from '../components/LegalDocumentModal';
import privacyPolicyText from '../../docs/privacy-policy.es.md?raw';
import termsOfUseText from '../../docs/terms-of-use.es.md?raw';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Trash2 } from 'lucide-react';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  desc?: React.ReactNode;
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
  const { theme, resolvedTheme, setTheme, accentColor, setAccentColor } = useAppearance();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { locale, setLocale, currency, setCurrency, loadingRates, t } = useLocaleCurrency();
  const [showAccounts, setShowAccounts] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const legalDoc = searchParams.get('legal');
  const closeLegal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('legal');
    setSearchParams(next, { replace: true });
  };


  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string }[] = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'system', label: 'Automático' },
  ];

  const cycleAccentColor = () => {
    const colors: ('indigo' | 'emerald' | 'rose' | 'amber')[] = ['indigo', 'emerald', 'rose', 'amber'];
    const currentIndex = colors.indexOf(accentColor);
    setAccentColor(colors[(currentIndex + 1) % colors.length]);
  };

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const localeOptions: { value: SupportedLocale; label: string; flag: string; native: string }[] = [
    { value: 'es-ES', label: 'España', flag: '🇪🇸', native: 'Español' },
    { value: 'en-US', label: 'United States', flag: '🇺🇸', native: 'English' },
    { value: 'fr-FR', label: 'France', flag: '🇫🇷', native: 'Français' },
    { value: 'de-DE', label: 'Deutschland', flag: '🇩🇪', native: 'Deutsch' },
    { value: 'it-IT', label: 'Italia', flag: '🇮🇹', native: 'Italiano' },
    { value: 'pt-PT', label: 'Portugal', flag: '🇵🇹', native: 'Português' },
  ];

  const currencyOptions: { value: SupportedCurrency; flag: string; country: string; name: string; symbol: string }[] = [
    { value: 'EUR', flag: '🇪🇺', country: 'Europa', name: 'Euro', symbol: '€' },
    { value: 'USD', flag: '🇺🇸', country: 'Estados Unidos', name: 'Dólar Estadounidense', symbol: '$' },
    { value: 'GBP', flag: '🇬🇧', country: 'Reino Unido', name: 'Libra Esterlina', symbol: '£' },
    { value: 'JPY', flag: '🇯🇵', country: 'Japón', name: 'Yen Japonés', symbol: '¥' },
    { value: 'MXN', flag: '🇲🇽', country: 'México', name: 'Peso Mexicano', symbol: '$' },
    { value: 'BRL', flag: '🇧🇷', country: 'Brasil', name: 'Real Brasileño', symbol: 'R$' },
    { value: 'ARS', flag: '🇦🇷', country: 'Argentina', name: 'Peso Argentino', symbol: '$' },
    { value: 'COP', flag: '🇨🇴', country: 'Colombia', name: 'Peso Colombiano', symbol: '$' },
    { value: 'CLP', flag: '🇨🇱', country: 'Chile', name: 'Peso Chileno', symbol: '$' },
  ];

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
          <h1>{t('settings')}</h1>
          <p>{t('configureExperience')}</p>
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
          <div className="settings-section-title">{t('dataManagement')}</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={() => setShowAccounts(true)}>
              <SettingsItem
                icon={<Wallet size={20} color="var(--accent-primary)" />}
                label={t('accountsAndCards')}
                desc={t('manageMovements')}
              />
            </div>
            <div onClick={() => setShowCategories(true)}>
              <SettingsItem
                icon={<Tag size={20} color="var(--accent-primary)" />}
                label={`${t('category')}s`}
                desc={t('categoriesManagement')}
              />
            </div>
          </div>
        </div>

        {/* Pareja */}
        <div className="settings-section">
          <div className="settings-section-title">{t('couple')}</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={() => setShowPartner(true)}>
              <SettingsItem
                icon={<Heart size={20} color="#EC4899" />}
                label={t('partnerStatus')}
                desc={t('invitePartnerDesc')}
              />
            </div>
          </div>
        </div>

        {/* Apariencia */}
        <div className="settings-section">
          <div className="settings-section-title">{t('appearance')}</div>
          <div className="card" style={{ padding: 0 }}>
            <SettingsItem
              icon={theme === 'system' ? <Monitor size={20} /> : resolvedTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                label={t('appearance')}
              desc={theme === 'system' ? `Automático (${resolvedTheme === 'dark' ? 'oscuro' : 'claro'})` : `Modo ${theme === 'dark' ? 'oscuro' : 'claro'}`}
              action={
                <div className="settings-theme-segmented" onClick={(e) => e.stopPropagation()}>
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={theme === option.value ? 'active' : ''}
                      onClick={() => setTheme(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              }
            />

            <div onClick={cycleAccentColor}>
              <SettingsItem
                icon={<Palette size={20} />}
                label={`${t('color')} de acento`}
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

            <div onClick={() => setShowLanguagePicker(true)}>
              <SettingsItem
                icon={<Globe size={20} />}
                label={t('language')}
                desc={`${localeOptions.find(l => l.value === locale)?.flag} ${localeOptions.find(l => l.value === locale)?.native}`}
              />
            </div>

            <div onClick={() => setShowCurrencyPicker(true)}>
              <SettingsItem
                icon={<Wallet size={20} />}
                label={t('currency')}
                desc={`${currencyOptions.find(c => c.value === currency)?.flag} ${currencyOptions.find(c => c.value === currency)?.name} (${currencyOptions.find(c => c.value === currency)?.symbol} ${currency})`}
              />
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="settings-section">
          <div className="settings-section-title">{t('notificationsApp')}</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={() => setShowNotifications(true)}>
              <SettingsItem
                icon={<Bell size={20} />}
                label={t('inbox')}
                desc={t('notificationsDesc')}
              />
            </div>
            <div onClick={requestNotifications}>
              <SettingsItem
                icon={<Smartphone size={20} />}
                label={`${t('notificationsApp')} push`}
                desc={typeof Notification !== 'undefined' && Notification.permission === 'granted' ? t('activated') : t('tapToEnable')}
              />
            </div>
            <div onClick={handleInstallClick}>
              <SettingsItem
                icon={<Smartphone size={20} />}
                label={t('installAsApp')}
                desc={deferredPrompt ? t('available') : t('configured')}
              />
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className="settings-section">
          <div className="settings-section-title">{t('securityPrivacy')}</div>
          <div className="card" style={{ padding: 0 }}>
            <SettingsItem
              icon={<Shield size={20} />}
              label={t('dataPrivacy')}
              desc={t('personalBalance')}
            />
            <div onClick={() => navigate('/settings?legal=privacy')}>
              <SettingsItem
                icon={<Shield size={20} />}
                label="Política de privacidad"
                desc="RGPD + LSSI"
              />
            </div>
            <div onClick={() => navigate('/settings?legal=terms')}>
              <SettingsItem
                icon={<HelpCircle size={20} />}
                label="Términos de uso"
                desc="Condiciones y uso permitido"
              />
            </div>
            <div onClick={() => setShowProfile(true)}>
              <SettingsItem
                icon={<User size={20} />}
                label={t('changePassword')}
              />
            </div>
          </div>
        </div>

        {/* Cuenta y Datos */}
        <div className="settings-section">
          <div className="settings-section-title">{t('accountData')}</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={handleExportData} style={{ cursor: 'pointer' }}>
              <SettingsItem
                icon={<Download size={20} />}
                label={t('exportData')}
                desc={t('downloadCsv')}
              />
            </div>
            <div onClick={handleDeleteAccount} style={{ cursor: 'pointer' }}>
              <SettingsItem
                icon={<Trash2 size={20} color="var(--danger)" />}
                label={t('deleteAccountAction')}
                desc={t('irreversibleAction')}
                danger
              />
            </div>
          </div>
        </div>

        {/* Soporte */}
        <div className="settings-section">
          <div className="settings-section-title">{t('support')}</div>
          <div className="card" style={{ padding: 0 }}>
            <SettingsItem
              icon={<HelpCircle size={20} />}
              label={t('helpCenter')}
            />
            <div onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <SettingsItem
                icon={<LogOut size={20} color="var(--danger)" />}
                label={t('signOut')}
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
      {legalDoc === 'privacy' && (
        <LegalDocumentModal
          title="Política de Privacidad"
          content={privacyPolicyText}
          onClose={closeLegal}
        />
      )}
      {legalDoc === 'terms' && (
        <LegalDocumentModal
          title="Términos de Uso"
          content={termsOfUseText}
          onClose={closeLegal}
        />
      )}

      {/* ─── Language Picker Modal ─── */}
      {showLanguagePicker && (
        <div className="modal-overlay" onClick={() => setShowLanguagePicker(false)}>
          <div className="modal animate-in" style={{ maxWidth: '420px', padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => setShowLanguagePicker(false)} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '12px', fontSize: '0.9rem' }}>← {t('close')}</button>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, flex: 1, textAlign: 'center', paddingRight: '40px' }}>{t('language')}</h3>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {localeOptions.map(item => (
                <div
                  key={item.value}
                  onClick={() => { setLocale(item.value); setShowLanguagePicker(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                    cursor: 'pointer', borderBottom: '1px solid var(--border)',
                    background: locale === item.value ? 'rgba(var(--accent-primary-rgb, 99, 102, 241), 0.06)' : 'transparent',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>{item.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.native}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{item.label}</div>
                  </div>
                  {locale === item.value && (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Currency Picker Modal ─── */}
      {showCurrencyPicker && (
        <div className="modal-overlay" onClick={() => setShowCurrencyPicker(false)}>
          <div className="modal animate-in" style={{ maxWidth: '420px', padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => setShowCurrencyPicker(false)} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '12px', fontSize: '0.9rem' }}>← {t('close')}</button>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, flex: 1, textAlign: 'center', paddingRight: '40px' }}>{t('currency')}</h3>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {currencyOptions.map(item => (
                <div
                  key={item.value}
                  onClick={() => { setCurrency(item.value); setShowCurrencyPicker(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                    cursor: 'pointer', borderBottom: '1px solid var(--border)',
                    background: currency === item.value ? 'rgba(var(--accent-primary-rgb, 99, 102, 241), 0.06)' : 'transparent',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>{item.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.country}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{item.name} ({item.symbol} {item.value})</div>
                  </div>
                  {currency === item.value && (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {loadingRates && (
              <div style={{ padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                {loadingRates ? 'Actualizando tasas de cambio...' : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
