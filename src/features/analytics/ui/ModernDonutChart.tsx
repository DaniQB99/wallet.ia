import React, { useState, useMemo, useRef } from 'react';
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
  onCategoryClick?: (categoryId: string) => void;
  activeCategoryId?: string | null;
  onHoverCategory?: (categoryId: string | null) => void;
  loading?: boolean;
}

export const ModernDonutChart: React.FC<ModernDonutChartProps> = ({
  categories,
  total,
  viewType,
  activeCategoryId,
  onHoverCategory,
  loading = false,
}) => {
  const { t, formatMoney, translateEntityName } = useLocaleCurrency();
  const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Active category is either externally hovered/selected or internally hovered/selected
  const currentActiveId = activeCategoryId !== undefined && activeCategoryId !== null
    ? activeCategoryId
    : internalHoveredId;

  // Geometry configuration
  const radius = 82;
  const strokeWidthBase = 18;
  const strokeWidthActive = 24;
  const circumference = 2 * Math.PI * radius; // ~515.22 px
  const center = 110;

  // Sort categories descending by amount for clean visual balance
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => b.total - a.total);
  }, [categories]);

  // Slices with mathematically guaranteed perimeter spacing:
  // Each category is a single, solid arc with strokeLinecap='butt'.
  // Separation between categories is created solely by the clean natural gap (no interior lines).
  const segments = useMemo(() => {
    if (total <= 0 || sortedCategories.length === 0) return [];

    const numCategories = sortedCategories.length;

    // Single category: clean 100% full ring without gaps
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

    // Clean single division between distinct categories (2.5px gap along perimeter)
    const gap = 2.5;
    const totalGap = numCategories * gap;
    const availableCircumference = Math.max(0, circumference - totalGap);

    // Ensure even tiny percentages have a minimal visible pill length (min 6px)
    const minLength = 6;
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

  // Desktop Mouse interactions: expands on hover, never triggers navigation
  const handleSliceMouseEnter = (id: string) => {
    setInternalHoveredId(id);
    onHoverCategory?.(id);
  };

  const handleSliceMouseLeave = () => {
    setInternalHoveredId(null);
    onHoverCategory?.(null);
  };

  // Mobile Touch interactions (Touch start / Drag scrubbing around the ring to inspect percentages)
  const getCategoryAtCoordinates = (clientX: number, clientY: number): string | null => {
    if (!svgRef.current || segments.length === 0) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check if within donut ring radius zone (+/- margin)
    const scale = 220 / rect.width;
    const distSvg = dist * scale;
    if (distSvg < radius - 26 || distSvg > radius + 28) {
      return null;
    }

    // Angle starting from top (0 at 12 o'clock in standard orientation)
    let angleRad = Math.atan2(dy, dx) + Math.PI / 2;
    if (angleRad < 0) angleRad += 2 * Math.PI;

    const touchDistance = (angleRad / (2 * Math.PI)) * circumference;

    for (const seg of segments) {
      if (touchDistance >= seg.offset && touchDistance <= seg.offset + seg.length + 3) {
        return seg.id;
      }
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const catId = getCategoryAtCoordinates(touch.clientX, touch.clientY);
    if (catId) {
      if (internalHoveredId === catId) {
        // Tap on already active slice deselects back to total
        setInternalHoveredId(null);
        onHoverCategory?.(null);
      } else {
        setInternalHoveredId(catId);
        onHoverCategory?.(catId);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const catId = getCategoryAtCoordinates(touch.clientX, touch.clientY);
    if (catId && catId !== internalHoveredId) {
      setInternalHoveredId(catId);
      onHoverCategory?.(catId);
    }
  };

  // Toggle selection on click/tap without navigating
  const handleCircleClick = (segId: string) => {
    if (internalHoveredId === segId) {
      setInternalHoveredId(null);
      onHoverCategory?.(null);
    } else {
      setInternalHoveredId(segId);
      onHoverCategory?.(segId);
    }
  };

  return (
    <div
      onClick={(e) => {
        // Clicking container background deselects active slice
        if (e.target === e.currentTarget) {
          setInternalHoveredId(null);
          onHoverCategory?.(null);
        }
      }}
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
        userSelect: 'none',
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
            ref={svgRef}
            viewBox="0 0 220 220"
            width="220"
            height="220"
            style={{
              overflow: 'visible',
              transform: 'rotate(-90deg)',
              touchAction: 'none',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
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

            {/* Segmentos de la gráfica Donut con strokeLinecap='butt': un único arco continuo por color */}
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
                  strokeLinecap="butt"
                  initial={{ strokeDashoffset: circumference, opacity: 0 }}
                  animate={{
                    strokeDashoffset: -seg.offset,
                    opacity: hasActiveOther ? 0.35 : 1,
                    strokeWidth: isSelected ? strokeWidthActive : strokeWidthBase,
                  }}
                  transition={{
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    cursor: 'pointer',
                    filter: isSelected ? `drop-shadow(0 0 12px ${seg.color}a0)` : undefined,
                    transition: 'filter 0.2s ease, opacity 0.2s ease',
                  }}
                  onMouseEnter={() => handleSliceMouseEnter(seg.id)}
                  onMouseLeave={handleSliceMouseLeave}
                  onClick={() => handleCircleClick(seg.id)}
                />
              );
            })}
          </svg>

          {/* Información dinámica en el centro del Donut (Solo lectura e inspección, no abre transacciones) */}
          <div
            onClick={() => {
              // Tocar el centro deselecciona y vuelve a la vista de total
              if (internalHoveredId) {
                setInternalHoveredId(null);
                onHoverCategory?.(null);
              }
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              cursor: internalHoveredId ? 'pointer' : 'default',
              pointerEvents: 'auto',
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

                  {/* Porcentaje en píldora interactiva */}
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
