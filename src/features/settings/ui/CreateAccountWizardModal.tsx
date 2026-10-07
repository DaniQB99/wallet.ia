import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Lock, User, Users } from 'lucide-react';
import EmojiPickerModal from '../../../shared/ui/EmojiPickerModal';
import ColorPickerModal from '../../../shared/ui/ColorPickerModal';
import { useLocaleCurrency, type SupportedCurrency } from '../../../app/providers/LocaleCurrencyContext';
import { useCouple } from '../../auth/model/useCouple';
import type { Account } from '../../../shared/types/database';

interface CreateAccountWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountData: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  zIndex?: number;
}

const SUPPORTED_CURRENCIES: { code: SupportedCurrency; name: string; flag: string; symbol: string }[] = [
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  { code: 'MXN', name: 'Peso Mexicano', flag: '🇲🇽', symbol: '$' },
  { code: 'BRL', name: 'Real Brasileiro', flag: '🇧🇷', symbol: 'R$' },
  { code: 'ARS', name: 'Peso Argentino', flag: '🇦🇷', symbol: '$' },
  { code: 'COP', name: 'Peso Colombiano', flag: '🇨🇴', symbol: '$' },
  { code: 'CLP', name: 'Peso Chileno', flag: '🇨🇱', symbol: '$' },
];

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
];

