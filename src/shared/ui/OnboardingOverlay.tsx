import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';
import { useAuthContext } from '../../app/providers/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { DEFAULT_CATEGORIES } from '../config/defaultCategories';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  PlusCircle,
  PieChart,
  Tag,
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Heart,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** CSS selectors for target elements highlighted in each step.        */
const STEP_SELECTORS: (string | null)[] = [
  null,                       // 0 — Welcome (no highlight)
  '.bank-card-carousel',      // 1 — Balance cards / Carrusel 3D
  '.dashboard-actions-grid',  // 2 — Quick actions & center (+)
  '#dashboard-analytics-btn', // 3 — Analytics shortcut button in header
  '.analytics-donut-section', // 4 — Analytics Donut chart
  '#settings-categories-item',// 5 — Categories item in Settings
  '#settings-partner-card',   // 6 — Partner Settings
  '.bottom-nav-container',    // 7 — Navigation bar
];

const TOTAL_STEPS = STEP_SELECTORS.length;
const HIGHLIGHT_PAD = 8;

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/* ------------------------------------------------------------------ */
/*  OnboardingOverlay                                                  */
/*                                                                     */
/*  Coach-mark / spotlight tour for first-time users.                  */
/*  Shows the real Dashboard UI in the background with highlighted     */
/*  elements and a floating explanation card.                          */
/* ------------------------------------------------------------------ */

