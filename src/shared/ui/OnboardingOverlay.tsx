import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';
import { useAuthContext } from '../../app/providers/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { DEFAULT_CATEGORIES } from '../config/defaultCategories';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Smartphone,
  Wallet,
  PlusCircle,
  PieChart,
  Tag,
  Compass,
  Users,
  Sparkles,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types & Interfaces                                                */
/* ------------------------------------------------------------------ */

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'center' | 'right';
  arrowOffset: number;
}

const HIGHLIGHT_PAD = 8;

/* ------------------------------------------------------------------ */
/*  OnboardingOverlay                                                  */
/*                                                                     */
/*  Compact, viewport-resilient floating coach-mark tour.              */
/*  Supports mobile browser bars, iOS Safari, Android, and Desktop.     */
/* ------------------------------------------------------------------ */

export default function OnboardingOverlay() {
  const { t, translateEntityName } = useLocaleCurrency();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const cardRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [categoryChoice, setCategoryChoice] = useState<'default' | 'clean'>('default');

  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    placement: 'center',
    arrowOffset: 0,
  });

  // Detect platform & PWA standalone status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(Boolean(standalone));

    const ua = navigator.userAgent || '';
    setIsIOS(/iPhone|iPad|iPod/i.test(ua));
    setIsAndroid(/Android/i.test(ua));
  }, []);

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  /* ---- Step definitions ---- */
  const steps = [
    {
      id: 'welcome',
      path: '/',
      selector: null,
      subtitle: t('onboardingSub1'),
      title: t('onboardingWelcome'),
      desc: t('onboardingWelcomeDesc'),
      icon: <Sparkles size={20} className="text-accent" />,
    },
    {
      id: 'balances',
      path: '/',
      selector: '.bank-card-carousel',
      subtitle: t('onboardingSub2'),
      title: t('onboardingStep1Title'),
      desc: t('onboardingStep1Desc'),
      icon: <Wallet size={20} className="text-accent" />,
    },
    {
      id: 'quick-entry',
      path: '/',
      selector: '.dashboard-actions-grid',
      subtitle: t('onboardingSub3'),
      title: t('onboardingStep5Title'),
      desc: t('onboardingStep5Desc'),
      icon: <PlusCircle size={20} className="text-accent" />,
    },
    {
      id: 'analytics',
      path: '/',
      selector: '#dashboard-analytics-btn',
      subtitle: t('onboardingSubAnalyticsShortcut') || t('onboardingSub4'),
      title: t('onboardingAnalyticsShortcutTitle') || t('onboardingStep4Title'),
      desc: `${t('onboardingAnalyticsShortcutDesc')} ${t('onboardingStep4Desc')}`,
      icon: <PieChart size={20} className="text-accent" />,
    },
    {
      id: 'partner',
      path: '/settings',
      selector: '#settings-partner-card',
      subtitle: t('onboardingSubPartner'),
      title: t('onboardingStepPartnerTitle'),
      desc: t('onboardingStepPartnerDesc'),
      icon: <Users size={20} className="text-accent" />,
    },
    {
      id: 'categories',
      path: '/settings',
      selector: '#settings-categories-item',
      subtitle: t('onboardingSubCategories'),
      title: t('onboardingCategoriesTitle'),
      desc: t('onboardingCategoriesDesc'),
      icon: <Tag size={20} className="text-accent" />,
    },
    {
      id: 'navigation',
      path: '/',
      selector: isDesktop ? '.sidebar-nav' : '.bottom-nav-container',
      subtitle: t('onboardingSub5'),
      title: t('onboardingNavTitle'),
      desc: t('onboardingNavDesc'),
      icon: <Compass size={20} className="text-accent" />,
    },
  ];

  const TOTAL_STEPS = steps.length;
  const step = steps[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  /* ---- Show / mount triggers ---- */
  useEffect(() => {
    const handleShowOnboarding = () => {
      setCurrentStep(0);
      setHighlightRect(null);
      setIsVisible(true);
      if (location.pathname !== '/') navigate('/');
    };
    window.addEventListener('show-onboarding', handleShowOnboarding);

    const onboardingKey = user ? `walletia_onboarding_${user.id}_completed` : null;
    const hasSeenOnboarding = user?.onboarding_completed || (onboardingKey ? localStorage.getItem(onboardingKey) : null);
    const isNewUser = user?.created_at
      ? Date.now() - new Date(user.created_at).getTime() < 86_400_000
      : false;

    if (isNewUser && !hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (location.pathname !== '/') navigate('/');
      }, 700);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('show-onboarding', handleShowOnboarding);
      };
    }

    return () => window.removeEventListener('show-onboarding', handleShowOnboarding);
  }, [navigate, user, location.pathname]);

  /* ---- Viewport & position calculation ---- */
  const updatePosition = useCallback(() => {
    if (!isVisible) return;

    const currentStepData = steps[currentStep];
    if (!currentStepData || !currentStepData.selector) {
      setHighlightRect(null);
      setTooltipPos({
        top: 0,
        left: 0,
        placement: 'center',
        arrowOffset: 0,
      });
      return;
    }

    // Ensure we are on the expected route
    if (currentStepData.path && location.pathname !== currentStepData.path) {
      setHighlightRect(null);
      navigate(currentStepData.path);
      return;
    }

    const el = document.querySelector(currentStepData.selector) as HTMLElement | null;
    if (!el) {
      // Element not yet rendered in DOM
      return;
    }

    // Center element in viewport smoothly
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } catch {
      // Fallback
    }

    const r = el.getBoundingClientRect();
    setHighlightRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });

    const vv = window.visualViewport;
    const vpWidth = vv ? vv.width : window.innerWidth;
    const vpHeight = vv ? vv.height : window.innerHeight;
    const vpTop = vv ? vv.offsetTop : 0;
    const vpLeft = vv ? vv.offsetLeft : 0;

    const cardWidth = Math.min(340, vpWidth - 28);
    const cardHeight = cardRef.current?.offsetHeight || 210;

    // Desktop sidebar special alignment
    if (window.innerWidth >= 768 && currentStepData.selector.includes('sidebar')) {
      const top = Math.max(
        vpTop + 20,
        Math.min(r.top + 30, vpTop + vpHeight - cardHeight - 20)
      );
      const left = r.right + 16;
      setTooltipPos({
        top,
        left,
        placement: 'right',
        arrowOffset: 24,
      });
      return;
    }

    // Vertical placement logic
    const spaceAbove = r.top - vpTop;
    const spaceBelow = (vpTop + vpHeight) - r.bottom;

    let placement: 'top' | 'bottom' = 'bottom';
    let top = 0;

    if (spaceBelow >= cardHeight + 20 || spaceBelow >= spaceAbove) {
      placement = 'bottom';
      top = r.bottom + 14;
    } else {
      placement = 'top';
      top = r.top - cardHeight - 14;
    }

    // Clamp inside viewport
    top = Math.max(vpTop + 14, Math.min(top, vpTop + vpHeight - cardHeight - 14));

    // Center horizontally relative to target
    const targetCenterX = r.left + r.width / 2;
    let left = targetCenterX - cardWidth / 2;
    left = Math.max(vpLeft + 14, Math.min(left, vpLeft + vpWidth - cardWidth - 14));

    const arrowOffset = Math.max(20, Math.min(targetCenterX - left, cardWidth - 20));

    setTooltipPos({
      top,
      left,
      placement,
      arrowOffset,
    });
  }, [currentStep, isVisible, steps, location.pathname, navigate]);

  // Recalculate on step change, resize, visualViewport change, and element animations
  useEffect(() => {
    if (!isVisible) {
      setHighlightRect(null);
      return;
    }

    let rafId: number;
    const throttledUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };

    updatePosition();

    // Fast polling for router transitions and dynamic element mounting
    let count = 0;
    const interval = setInterval(() => {
      updatePosition();
      count++;
      if (count > 16) clearInterval(interval);
    }, 40);

    window.addEventListener('resize', throttledUpdate);
    window.addEventListener('scroll', throttledUpdate, { passive: true });
    window.visualViewport?.addEventListener('resize', throttledUpdate);
    window.visualViewport?.addEventListener('scroll', throttledUpdate);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', throttledUpdate);
      window.removeEventListener('scroll', throttledUpdate);
      window.visualViewport?.removeEventListener('resize', throttledUpdate);
      window.visualViewport?.removeEventListener('scroll', throttledUpdate);
    };
  }, [isVisible, currentStep, location.pathname, updatePosition]);

  /* ---- Database & Choice Actions ---- */
  const applyCategoryChoice = useCallback(
    async (choice: 'default' | 'clean') => {
      if (!user?.id) return;
      try {
        if (choice === 'clean') {
          await supabase.from('categories').delete().eq('user_id', user.id);
        } else {
          const { data: existing } = await supabase
            .from('categories')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
          if (!existing || existing.length === 0) {
            const toInsert = DEFAULT_CATEGORIES.map((cat) => ({
              ...cat,
              user_id: user.id,
            }));
            await supabase.from('categories').insert(toInsert);
          }
        }
        await queryClient.invalidateQueries({ queryKey: ['categories'] });
      } catch (err) {
        console.error('Error applying category choice:', err);
      }
    },
    [user?.id, queryClient]
  );

  const handleFinish = useCallback(async () => {
    if (user?.id) {
      localStorage.setItem(`walletia_onboarding_${user.id}_completed`, 'true');
      void supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
    }
    localStorage.setItem('walletia_onboarding_completed', 'true');
    await applyCategoryChoice(categoryChoice);
    setIsVisible(false);
    setHighlightRect(null);

    // Return to dashboard if finished while in settings
    if (location.pathname !== '/') {
      navigate('/');
    }

    window.dispatchEvent(new Event('onboarding-completed'));
  }, [user?.id, applyCategoryChoice, categoryChoice, location.pathname, navigate]);

  const nextStep = useCallback(() => {
    if (currentStep === 5) {
      void applyCategoryChoice(categoryChoice);
    }

    if (currentStep < TOTAL_STEPS - 1) {
      const nextIdx = currentStep + 1;
      const nextStepData = steps[nextIdx];
      if (nextStepData.path && nextStepData.path !== location.pathname) {
        setHighlightRect(null);
        navigate(nextStepData.path);
      }
      setCurrentStep(nextIdx);
    } else {
      void handleFinish();
    }
  }, [currentStep, TOTAL_STEPS, steps, location.pathname, navigate, handleFinish, applyCategoryChoice, categoryChoice]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      const prevStepData = steps[prevIdx];
      if (prevStepData.path && prevStepData.path !== location.pathname) {
        setHighlightRect(null);
        navigate(prevStepData.path);
      }
      setCurrentStep(prevIdx);
    }
  }, [currentStep, steps, location.pathname, navigate]);

  const pointerDirectionLabel =
    tooltipPos.placement === 'bottom' ? t('onboardingPointUp') : t('onboardingPointDown');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="onboarding-root"
          className="onboarding-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Spotlight highlight or backdrop dim */}
          <AnimatePresence>
            {highlightRect ? (
              <motion.div
                key="spotlight"
                className="onboarding-spotlight"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  top: highlightRect.top - HIGHLIGHT_PAD,
                  left: highlightRect.left - HIGHLIGHT_PAD,
                  width: highlightRect.width + HIGHLIGHT_PAD * 2,
                  height: highlightRect.height + HIGHLIGHT_PAD * 2,
                }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              />
            ) : (
              <motion.div
                key="dim"
                className="onboarding-dim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>

          {/* Floating contextual card */}
          <AnimatePresence mode="wait">
            <motion.div
              ref={cardRef}
              key={`card-${currentStep}`}
              className={`onboarding-card onboarding-card--${tooltipPos.placement}`}
              style={
                tooltipPos.placement === 'center'
                  ? undefined
                  : {
                      top: `${tooltipPos.top}px`,
                      left: `${tooltipPos.left}px`,
                    }
              }
              initial={{
                opacity: 0,
                scale: 0.96,
                y: tooltipPos.placement === 'bottom' ? -8 : tooltipPos.placement === 'top' ? 8 : 0,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {/* Contextual arrow pointer */}
              {tooltipPos.placement !== 'center' && (
                <div
                  className={`onboarding-arrow onboarding-arrow--${tooltipPos.placement}`}
                  style={
                    tooltipPos.placement === 'right'
                      ? { top: `${tooltipPos.arrowOffset}px` }
                      : { left: `${tooltipPos.arrowOffset}px` }
                  }
                  aria-label={pointerDirectionLabel}
                />
              )}

              {/* Header with dots and counter */}
              <div className="onboarding-card-header">
                <div
                  className="onboarding-dots"
                  aria-label={`${t('onboardingStepLabel')} ${currentStep + 1} ${t('onboardingStepOf')} ${TOTAL_STEPS}`}
                >
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`onboarding-dot ${
                        i === currentStep
                          ? 'onboarding-dot--active'
                          : i < currentStep
                          ? 'onboarding-dot--done'
                          : ''
                      }`}
                    />
                  ))}
                </div>

                <div className="onboarding-header-right">
                  <span className="onboarding-step-counter">
                    {currentStep + 1}/{TOTAL_STEPS}
                  </span>
                  <button
                    type="button"
                    className="onboarding-btn-close"
                    onClick={handleFinish}
                    aria-label={t('onboardingSkip')}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="onboarding-card-body">
                {step.subtitle && (
                  <div className="onboarding-subtitle">{step.subtitle}</div>
                )}
                <h3 className="onboarding-title">{step.title}</h3>
                <p className="onboarding-desc">{step.desc}</p>

                {/* Sutil Tip de Instalación PWA (Paso 0) */}
                {currentStep === 0 && !isStandalone && (
                  <div className="onboarding-pwa-tip">
                    <div className="onboarding-pwa-tip-header">
                      <Smartphone size={14} style={{ color: 'var(--accent-primary)' }} />
                      <span>{t('onboardingPwaTitle')}</span>
                    </div>
                    <p className="onboarding-pwa-tip-text">
                      {isIOS
                        ? t('onboardingPwaDescIOS')
                        : isAndroid
                        ? t('onboardingPwaDescAndroid')
                        : t('onboardingPwaDescDesktop')}
                    </p>
                  </div>
                )}

                {/* Configuración visual de Categorías (Paso 5) */}
                {currentStep === 5 && (
                  <div className="onboarding-category-section">
                    <div className="onboarding-category-pills">
                      <button
                        type="button"
                        className={`onboarding-cat-pill ${categoryChoice === 'default' ? 'active' : ''}`}
                        onClick={() => setCategoryChoice('default')}
                      >
                        <span className="onboarding-cat-pill-title">
                          {t('onboardingCatOptionDefault')}
                        </span>
                        <span className="onboarding-cat-badge">
                          {t('onboardingCatRecommended')}
                        </span>
                        <p className="onboarding-cat-pill-desc">
                          {t('onboardingCatOptionDefaultDesc')}
                        </p>
                      </button>

                      <button
                        type="button"
                        className={`onboarding-cat-pill ${categoryChoice === 'clean' ? 'active' : ''}`}
                        onClick={() => setCategoryChoice('clean')}
                      >
                        <span className="onboarding-cat-pill-title">
                          {t('onboardingCatOptionClean')}
                        </span>
                        <p className="onboarding-cat-pill-desc">
                          {t('onboardingCatOptionCleanDesc')}
                        </p>
                      </button>
                    </div>

                    {categoryChoice === 'default' && (
                      <div className="onboarding-category-preview-chips">
                        {DEFAULT_CATEGORIES.slice(0, 8).map((cat) => (
                          <span key={cat.name} className="onboarding-category-chip">
                            {cat.icon} {translateEntityName ? translateEntityName(cat.name, 'category') : cat.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="onboarding-footer">
                <button
                  type="button"
                  className="onboarding-btn-skip"
                  onClick={handleFinish}
                >
                  {t('onboardingSkip')}
                </button>

                <div className="onboarding-footer-actions">
                  {currentStep > 0 && (
                    <button
                      type="button"
                      className="onboarding-btn-prev"
                      onClick={prevStep}
                      aria-label={t('onboardingPrev')}
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="onboarding-btn-next"
                    onClick={nextStep}
                  >
                    <span>
                      {isLastStep
                        ? t('onboardingFinish')
                        : currentStep === 0
                        ? t('onboardingNext')
                        : t('onboardingGotIt')}
                    </span>
                    {!isLastStep && <ChevronRight size={15} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
