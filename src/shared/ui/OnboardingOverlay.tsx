import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';
import { useAuthContext } from '../../app/providers/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  PlusCircle,
  BarChart2,
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
  null,                    // 0 — Welcome (no highlight)
  '.stats-grid',           // 1 — Balance cards
  '.quick-actions-mobile', // 2 — Quick actions
  '.dashboard-grid',       // 3 — Transactions
  '#settings-partner-card', // 4 — Partner Settings
  '.bottom-nav-container', // 5 — Navigation bar
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
  const navigate = useNavigate();
  const location = useLocation();

  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [direction, setDirection] = useState(1);

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
      cardPosition: 'top' as const,
      pointerDirection: 'down' as const,
      icon: <BarChart2 size={28} strokeWidth={1.5} />,
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconColor: '#f59e0b',
      subtitle: t('onboardingSub4'),
      title: t('onboardingStep4Title'),
      desc: t('onboardingStep4Desc'),
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

    const hasSeenOnboarding = localStorage.getItem('walletia_onboarding_completed');
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
          return prev; // skip re-render if nothing changed
        }
        return { top: r.top, left: r.left, width: r.width, height: r.height };
      });
    };

    const throttledUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateRect);
    };

    // Scroll target into view, then measure
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Immediate measurement + continuous tracking
    updateRect();
    
    // Poll aggressively for the first 600ms to catch DOM render after page transition
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      updateRect();
      pollCount++;
      if (pollCount > 12) clearInterval(pollInterval); // Stops after ~600ms
    }, 50);

    window.addEventListener('resize', throttledUpdate);
    window.addEventListener('scroll', throttledUpdate, true);

    return () => {
      clearInterval(pollInterval);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', throttledUpdate);
      window.removeEventListener('scroll', throttledUpdate, true);
    };
  }, [currentStep, isVisible]);

  /* ---- Handlers ---- */

  const handleFinish = useCallback(() => {
    localStorage.setItem('walletia_onboarding_completed', 'true');
    setIsVisible(false);
    setHighlightRect(null);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1);
      const next = currentStep + 1;
      
      const nextPath = steps[next].path;
      if (nextPath && nextPath !== location.pathname) {
        setHighlightRect(null);
        navigate(nextPath);
      }

      if (!STEP_SELECTORS[next]) setHighlightRect(null);
      setCurrentStep(next);
    } else {
      handleFinish();
    }
  }, [currentStep, handleFinish, navigate, location.pathname, steps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      const prev = currentStep - 1;

      const prevPath = steps[prev].path;
      if (prevPath && prevPath !== location.pathname) {
        setHighlightRect(null);
        navigate(prevPath);
      }

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
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              />
            ) : (
              <motion.div
                key="dim"
                className="onboarding-dim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
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
                y: step.cardPosition === 'bottom' ? 80 : -80,
              }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: step.cardPosition === 'bottom' ? 80 : -80,
              }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
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
                      transition={{ delay: 0.15 }}
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
                  initial={{ opacity: 0, x: direction * 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -30 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
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
