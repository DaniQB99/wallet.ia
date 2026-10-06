import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart,
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
  Lock,
  X,
  Cookie,
} from 'lucide-react';
import { useAuthContext } from '../app/providers/AuthContext';
import { useAppearance } from '../app/providers/AppearanceContext';
import { useLocaleCurrency, type SupportedCurrency, type SupportedLocale } from '../app/providers/LocaleCurrencyContext';
import { Wallet, Tag } from 'lucide-react';
import { openCookieSettings } from '../shared/lib/cookieConsent';
import AccountsSettings from '../features/settings/ui/AccountsSettings';
import CategoriesSettings from '../features/settings/ui/CategoriesSettings';
import ProfileSettings from '../features/settings/ui/ProfileSettings';
import PartnerSettings from '../features/settings/ui/PartnerSettings';
import DoubleConfirmModal from '../shared/ui/DoubleConfirmModal';
import DataPrivacyModal from '../features/settings/ui/DataPrivacyModal';
import ChangePasswordModal from '../features/settings/ui/ChangePasswordModal';
import InstallAppModal from '../features/settings/ui/InstallAppModal';
import LegalDocumentModal from '../shared/ui/LegalDocumentModal';
import privacyPolicyText from '../../docs/privacy-policy.es.md?raw';
import termsOfUseText from '../../docs/terms-of-use.es.md?raw';
import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../shared/api/supabase';
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

/**
 * Vista del panel de Ajustes Globales y Configuración de la PWA.
 * Centraliza el núcleo de la experiencia y personalización del usuario abarcando áreas clave:
 * Gestión de Perfil, Cuentas, Categorías, Modo de Finanzas en Pareja, Apariencia UI/Temática, Localización (Idiomas y Divisas),
 * Permisos y Gestión de Notificaciones, Seguridad Legal, y Exportación o Eliminación de Datos.
 */
