import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart } from 'lucide-react';
import { useLocaleCurrency } from '../../../app/providers/LocaleCurrencyContext';

export interface CategorySlice {
  id: string;
  name: string;
  total: number;
  color: string;
  icon: string;
  movements: number;
}

interface ModernDonutChartProps {
  categories: CategorySlice[];
  total: number;
  viewType: 'expense' | 'income';
  onCategoryClick: (categoryId: string) => void;
  activeCategoryId?: string | null;
  onHoverCategory?: (categoryId: string | null) => void;
  loading?: boolean;
}

export const ModernDonutChart: React.FC<ModernDonutChartProps> = ({
  categories,
  total,
  viewType,
  onCategoryClick,
  activeCategoryId,
  onHoverCategory,
  loading = false,
}) => {
  const { t, formatMoney, translateEntityName } = useLocaleCurrency();
  const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);

  // Active category is either externally selected/hovered or internally hovered
  const currentActiveId = activeCategoryId !== undefined ? activeCategoryId : internalHoveredId;

  // Geometry configuration
  const radius = 82;
  const strokeWidthBase = 16;
  const strokeWidthActive = 22;
  const circumference = 2 * Math.PI * radius; // ~515.22 px
  const center = 110;

  // Sort categories descending by amount for clean visual balance
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => b.total - a.total);
  }, [categories]);

  // Slices with mathematically guaranteed perimeter spacing (Zero overlap)
  const segments = useMemo(() => {
    if (total <= 0 || sortedCategories.length === 0) return [];

    const numCategories = sortedCategories.length;

    // Single category: clean 100% full ring
    if (numCategories === 1) {
      const cat = sortedCategories[0];
      return [
        {
          ...cat,
          length: circumference,
          offset: 0,
          percentage: 100,
          isFullCircle: true,
        },
      ];
    }

    // Modern dynamic gap along the circle perimeter (4px to 6px)
    const gap = numCategories > 8 ? 3.5 : numCategories > 5 ? 5 : 6;
    const totalGap = numCategories * gap;
    const availableCircumference = Math.max(0, circumference - totalGap);

    // Ensure even tiny percentages have a minimal clickable pill length (min 8px)
    const minLength = 8;
    const rawLengths = sortedCategories.map((c) => (c.total / total) * availableCircumference);

    let reservedForMin = 0;
    let flexibleTotalWeight = 0;

    rawLengths.forEach((l) => {
      if (l < minLength) {
        reservedForMin += minLength;
      } else {
        flexibleTotalWeight += l;
      }
    });

    const remainingAvailable = Math.max(0, availableCircumference - reservedForMin);
    const finalLengths = rawLengths.map((l) => {
      if (l < minLength) return minLength;
      return flexibleTotalWeight > 0 ? (l / flexibleTotalWeight) * remainingAvailable : l;
    });

    let accumulatedOffset = 0;
    return sortedCategories.map((cat, idx) => {
      const length = finalLengths[idx];
      const offset = accumulatedOffset;
      accumulatedOffset += length + gap;
      const percentage = (cat.total / total) * 100;

      return {
        ...cat,
        length,
        offset,
        percentage,
        isFullCircle: false,
      };
    });
  }, [sortedCategories, total, circumference]);

  // Currently focused slice data for the donut center
  const activeSlice = useMemo(() => {
    if (!currentActiveId) return null;
    return segments.find((s) => s.id === currentActiveId) || null;
  }, [currentActiveId, segments]);

  // Dominant color for the subtle ambient aura glow behind the chart
  const dominantColor = activeSlice?.color || segments[0]?.color || (viewType === 'expense' ? '#ef4444' : '#10b981');

  const handleSliceMouseEnter = (id: string) => {
    setInternalHoveredId(id);
    onHoverCategory?.(id);
  };

  const handleSliceMouseLeave = () => {
    setInternalHoveredId(null);
    onHoverCategory?.(null);
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '24px',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(130% 130% at 50% 10%, rgba(32, 28, 48, 0.65) 0%, rgba(15, 13, 22, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        minHeight: '260px',
      }}
    >
      {/* Luz ambiental sutil interactiva de fondo */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${dominantColor}18 0%, transparent 70%)`,
          filter: 'blur(20px)',
          pointerEvents: 'none',
          transition: 'background 0.4s ease',
        }}
      />

      {loading ? (
        <div className="loading-text" style={{ padding: '60px 0', zIndex: 1 }}>
          {t('loadingModule')}
        </div>
      ) : segments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', zIndex: 1 }}>
          <PieChart size={48} style={{ opacity: 0.25, marginBottom: '12px' }} />
          <div style={{ fontSize: '0.85rem' }}>{t('noDataForPeriod')}</div>
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            width: '220px',
            height: '220px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <svg
            viewBox="0 0 220 220"
            width="220"
            height="220"
            style={{ overflow: 'visible', transform: 'rotate(-90deg)' }}
          >
            {/* Pista circular sutil de guía de fondo */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth={strokeWidthBase}
            />

            {/* Segmentos de la gráfica Donut */}
            {segments.map((seg) => {
              const isSelected = currentActiveId === seg.id;
              const hasActiveOther = currentActiveId !== null && !isSelected;

              return (
                <motion.circle
                  key={seg.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isSelected ? strokeWidthActive : strokeWidthBase}
                  strokeDasharray={
                    seg.isFullCircle
                      ? `${circumference} 0`
                      : `${Math.max(1, seg.length)} ${Math.max(1, circumference - seg.length)}`
                  }
                  strokeDashoffset={-seg.offset}
                  strokeLinecap={segments.length > 8 ? 'butt' : 'round'}
                  initial={{ strokeDashoffset: circumference, opacity: 0 }}
                  animate={{
                    strokeDashoffset: -seg.offset,
                    opacity: hasActiveOther ? 0.35 : 1,
                    strokeWidth: isSelected ? strokeWidthActive : strokeWidthBase,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    cursor: 'pointer',
                    filter: isSelected ? `drop-shadow(0 0 10px ${seg.color}90)` : undefined,
                    transition: 'filter 0.2s ease, opacity 0.2s ease',
                  }}
                  onMouseEnter={() => handleSliceMouseEnter(seg.id)}
                  onMouseLeave={handleSliceMouseLeave}
                  onClick={() => onCategoryClick(seg.id)}
                />
              );
            })}
          </svg>

          {/* Información dinámica animada en el centro del Donut */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              width: '130px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AnimatePresence mode="wait">
              {activeSlice ? (
                <motion.div
                  key={`active-${activeSlice.id}`}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: '100%',
                  }}
                >
                  {/* Icono de categoría activa */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: `${activeSlice.color}25`,
                      border: `1px solid ${activeSlice.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      marginBottom: '3px',
                    }}
                  >
                    {activeSlice.icon}
                  </div>

                  {/* Nombre de la categoría */}
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '115px',
                    }}
                  >
                    {activeSlice.name === 'Sin categoría' || !activeSlice.name
                      ? t('noCategory')
                      : translateEntityName(activeSlice.name, 'category')}
                  </div>

                  {/* Total de la categoría */}
                  <div
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: activeSlice.color,
                      letterSpacing: '-0.3px',
                      marginTop: '1px',
                    }}
                  >
                    {formatMoney(activeSlice.total)}
                  </div>

                  {/* Porcentaje en píldora */}
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.85)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      marginTop: '3px',
                    }}
                  >
                    {activeSlice.percentage.toFixed(1)}%
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="default-center"
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      letterSpacing: '-0.5px',
                      lineHeight: 1.1,
                    }}
                  >
                    {formatMoney(total)}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      color: 'var(--text-tertiary)',
                      marginTop: '3px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {viewType === 'expense' ? t('expense') : t('income')}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
