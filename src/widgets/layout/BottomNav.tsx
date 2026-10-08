import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Plus,
  Settings,
} from 'lucide-react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';

/**
 * Smoothly scrolls the main viewport and all potential scroll containers to the top.
 */
export const scrollToTop = () => {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

  const scrollContainers = document.querySelectorAll(
    '.main-content, .page-content, .transactions-page, .dashboard-container'
  );
  scrollContainers.forEach(container => {
    container.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  });
};

/**
 * Mobile bottom navigation component with draggable indicator bubble ("gota").
 * - Clicking any icon scrolls to the top of the window/page.
 * - Sliding the indicator bubble tracks the finger across slots without opening routes.
 * - Releasing the bubble on an icon navigates to that window and scrolls to top.
 */
export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLocaleCurrency();

  const navItems = useMemo(
    () => [
      { id: 'home', path: '/', icon: LayoutDashboard, label: t('home') },
      { id: 'transactions', path: '/transactions', icon: ArrowLeftRight, label: t('movements') },
      { id: 'add', path: '/transactions?add=true', icon: Plus, label: t('addTransaction'), isAdd: true },
      { id: 'goals', path: '/goals', icon: Target, label: t('goals') },
      { id: 'settings', path: '/settings', icon: Settings, label: t('settings') },
    ],
    [t]
  );

  const getActiveIndex = useCallback(() => {
    if (location.pathname === '/') return 0;
    if (location.pathname.startsWith('/transactions')) return 1;
    if (location.pathname.startsWith('/goals')) return 3;
    if (location.pathname.startsWith('/settings')) return 4;
    return -1;
  }, [location.pathname]);

  const activeIndex = getActiveIndex();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<(HTMLElement | null)[]>([]);
  const hasInitializedRef = useRef(false);

  // Motion values for GPU-accelerated 60/120fps transforms without React re-render churn during drag
  const bubbleX = useMotionValue(0);
  const bubbleWidth = useMotionValue(0);
  const bubbleOpacity = useMotionValue(activeIndex >= 0 ? 1 : 0);
  const bubbleScaleX = useMotionValue(1);
  const bubbleScaleY = useMotionValue(1);

  // Dragging gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const isDraggingRef = useRef(false);
  const previewIndexRef = useRef<number | null>(null);
  previewIndexRef.current = previewIndex;

  const hasPointerDownRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastClientXRef = useRef(0);

  const getSlotMetrics = useCallback((idx: number) => {
    const el = slotRefs.current[idx];
    if (!el) return null;
    return {
      left: el.offsetLeft,
      width: el.offsetWidth,
      center: el.offsetLeft + el.offsetWidth / 2,
    };
  }, []);

  // Synchronize bubble position with active tab
  const syncBubblePosition = useCallback(
    (immediate = false) => {
      if (isDraggingRef.current) return;
      const currentActive = getActiveIndex();
      if (currentActive < 0) {
        animate(bubbleOpacity, 0, { duration: 0.2 });
        return;
      }

      const metrics = getSlotMetrics(currentActive);
      if (!metrics || metrics.width === 0) return;

      bubbleOpacity.set(1);
      if (immediate || !hasInitializedRef.current) {
        bubbleX.set(metrics.left);
        bubbleWidth.set(metrics.width);
        hasInitializedRef.current = true;
      } else {
        animate(bubbleX, metrics.left, {
          type: 'spring',
          stiffness: 420,
          damping: 32,
        });
        animate(bubbleWidth, metrics.width, {
          type: 'spring',
          stiffness: 420,
          damping: 32,
        });
      }
    },
    [getActiveIndex, getSlotMetrics, bubbleX, bubbleWidth, bubbleOpacity]
  );

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      syncBubblePosition(!hasInitializedRef.current);
    });
    return () => cancelAnimationFrame(rafId);
  }, [location.pathname, location.search, syncBubblePosition]);

  // Keep bubble positioned on resize or device orientation change
  useEffect(() => {
    const handleResize = () => syncBubblePosition(true);
    window.addEventListener('resize', handleResize);

    const container = containerRef.current;
    let ro: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (!isDraggingRef.current) {
          syncBubblePosition(true);
        }
      });
      ro.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      ro?.disconnect();
    };
  }, [syncBubblePosition]);

  // Pointer drag gesture handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lastClientXRef.current = e.clientX;
    isDraggingRef.current = false;
    hasPointerDownRef.current = true;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if setPointerCapture fails on older engines
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasPointerDownRef.current || e.pointerId !== pointerIdRef.current) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (!isDraggingRef.current) {
      if (Math.abs(dx) > 6 || Math.hypot(dx, dy) > 8) {
        isDraggingRef.current = true;
        setIsDragging(true);
        const currentActive = getActiveIndex();
        const initialIdx = currentActive >= 0 ? currentActive : null;
        setPreviewIndex(initialIdx);
        previewIndexRef.current = initialIdx;
        bubbleOpacity.set(1);
      }
    }

    if (isDraggingRef.current) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const currentW = bubbleWidth.get() || rect.width / navItems.length;

      // Track pointer centered horizontally
      const pointerRelX = e.clientX - rect.left;
      const targetX = Math.max(0, Math.min(rect.width - currentW, pointerRelX - currentW / 2));
      bubbleX.set(targetX);

      // Droplet squash & stretch physics based on horizontal movement speed
      const speed = e.clientX - lastClientXRef.current;
      lastClientXRef.current = e.clientX;
      const stretch = Math.min(0.12, Math.abs(speed) * 0.008);
      bubbleScaleX.set(1 + stretch);
      bubbleScaleY.set(Math.max(0.88, 1 - stretch));

      // Calculate which slot center is nearest to bubble center
      const bubbleCenter = targetX + currentW / 2;
      let closestIdx = 0;
      let minDistance = Infinity;

      navItems.forEach((_, idx) => {
        const slotMetrics = getSlotMetrics(idx);
        if (slotMetrics) {
          const dist = Math.abs(bubbleCenter - slotMetrics.center);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = idx;
          }
        }
      });

      if (previewIndexRef.current !== closestIdx) {
        setPreviewIndex(closestIdx);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasPointerDownRef.current || e.pointerId !== pointerIdRef.current) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    hasPointerDownRef.current = false;
    animate(bubbleScaleX, 1, { type: 'spring', stiffness: 500, damping: 26 });
    animate(bubbleScaleY, 1, { type: 'spring', stiffness: 500, damping: 26 });

    if (isDraggingRef.current) {
      const container = containerRef.current;
      const rect = container?.getBoundingClientRect();
      // If user dragged far outside vertically, treat as cancel gesture
      const isCancelled = rect ? e.clientY < rect.top - 60 || e.clientY > rect.bottom + 60 : false;

      if (!isCancelled && previewIndexRef.current !== null) {
        const targetItem = navItems[previewIndexRef.current];
        if (targetItem) {
          if (targetItem.isAdd) {
            navigate(targetItem.path);
            scrollToTop();
            syncBubblePosition(false);
          } else {
            const metrics = getSlotMetrics(previewIndexRef.current);
            if (metrics) {
              animate(bubbleX, metrics.left, {
                type: 'spring',
                stiffness: 420,
                damping: 32,
              });
              animate(bubbleWidth, metrics.width, {
                type: 'spring',
                stiffness: 420,
                damping: 32,
              });
            }
            navigate(targetItem.path);
            scrollToTop();
          }
        }
      } else {
        // Cancelled: snap back to current active tab
        syncBubblePosition(false);
      }

      // Small delay to prevent synthetic click from firing on pointer origin
      setTimeout(() => {
        isDraggingRef.current = false;
        setIsDragging(false);
        setPreviewIndex(null);
      }, 60);
    } else {
      isDraggingRef.current = false;
      setIsDragging(false);
      setPreviewIndex(null);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    hasPointerDownRef.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
    setPreviewIndex(null);
    animate(bubbleScaleX, 1, { type: 'spring', stiffness: 500, damping: 26 });
    animate(bubbleScaleY, 1, { type: 'spring', stiffness: 500, damping: 26 });
    syncBubblePosition(false);
  };

  // Click handler on tabs
  const handleItemClick = (
    e: React.MouseEvent,
    item: (typeof navItems)[number]
  ) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      return;
    }

    scrollToTop();

    // If already on that path, prevent default navigation since we only want scrollToTop
    if (location.pathname === item.path && !item.isAdd) {
      e.preventDefault();
    }
  };

  return (
    <div className="bottom-nav-container">
      <nav className="bottom-nav">
        <div
          ref={containerRef}
          className={`bottom-nav-items ${isDragging ? 'is-dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {/* Draggable indicator bubble ("gota") */}
          <motion.div
            className={`bottom-nav-bubble ${isDragging ? 'is-dragging' : ''}`}
            style={{
              x: bubbleX,
              width: bubbleWidth,
              opacity: bubbleOpacity,
              scaleX: bubbleScaleX,
              scaleY: bubbleScaleY,
            }}
          />

          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isEffectivelyActive = isDragging
              ? previewIndex === index
              : activeIndex === index;
            const isPreview = isDragging && previewIndex === index;

            if (item.isAdd) {
              return (
                <div
                  key="add"
                  ref={el => {
                    slotRefs.current[index] = el;
                  }}
                  className="bottom-nav-slot"
                >
                  <NavLink
                    to={item.path}
                    draggable={false}
                    onDragStart={e => e.preventDefault()}
                    onClick={e => handleItemClick(e, item)}
                    className={() => `bottom-nav-add-btn ${isPreview ? 'is-preview' : ''}`}
                    aria-label={t('addTransaction')}
                  >
                    <Icon />
                  </NavLink>
                </div>
              );
            }

            return (
              <NavLink
                key={item.id}
                id={item.id === 'home' ? 'nav-home' : `nav-${item.id}`}
                to={item.path}
                ref={el => {
                  slotRefs.current[index] = el;
                }}
                draggable={false}
                onDragStart={e => e.preventDefault()}
                onClick={e => handleItemClick(e, item)}
                className={() =>
                  `bottom-nav-item ${isEffectivelyActive ? 'active' : ''} ${isPreview ? 'is-preview' : ''}`
                }
                style={{ position: 'relative' }}
              >
                <span className="bottom-nav-icon-wrapper">
                  <Icon />
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