export default function Settings() {
  const { user, signOut } = useAuthContext();
  const { theme, resolvedTheme, setTheme, accentColor, setAccentColor } = useAppearance();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { locale, setLocale, currency, setCurrency, t } = useLocaleCurrency();
  const [showAccounts, setShowAccounts] = useState(false);
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const legalDoc = searchParams.get('legal');
  const closeLegal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('legal');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (searchParams.get('tab') === 'Casal') {
      setShowPartner(true);
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);


  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string }[] = [
    { value: 'light', label: t('light') },
    { value: 'dark', label: t('dark') },
    { value: 'system', label: t('system') },
  ];

  const cycleAccentColor = () => {
    const colors: ('indigo' | 'emerald' | 'rose' | 'amber')[] = ['indigo', 'emerald', 'rose', 'amber'];
    const currentIndex = colors.indexOf(accentColor);
    setAccentColor(colors[(currentIndex + 1) % colors.length]);
  };

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [pendingCurrencyChange, setPendingCurrencyChange] = useState<SupportedCurrency | null>(null);

  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      return null;
    }
  }, [locale]);

  const currencyNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: 'currency' });
    } catch {
      return null;
    }
  }, [locale]);

  const localeOptions: { value: SupportedLocale; regionCode: string; flag: string; native: string }[] = [
    { value: 'es-ES', regionCode: 'ES', flag: '🇪🇸', native: 'Español' },
    { value: 'en-US', regionCode: 'US', flag: '🇺🇸', native: 'English' },
    { value: 'fr-FR', regionCode: 'FR', flag: '🇫🇷', native: 'Français' },
    { value: 'de-DE', regionCode: 'DE', flag: '🇩🇪', native: 'Deutsch' },
    { value: 'it-IT', regionCode: 'IT', flag: '🇮🇹', native: 'Italiano' },
    { value: 'pt-PT', regionCode: 'PT', flag: '🇵🇹', native: 'Português' },
  ];

  const currencyOptions: { value: SupportedCurrency; flag: string; regionCode: string; symbol: string }[] = [
    { value: 'EUR', flag: '🇪🇺', regionCode: 'EU', symbol: '€' },
    { value: 'USD', flag: '🇺🇸', regionCode: 'US', symbol: '$' },
    { value: 'GBP', flag: '🇬🇧', regionCode: 'GB', symbol: '£' },
    { value: 'JPY', flag: '🇯🇵', regionCode: 'JP', symbol: '¥' },
    { value: 'MXN', flag: '🇲🇽', regionCode: 'MX', symbol: '$' },
    { value: 'BRL', flag: '🇧🇷', regionCode: 'BR', symbol: 'R$' },
    { value: 'ARS', flag: '🇦🇷', regionCode: 'AR', symbol: '$' },
    { value: 'COP', flag: '🇨🇴', regionCode: 'CO', symbol: '$' },
    { value: 'CLP', flag: '🇨🇱', regionCode: 'CL', symbol: '$' },
  ];

  // Prompt de instalación PWA
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: unknown) => {
      (e as any).preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
  }, []);

  const handleChangeCurrency = (newCurrency: SupportedCurrency) => {
    if (newCurrency === currency) {
      setShowCurrencyPicker(false);
      return;
    }
    setPendingCurrencyChange(newCurrency);
  };

  const confirmCurrencyChange = async () => {
    if (!pendingCurrencyChange) return;
    const newCurrency = pendingCurrencyChange;
    setIsConvertingCurrency(true);
    try {
      // Fetch exchange rate from current to new
      let rate = 1;
      if (currency !== newCurrency) {
        const res = await fetch(`https://api.frankfurter.dev/v1/latest?from=${currency}&to=${newCurrency}`);
        if (!res.ok) throw new Error(t('networkErrorExchangeRate'));
        const data = await res.json();
        rate = Number(data?.rates?.[newCurrency]);

        if (!Number.isFinite(rate) || rate <= 0) {
          throw new Error(t('invalidExchangeRate'));
        }
      }

      const { error } = await supabase.rpc('convert_user_currency', {
        p_user_id: user!.id,
        p_exchange_rate: rate,
        p_new_currency: newCurrency
      });

      if (error) throw error;

      setCurrency(newCurrency);
      setShowCurrencyPicker(false);
    } catch (err: unknown) {
      console.error('Error al cambiar la divisa:', err);
      alert(t('errorChangingCurrency') + (err as Error).message);
    } finally {
      setIsConvertingCurrency(false);
      setPendingCurrencyChange(null);
    }
  };

  // Gestión de Datos
  const handleExportData = async () => {
    try {
      const { data, error } = await supabase.rpc('export_user_data');
      if (error) throw error;
      if (!data) {
        alert(t('noDataToExport'));
        return;
      }

      // Convert JSON to Blob
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `wallet_ia_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: unknown) {
      console.error('Error al exportar datos:', error);
      alert(t('errorExportingData') + (error as Error).message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      alert(t('accountDeletedSuccess'));
      await handleLogout();
    } catch (err: unknown) {
      alert(t('errorProcessingRequest') + (err as Error).message);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('navSettings')} - Wallet.ia</title>
        <meta name="description" content={t('settingsMetaDesc')} />
      </Helmet>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{t('settings')}</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('configureExperience')}</p>
        </div>
      </div>

      <div className="page-content" style={{ width: '100%' }}>
        {/* Profile */}
        <div className="card animate-in" style={{ marginBottom: '24px', background: 'rgba(30, 30, 30, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="avatar avatar-lg" style={{ overflow: 'hidden' }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.display_name?.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {user?.display_name || t('user')}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {user?.email || ''}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowProfile(true)}>{t('edit')}</button>
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
                label={t('categories')}
                desc={t('categoriesManagement')}
              />
            </div>
          </div>
        </div>

        {/* Pareja */}
        <div className="settings-section">
          <div className="settings-section-title">{t('couple')}</div>
          <div className="card" style={{ padding: 0 }} id="settings-partner-card">
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
              desc={theme === 'system' 
                ? (resolvedTheme === 'dark' ? t('appearanceModeSystemDark') : t('appearanceModeSystemLight')) 
                : (theme === 'dark' ? t('appearanceModeDark') : t('appearanceModeLight'))}
              action={
                <div className="settings-theme-segmented" onClick={(e) => e.stopPropagation()}>
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={theme === option.value ? 'active' : ''}
                      onClick={() => setTheme(option.value)}
                      title={option.label}
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {option.value === 'light' && <Sun size={18} />}
                      {option.value === 'dark' && <Moon size={18} />}
                      {option.value === 'system' && <Monitor size={18} />}
                    </button>
                  ))}
                </div>
              }
            />

            <div onClick={cycleAccentColor}>
              <SettingsItem
                icon={<Palette size={20} />}
                label={t('accentColor')}
                desc={
                  accentColor === 'indigo' ? t('colorIndigo') :
                    accentColor === 'emerald' ? t('colorEmerald') :
                      accentColor === 'rose' ? t('colorRose') : t('colorAmber')
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
                desc={`${currencyOptions.find(c => c.value === currency)?.flag} ${currencyNames?.of(currency) || currency} (${currencyOptions.find(c => c.value === currency)?.symbol} ${currency})`}
              />
            </div>
          </div>
        </div>

        {/* Aplicación / Instalación */}
        <div className="settings-section">
          <div className="settings-section-title">{t('appSection')}</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={() => setShowInstallModal(true)} style={{ cursor: 'pointer' }}>
              <SettingsItem
                icon={<Smartphone size={20} />}
                label={t('installAsApp')}
                desc={deferredPrompt ? t('available') : t('installAsAppDesc')}
              />
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className="settings-section">
          <div className="settings-section-title">{t('securityPrivacy')}</div>
          <div className="card" style={{ padding: 0 }}>
            <div onClick={() => setShowPrivacy(true)}>
              <SettingsItem
                icon={<Shield size={20} />}
                label={t('dataPrivacy')}
                desc={t('personalBalance')}
              />
            </div>
            <div onClick={() => openCookieSettings()}>
              <SettingsItem
                icon={<Cookie size={20} />}
                label={t('cookiePreferencesTitle')}
                desc={t('cookieSettings')}
              />
            </div>
            <div onClick={() => navigate('/settings?legal=privacy')}>
              <SettingsItem
                icon={<Shield size={20} />}
                label={t('privacyPolicy')}
                desc={t('rgpdLssi')}
              />
            </div>
            <div onClick={() => navigate('/settings?legal=terms')}>
              <SettingsItem
                icon={<HelpCircle size={20} />}
                label={t('termsOfUse')}
                desc={t('termsConditions')}
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
            <div onClick={() => setShowPassword(true)} style={{ cursor: 'pointer' }}>
              <SettingsItem
                icon={<Lock size={20} />}
                label={t('changePassword')}
              />
            </div>
            <div onClick={() => setDeleteConfirmOpen(true)} style={{ cursor: 'pointer' }}>
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
            <div onClick={() => window.dispatchEvent(new Event('show-onboarding'))} style={{ cursor: 'pointer' }}>
              <SettingsItem
                icon={<HelpCircle size={20} />}
                label={t('helpCenter')}
              />
            </div>
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

      <DataPrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

      <ChangePasswordModal isOpen={showPassword} onClose={() => setShowPassword(false)} />

      <DoubleConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        titleStep1={t('deleteAccountConfirmStep1Title')}
        descStep1={t('deleteAccountConfirmStep1Desc')}
        titleStep2={t('deleteAccountConfirmStep2Title')}
        descStep2={t('deleteAccountConfirmStep2Desc')}
      />

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setDeferredPrompt(null)}
      />
      {legalDoc === 'privacy' && (
        <LegalDocumentModal
          title={t('privacyPolicy')}
          content={privacyPolicyText}
          onClose={closeLegal}
        />
      )}
      {legalDoc === 'terms' && (
        <LegalDocumentModal
          title={t('termsOfUse')}
          content={termsOfUseText}
          onClose={closeLegal}
        />
      )}

      {/* ─── Language Picker Modal ─── */}
      {showLanguagePicker && (
        <div className="modal-overlay" onClick={() => setShowLanguagePicker(false)}>
          <div className="modal animate-in" style={{ maxWidth: '420px', padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowLanguagePicker(false)}
                style={{ left: '20px' }}
                aria-label={t('close')}
              >
                <X size={20} />
              </button>
              <h2 className="modal-title">{t('language')}</h2>
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
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{regionNames?.of(item.regionCode) || item.value}</div>
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
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCurrencyPicker(false)}
                style={{ left: '20px' }}
                aria-label={t('close')}
              >
                <X size={20} />
              </button>
              <h2 className="modal-title">{t('currency')}</h2>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {currencyOptions.map(item => (
                <div
                  key={item.value}
                  onClick={() => handleChangeCurrency(item.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                    cursor: 'pointer', borderBottom: '1px solid var(--border)',
                    background: currency === item.value ? 'rgba(var(--accent-primary-rgb, 99, 102, 241), 0.06)' : 'transparent',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>{item.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.regionCode && regionNames ? regionNames.of(item.regionCode) : item.value}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{(currencyNames?.of(item.value) || item.value)} ({item.symbol} {item.value})</div>
                  </div>
                  {currency === item.value && (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {isConvertingCurrency && (
              <div style={{ padding: '12px 20px', fontSize: '0.85rem', color: 'var(--accent-primary)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                {t('convertingDataMessage')}
              </div>
            )}
          </div>
        </div>
      )}

      <DoubleConfirmModal
        isOpen={!!pendingCurrencyChange}
        onClose={() => setPendingCurrencyChange(null)}
        onConfirm={confirmCurrencyChange}
        titleStep1={t('changeCurrencyStep1Title')}
        descStep1={t('changeCurrencyStep1Desc').replace('{old}', currency || '').replace('{new}', pendingCurrencyChange || '')}
        titleStep2={t('changeCurrencyStep2Title')}
        descStep2={t('changeCurrencyStep2Desc')}
        loading={isConvertingCurrency}
      />
    </>
  );
}
