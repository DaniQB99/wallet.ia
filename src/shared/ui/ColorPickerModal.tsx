import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ColorPicker, useColor, ColorService } from 'react-color-palette';
import 'react-color-palette/dist/css/rcp.css';
import { X, Check } from 'lucide-react';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hexColor: string) => void;
  initialColor?: string;
  title?: string;
  zIndex?: number;
}

const POPULAR_SWATCHES = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#64748B', // Slate
  '#FFFFFF', // White
];

/**
 * ColorPickerModal
 * Selector de colores avanzado con escala gradiente deslizable (react-color-palette)
 * y confirmación por botón, renderizado mediante Portal en document.body.
 */
export default function ColorPickerModal({
  isOpen,
  onClose,
  onSelect,
  initialColor = '#6366F1',
  title,
  zIndex = 1500,
}: ColorPickerModalProps) {
  const { t } = useLocaleCurrency();
  // Validar formato hex inicial
  const safeInitial = initialColor?.startsWith('#') ? initialColor : '#6366F1';
  const [color, setColor] = useColor(safeInitial);
  const [activeHex, setActiveHex] = useState(safeInitial);

  // Sincronizar si cambia initialColor
  React.useEffect(() => {
    if (isOpen) {
      const hex = initialColor?.startsWith('#') ? initialColor : '#6366F1';
      setActiveHex(hex);
      try {
        setColor(ColorService.convert('hex', hex));
      } catch {
        // fallback
      }
    }
  }, [isOpen, initialColor]);

  const handleConfirm = () => {
    onSelect(color.hex);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Backdrop oscuro con desenfoque suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />

        {/* Modal Liquid Glass */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            maxHeight: 'min(90vh, 90dvh, 600px)',
            minHeight: 0,
            margin: 'auto',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            borderRadius: '26px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Cabecera */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px 12px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {title || t('color') || 'Color'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Cuerpo: react-color-palette & Previsualización */}
          <div style={{ padding: '16px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Visualización previa y código HEX */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: color.hex,
                    border: '2px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: `0 2px 10px ${color.hex}60`,
                    transition: 'all 0.15s ease',
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  HEX
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'var(--text-primary)',
                }}
              >
                {color.hex.toUpperCase()}
              </span>
            </div>

            {/* Selector de color deslizable react-color-palette */}
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'var(--bg-input)',
                padding: '8px',
                border: '1px solid var(--border)',
                ['--rcp-background-color' as any]: 'transparent',
              }}
            >
              <ColorPicker
                height={150}
                color={color}
                onChange={(c) => {
                  setColor(c);
                  setActiveHex(c.hex);
                }}
                hideAlpha
                hideInput={['rgb', 'hsv']}
              />
            </div>

            {/* Muestras rápidas populares */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {POPULAR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => {
                    setActiveHex(swatch);
                    try {
                      setColor(ColorService.convert('hex', swatch));
                    } catch {
                      setColor((prev) => ({ ...prev, hex: swatch }));
                    }
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: swatch,
                    border: activeHex.toLowerCase() === swatch.toLowerCase() ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transform: activeHex.toLowerCase() === swatch.toLowerCase() ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                    padding: 0,
                  }}
                  aria-label={swatch}
                />
              ))}
            </div>

            {/* Botón de Confirmación Aceptar */}
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '14px',
                background: 'var(--accent-primary, #6366f1)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px var(--accent-primary-glow, rgba(99, 102, 241, 0.35))',
                transition: 'transform 0.15s ease, opacity 0.15s ease',
                marginTop: '4px',
              }}
            >
              <Check size={18} strokeWidth={2.5} />
              <span>{t('accept') || 'Aceptar'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