export default function OnboardingOverlay() {
  const { t } = useLocaleCurrency();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [direction, setDirection] = useState(1);
  const [categoryChoice, setCategoryChoice] = useState<'default' | 'clean'>('default');

  /* ---- Step definitions (rebuilt every render for i18n) ---- */

  const steps = [
    {
      path: '/',
      cardPosition: 'bottom' as const,
      pointerDirection: null as 'up' | 'down' | null,
      icon: <Sparkles size={28} strokeWidth={1.5} />,
      iconBg: 'rgba(99, 102, 241, 0.15)',
      iconColor: '#818cf8',
      subtitle: t('onboardingSub1'),
      title: t('onboardingWelcome'),
      desc: t('onboardingWelcomeDesc'),
    },
    {
      path: '/',
      cardPosition: 'bottom' as const,
      pointerDirection: 'up' as const,
      icon: <Wallet size={28} strokeWidth={1.5} />,
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: '#10b981',
      subtitle: t('onboardingSub2'),
      title: t('onboardingStep1Title'),
      desc: t('onboardingStep1Desc'),
    },
    {
      path: '/',
      cardPosition: 'top' as const,
      pointerDirection: 'down' as const,
      icon: <PlusCircle size={28} strokeWidth={1.5} />,
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#3b82f6',
      subtitle: t('onboardingSub3'),
      title: t('onboardingStep5Title'),
      desc: t('onboardingStep5Desc'),
    },
    {
      path: '/',
      cardPosition: 'bottom' as const,
      pointerDirection: 'up' as const,
      icon: <PieChart size={28} strokeWidth={1.5} />,
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconColor: '#f59e0b',
      subtitle: t('onboardingSubAnalyticsShortcut'),
      title: t('onboardingAnalyticsShortcutTitle'),
      desc: t('onboardingAnalyticsShortcutDesc'),
    },
    {
      path: '/analytics',
      cardPosition: 'top' as const,
      pointerDirection: 'down' as const,
      icon: <PieChart size={28} strokeWidth={1.5} />,
      iconBg: 'rgba(236, 72, 153, 0.15)',
      iconColor: '#ec4899',
      subtitle: t('onboardingSub4'),
      title: t('onboardingStep4Title'),
      desc: t('onboardingStep4Desc'),
    },
    {
      path: '/settings',
      cardPosition: 'bottom' as const,
      pointerDirection: 'up' as const,
      icon: <Tag size={28} strokeWidth={1.5} />,
      iconBg: 'rgba(239, 68, 68, 0.15)',
      iconColor: '#ef4444',
      subtitle: t('onboardingSubCategories'),
      title: t('onboardingCategoriesTitle'),
      desc: t('onboardingCategoriesDesc'),
    },
    {
      path: '/settings',
      cardPosition: 'top' as const,
      pointerDirection: 'down' as const,
      icon: <Heart size={28} strokeWidth={1.5} />,
      iconBg: 'rgba(236, 72, 153, 0.15)',
      iconColor: '#ec4899',
      subtitle: t('onboardingSubPartner'),
      title: t('onboardingStepPartnerTitle'),
      desc: t('onboardingStepPartnerDesc'),
    },
    {
      path: '/',
      cardPosition: 'top' as const,
      pointerDirection: 'down' as const,
      icon: <Compass size={28} strokeWidth={1.5} />,
      iconBg: 'rgba(139, 92, 246, 0.15)',
      iconColor: '#8b5cf6',
      subtitle: t('onboardingSub5'),
      title: t('onboardingNavTitle'),
      desc: t('onboardingNavDesc'),
    },
  ];

  const step = steps[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  /* ---- Show / mount logic ---- */

  useEffect(() => {
    const handleShowOnboarding = () => {
      setCurrentStep(0);
      setDirection(1);
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
      }, 800);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('show-onboarding', handleShowOnboarding);
      };
    }

    return () => window.removeEventListener('show-onboarding', handleShowOnboarding);
  }, [navigate, user]);

  /* ---- Bloqueo absoluto de scroll de fondo para evitar desplazamientos, tirones y lags ---- */

  useEffect(() => {
    if (!isVisible) return;

    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyLeft = document.body.style.left;
    const originalBodyWidth = document.body.style.width;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;
    const originalDocOverflow = document.documentElement.style.overflow;
    const originalDocOverscroll = document.documentElement.style.overscrollBehavior;

    // Fijar la pantalla en la parte superior absoluta
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Inmovilizar completamente el documento de fondo
    document.body.style.position = 'fixed';
    document.body.style.top = '0px';
    document.body.style.left = '0px';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    document.body.classList.add('onboarding-open');
    document.documentElement.classList.add('onboarding-open');

    const preventScroll = (e: TouchEvent | WheelEvent) => {
      if (e.cancelable) e.preventDefault();
    };

    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.left = originalBodyLeft;
      document.body.style.width = originalBodyWidth;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
      document.documentElement.style.overflow = originalDocOverflow;
      document.documentElement.style.overscrollBehavior = originalDocOverscroll;

      document.body.classList.remove('onboarding-open');
      document.documentElement.classList.remove('onboarding-open');

      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('wheel', preventScroll);
    };
  }, [isVisible]);

  /* ---- Highlight rect tracking ---- */

  useEffect(() => {
    if (!isVisible) {
      setHighlightRect(null);
      return;
    }

    const selector = STEP_SELECTORS[currentStep];
    if (!selector) {
      setHighlightRect(null);
      return;
    }

    // Mantener la pantalla anclada en el origen
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    let rafId: number;

    const updateRect = () => {
      const el = document.querySelector(selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setHighlightRect((prev) => {
        if (
          prev &&
          Math.abs(prev.top - r.top) < 0.5 &&
          Math.abs(prev.left - r.left) < 0.5 &&
          Math.abs(prev.width - r.width) < 0.5 &&
          Math.abs(prev.height - r.height) < 0.5
        ) {
          return prev;
        }
        return { top: r.top, left: r.left, width: r.width, height: r.height };
      });
    };

    const throttledUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateRect);
    };

    // Medición inmediata
    updateRect();

    // Muestreo rápido de precisión para renderizados dinámicos
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      updateRect();
      pollCount++;
      if (pollCount > 8) clearInterval(pollInterval);
    }, 30);

    window.addEventListener('resize', throttledUpdate);

    return () => {
      clearInterval(pollInterval);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', throttledUpdate);
    };
  }, [currentStep, isVisible, location.pathname]);

  /* ---- Handlers ---- */

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
    window.dispatchEvent(new Event('onboarding-completed'));
  }, [user?.id, applyCategoryChoice, categoryChoice]);

  const nextStep = useCallback(() => {
    if (currentStep === 5) {
      void applyCategoryChoice(categoryChoice);
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1);
      const next = currentStep + 1;
      
      const nextPath = steps[next].path;
      if (nextPath && nextPath !== location.pathname) {
        setHighlightRect(null);
        navigate(nextPath);
      }

      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (!STEP_SELECTORS[next]) setHighlightRect(null);
      setCurrentStep(next);
    } else {
      void handleFinish();
    }
  }, [currentStep, handleFinish, navigate, location.pathname, steps, applyCategoryChoice, categoryChoice]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      const prev = currentStep - 1;

      const prevPath = steps[prev].path;
      if (prevPath && prevPath !== location.pathname) {
        setHighlightRect(null);
        navigate(prevPath);
      }

      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (!STEP_SELECTORS[prev]) setHighlightRect(null);
      setCurrentStep(prev);
    }
  }, [currentStep, navigate, location.pathname, steps]);

  /* ---- Render ---- */

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="onboarding-root"
          className="onboarding-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Visual overlay — spotlight or full dim */}
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
                transition={{ duration: 0.18, ease: 'easeOut' }}
              />
            ) : (
              <motion.div
                key="dim"
                className="onboarding-dim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          {/* Floating card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`card-${step.cardPosition}`}
              className={`onboarding-card onboarding-card--${step.cardPosition}`}
              initial={{
                opacity: 0,
                y: step.cardPosition === 'bottom' ? 30 : -30,
              }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: step.cardPosition === 'bottom' ? 30 : -30,
              }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {/* Header */}
              <div className="onboarding-card-header">
                <div className="onboarding-badge">
                  {t('onboardingStepLabel')} {currentStep + 1} {t('onboardingStepOf')}{' '}
                  {TOTAL_STEPS}
                </div>
                <div className="onboarding-header-actions">
                  {step.pointerDirection && (
                    <motion.div
                      className="onboarding-pointer"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {step.pointerDirection === 'up' ? (
                        <ArrowUp size={14} strokeWidth={2.5} />
                      ) : (
                        <ArrowDown size={14} strokeWidth={2.5} />
                      )}
                      <span>
                        {step.pointerDirection === 'up'
                          ? t('onboardingPointUp')
                          : t('onboardingPointDown')}
                      </span>
                    </motion.div>
                  )}
                  <button
                    className="onboarding-btn-close"
                    onClick={handleFinish}
                    aria-label={t('onboardingSkip')}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body — content animates on step change */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep}
                  className="onboarding-card-body"
                  initial={{ opacity: 0, x: direction * 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -15 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <div className="onboarding-content-row">
                    <div
                      className="onboarding-icon-wrap"
                      style={{
                        background: step.iconBg,
                        color: step.iconColor,
                      }}
                    >
                      {step.icon}
                    </div>
                    <div className="onboarding-content-text">
                      {step.subtitle && (
                        <div className="onboarding-subtitle">{step.subtitle}</div>
                      )}
                      <h3 className="onboarding-title">{step.title}</h3>
                    </div>
                  </div>
                  <p className="onboarding-desc">{step.desc}</p>
                  {currentStep === 5 && (
                    <div className="onboarding-choices-container">
                      <button
                        type="button"
                        className={`onboarding-choice-card ${
                          categoryChoice === 'default'
                            ? 'onboarding-choice-card--active'
                            : ''
                        }`}
                        onClick={() => setCategoryChoice('default')}
                      >
                        <div className="onboarding-choice-header">
                          <span className="onboarding-choice-title">
                            {t('onboardingCatOptionDefault')}
                          </span>
                          <span className="onboarding-choice-badge">
                            {t('onboardingCatRecommended')}
                          </span>
                        </div>
                        <p className="onboarding-choice-desc">
                          {t('onboardingCatOptionDefaultDesc')}
                        </p>
                      </button>

                      <button
                        type="button"
                        className={`onboarding-choice-card ${
                          categoryChoice === 'clean'
                            ? 'onboarding-choice-card--active'
                            : ''
                        }`}
                        onClick={() => setCategoryChoice('clean')}
                      >
                        <div className="onboarding-choice-header">
                          <span className="onboarding-choice-title">
                            {t('onboardingCatOptionClean')}
                          </span>
                        </div>
                        <p className="onboarding-choice-desc">
                          {t('onboardingCatOptionCleanDesc')}
                        </p>
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <div className="onboarding-footer">
                <div className="onboarding-dots">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`onboarding-dot${
                        i === currentStep ? ' onboarding-dot--active' : ''
                      }${i < currentStep ? ' onboarding-dot--done' : ''}`}
                    />
                  ))}
                </div>
                <div className="onboarding-nav-buttons">
                  {currentStep > 0 && (
                    <button
                      className="onboarding-btn-prev"
                      onClick={prevStep}
                      aria-label={t('onboardingPrev')}
                    >
                      <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                  )}
                  <button className="onboarding-btn-next" onClick={nextStep}>
                    <span>
                      {isLastStep ? t('onboardingFinish') : t('onboardingNext')}
                    </span>
                    {!isLastStep && <ChevronRight size={18} strokeWidth={2.5} />}
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
