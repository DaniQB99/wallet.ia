import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';
import { useAuthContext } from '../../app/providers/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2,
  Target,
  Users,
  ChevronRight,
  X,
  Wallet,
  PlusCircle
} from 'lucide-react';

export default function OnboardingOverlay() {
  const { t } = useLocaleCurrency();
  const { user } = useAuthContext();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleShowOnboarding = () => {
      setCurrentStep(0);
      setIsVisible(true);
      navigate('/transactions');
    };
    window.addEventListener('show-onboarding', handleShowOnboarding);

    const hasSeenOnboarding = localStorage.getItem('walletia_onboarding_completed');
    
    // Check if user is "new" (created in the last 24 hours)
    const isNewUser = user?.created_at 
      ? (Date.now() - new Date(user.created_at).getTime()) < 1000 * 60 * 60 * 24 
      : false;

    if (isNewUser && !hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        navigate('/transactions');
      }, 800);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('show-onboarding', handleShowOnboarding);
      };
    }

    return () => window.removeEventListener('show-onboarding', handleShowOnboarding);
  }, [navigate, user]);

  const handleFinish = () => {
    localStorage.setItem('walletia_onboarding_completed', 'true');
    setIsVisible(false);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next === 1) {
        navigate('/transactions?add=true');
      } else if (next === 2) {
        navigate('/goals');
      } else if (next === 3) {
        navigate('/analytics');
      } else if (next === 4) {
        navigate('/settings?tab=Casal');
      }
    } else {
      handleFinish();
    }
  };

  const steps = [
    {
      icon: <Wallet size={48} strokeWidth={1.5} />,
      color: '#3b82f6', // blue
      title: t('onboardingStep1Title'),
      desc: t('onboardingStep1Desc')
    },
    {
      icon: <PlusCircle size={48} strokeWidth={1.5} />,
      color: '#ec4899', // pink
      title: t('onboardingStep6Title'),
      desc: t('onboardingStep6Desc')
    },
    {
      icon: <Target size={48} strokeWidth={1.5} />,
      color: '#10b981', // emerald
      title: t('onboardingStep2Title'),
      desc: t('onboardingStep2Desc')
    },
    {
      icon: <BarChart2 size={48} strokeWidth={1.5} />,
      color: '#f59e0b', // amber
      title: t('onboardingStep4Title'),
      desc: t('onboardingStep4Desc')
    },
    {
      icon: <Users size={48} strokeWidth={1.5} />,
      color: '#8b5cf6', // violet
      title: t('onboardingStep3Title'),
      desc: t('onboardingStep3Desc')
    }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '1rem'
          }}
        >
          <motion.div 
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ 
              backgroundColor: '#121214',
              width: '100%',
              maxWidth: '420px',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Skip button */}
            <button
              onClick={handleFinish}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                color: '#71717a',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                cursor: 'pointer',
                zIndex: 10,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            >
              <X size={18} />
            </button>

            {/* Content area */}
            <div style={{ padding: '3rem 2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0.8, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: -10 }}
                  transition={{ type: "spring", damping: 20 }}
                  style={{ 
                    width: '96px', 
                    height: '96px', 
                    borderRadius: '24px', 
                    backgroundColor: `${steps[currentStep].color}15`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    color: steps[currentStep].color
                  }}
                >
                   {steps[currentStep].icon}
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff', margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}>
                    {steps[currentStep].title}
                  </h2>
                  <p style={{ color: '#a1a1aa', margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>
                    {steps[currentStep].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '2rem' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    height: '6px',
                    borderRadius: '99px',
                    transition: 'all 0.3s ease',
                    width: currentStep === i ? '24px' : '6px',
                    backgroundColor: currentStep === i ? steps[currentStep].color : '#3f3f46'
                  }}
                />
              ))}
            </div>

            {/* Footer actions */}
            <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleFinish}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  borderRadius: '16px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: '#a1a1aa',
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#a1a1aa'}
              >
                {t('onboardingSkip')}
              </button>

              <button
                onClick={nextStep}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  borderRadius: '16px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: '#ffffff',
                  backgroundColor: steps[currentStep].color,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: `0 4px 14px ${steps[currentStep].color}40`
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {currentStep === 4 ? t('onboardingFinish') : t('onboardingNext')}
                {currentStep !== 4 && <ChevronRight size={20} strokeWidth={2.5} />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
