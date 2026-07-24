import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';
import {
  BarChart2,
  Target,
  Users,
  ChevronRight,
  X,
  Wallet,
  PlusCircle
} from 'lucide-react';

/**
 * Componente sobrepuesto (overlay) que encarna el tutorial inicial paso a paso de la PWA.
 * Orquesta un flujo didáctico guiando al usuario a través de la interfaz principal (transacciones, metas, analítica y pareja),
 * integrándose con el React Router para simular el desplazamiento interactivo.
 */
export default function OnboardingOverlay() {
  const { t } = useLocaleCurrency();
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
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        navigate('/transactions');
      }, 500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('show-onboarding', handleShowOnboarding);
      };
    }

    return () => window.removeEventListener('show-onboarding', handleShowOnboarding);
  }, [navigate]);

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

  if (!isVisible) return null;

  const steps = [
    {
      icon: <Wallet size={64} style={{ color: 'var(--blue)', marginBottom: '1.5rem' }} />,
      title: t('onboardingStep1Title'),
      desc: t('onboardingStep1Desc')
    },
    {
      icon: <PlusCircle size={64} style={{ color: '#fba9e2', marginBottom: '1.5rem' }} />,
      title: t('onboardingStep6Title'),
      desc: t('onboardingStep6Desc')
    },
    {
      icon: <Target size={64} style={{ color: '#10b981', marginBottom: '1.5rem' }} />,
      title: t('onboardingStep2Title'),
      desc: t('onboardingStep2Desc')
    },
    {
      icon: <BarChart2 size={64} style={{ color: '#f59e0b', marginBottom: '1.5rem' }} />,
      title: t('onboardingStep4Title'),
      desc: t('onboardingStep4Desc')
    },
    {
      icon: <Users size={64} style={{ color: '#a855f7', marginBottom: '1.5rem' }} />,
      title: t('onboardingStep3Title'),
      desc: t('onboardingStep3Desc')
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      padding: '1rem',
      paddingBottom: '3rem'
    }}>
      <div className="onboarding-modal" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        {/* Skip button */}
        <button
          onClick={handleFinish}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            color: 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <X size={24} />
        </button>

        {/* Content area */}
        <div style={{ padding: '3rem 2rem 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ height: '8rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
             {steps[currentStep].icon}
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
            {steps[currentStep].title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {steps[currentStep].desc}
          </p>

          {/* Dots */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: '0.5rem',
                  borderRadius: '9999px',
                  transition: 'all 0.3s ease',
                  width: currentStep === i ? '2rem' : '0.5rem',
                  backgroundColor: currentStep === i ? 'var(--blue)' : 'var(--border)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '1rem', marginTop: 'auto' }}>
          <button
            onClick={handleFinish}
            style={{
              flex: 1,
              padding: '0.875rem',
              borderRadius: '1rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {t('onboardingSkip')}
          </button>

          <button
            onClick={nextStep}
            className="kebo-button-primary"
            style={{
              flex: 1,
              padding: '0.875rem',
              borderRadius: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {currentStep === 4 ? t('onboardingFinish') : t('onboardingNext')}
            {currentStep !== 4 && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