export default function CreateAccountWizardModal({
  isOpen,
  onClose,
  onSave,
  zIndex = 1400,
}: CreateAccountWizardModalProps) {
  const { t, formatMoney, currency: defaultCurrency } = useLocaleCurrency();
  const { couple } = useCouple();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏦');
  const [color, setColor] = useState('#6366F1');
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(defaultCurrency);
  const [balance, setBalance] = useState('0');
  const [scope, setScope] = useState<'personal' | 'shared'>('personal');

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const handleFinish = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const parsedBalance = parseFloat(balance.replace(/,/g, '.')) || 0;
      await onSave({
        name: name.trim(),
        balance: parsedBalance,
        icon,
        color,
        scope,
        currency: selectedCurrency,
        couple_id: scope === 'shared' && couple?.status === 'active' ? couple.id : null,
        position: 0,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex,
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <motion.div
        className="card-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: 'min(92vh, 92dvh, 740px)',
          minHeight: 0,
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 📐 CABECERA ESTANDARIZADA: X a la izquierda arriba, Título al centro a la altura de X, Descripción debajo centrada y responsive */}
        <div style={{ position: 'relative', marginBottom: '12px', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              minHeight: '36px',
            }}
          >
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              disabled={submitting}
              aria-label={t('close')}
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={18} />
            </button>

            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                textAlign: 'center',
                padding: '0 40px',
              }}
            >
              {t('newCardButton')}
            </h2>
          </div>

          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              margin: '6px auto 10px auto',
              textAlign: 'center',
              maxWidth: '380px',
              lineHeight: 1.4,
            }}
          >
            {step === 1
              ? t('wizardStepIdentitySubtitle')
              : step === 2
              ? t('wizardStepCurrencySubtitle')
              : t('wizardStepBalanceSubtitle')}
          </p>

          {/* Indicador de progreso de pasos centrado */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  width: step === s ? '24px' : '8px',
                  height: '6px',
                  borderRadius: '3px',
                  background: step === s ? 'var(--accent-primary)' : step > s ? 'var(--accent-primary)' : 'var(--border)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* 📜 CONTENEDOR DESPLAZABLE (Scroll Vertical Fluido para todos los dispositivos) */}
        <div
          className="modal-scroll-area"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            minHeight: 0,
            paddingRight: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
        >
          {/* 🌟 PREVISUALIZACIÓN DE TARJETA EN TIEMPO REAL (Liquid Glass) */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--text-tertiary)',
                marginBottom: '6px',
                textAlign: 'center',
              }}
            >
              {t('cardPreviewUpper')}
            </div>

          <motion.div
            layout
            style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(115px, 16vh, 130px)',
              borderRadius: '20px',
              padding: '12px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              background: `linear-gradient(135deg, ${color} 0%, #0b0f19 100%)`,
            }}
          >
            {/* Brillo glassmorphism */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Fila superior de la tarjeta: Icono + Nombre + Badge de Divisa */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icon}</span>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    textShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    maxWidth: '220px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name.trim() || t('accountName')}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                <Lock size={10} />
                <span>{selectedCurrency}</span>
              </div>
            </div>

            {/* Fila inferior de la tarjeta: Saldo formateado + Ámbito */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 1 }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('available')}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                  {formatMoney(parseFloat(balance.replace(/,/g, '.')) || 0, undefined, selectedCurrency)}
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '14px',
                  background: 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(6px)',
                  fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 600,
                }}
              >
                {scope === 'shared' ? <Users size={12} style={{ color: '#a5b4fc' }} /> : <User size={12} style={{ color: '#86efac' }} />}
                <span>{scope === 'shared' ? t('sharedLabel') : t('personalLabel')}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 📋 CONTENIDO DEL PASO ACTUAL CON ANIMACIONES FLUIDAS */}
        <AnimatePresence mode="wait">
          {/* PASO 1: Identidad visual */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ marginBottom: '2px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {t('wizardStepIdentityTitle')}
                </h3>
              </div>

              {/* Nombre de la cuenta */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block' }}>
                  {t('accountName')}
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Revolut, BBVA, Efectivo..."
                  className="form-input"
                  style={{ width: '100%', height: '46px', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 600 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                />
              </div>

              {/* Icono y Color */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                    {t('icon')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(true)}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      fontSize: '1.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {icon}
                  </button>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block' }}>
                    {t('color')}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: c,
                          border: color === c ? '2px solid var(--text-primary)' : '2px solid var(--border)',
                          cursor: 'pointer',
                          boxShadow: color === c ? `0 0 10px ${c}` : 'none',
                          transform: color === c ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                          padding: 0,
                        }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(true)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f43f5e, #8b5cf6, #06b6d4)',
                        border: '2px solid var(--border)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      title="Color personalizado"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PASO 2: Divisa nativa de la cuenta */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div style={{ marginBottom: '2px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {t('wizardStepCurrencyTitle')}
                </h3>
              </div>

              {/* Grid visual de divisas estilo Chips Liquid Glass */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  maxHeight: '190px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {SUPPORTED_CURRENCIES.map((curr) => {
                  const isSelected = selectedCurrency === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setSelectedCurrency(curr.code)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '10px 8px',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--accent-primary-glow)' : 'var(--bg-tertiary)',
                        boxShadow: isSelected ? '0 4px 14px var(--accent-primary-glow)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>{curr.flag}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {curr.code}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {curr.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Banner informativo de inmutabilidad */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  fontSize: '0.74rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <Lock size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <span>{t('wizardCurrencyImmutableNotice')}</span>
              </div>
            </motion.div>
          )}

          {/* PASO 3: Saldo inicial y Alcance */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ marginBottom: '2px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {t('wizardStepBalanceTitle')}
                </h3>
              </div>

              {/* Saldo inicial */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block' }}>
                  {t('currentBalance')}
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    required
                    value={balance}
                    onChange={(e) => {
                      const val = e.target.value.replace(/,/g, '.');
                      if (/^-?\d*\.?\d*$/.test(val) || val === '') {
                        setBalance(val);
                      }
                    }}
                    className="form-input"
                    style={{
                      width: '100%',
                      height: '48px',
                      paddingLeft: '56px',
                      paddingRight: '16px',
                      textAlign: 'right',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      borderRadius: '14px',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      left: '16px',
                      color: 'var(--accent-primary)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                    }}
                  >
                    {selectedCurrency}
                  </span>
                </div>
              </div>

              {/* Ámbito: Personal o Compartida */}
              {couple?.status === 'active' && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block' }}>
                    {t('accountType')}
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      background: 'var(--bg-tertiary)',
                      padding: '4px',
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setScope('personal')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: scope === 'personal' ? 'var(--accent-primary)' : 'transparent',
                        color: scope === 'personal' ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      <User size={14} />
                      <span>{t('personalLabel')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope('shared')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: scope === 'shared' ? 'var(--accent-primary)' : 'transparent',
                        color: scope === 'shared' ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      <Users size={14} />
                      <span>{t('sharedLabel')}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* 🔘 BOTONES DE NAVEGACIÓN Y ACCIÓN (Fijos en la parte inferior) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
              disabled={submitting}
              style={{
                flex: 1,
                height: '46px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} />
              <span>{t('back')}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1,
                height: '46px',
                borderRadius: '14px',
                fontWeight: 600,
              }}
            >
              {t('cancel')}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!name.trim()}
              style={{
                flex: 2,
                height: '46px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 700,
              }}
            >
              <span>{t('nextStep')}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFinish}
              disabled={submitting || !name.trim()}
              style={{
                flex: 2,
                height: '46px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 700,
              }}
            >
              <Check size={18} />
              <span>{submitting ? t('saving') : t('createCardFinish')}</span>
            </button>
          )}
        </div>

        {/* Modales auxiliares de Icono y Color */}
        <EmojiPickerModal
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelect={(emoji) => setIcon(emoji)}
          currentEmoji={icon}
        />
        <ColorPickerModal
          isOpen={showColorPicker}
          onClose={() => setShowColorPicker(false)}
          onSelect={(newColor) => setColor(newColor)}
          initialColor={color}
          zIndex={zIndex + 100}
        />
      </motion.div>
    </div>
  );
}
