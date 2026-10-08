import React, { useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperCore } from 'swiper';
import { EffectCreative } from 'swiper/modules';

// Estilos de Swiper para transiciones 3D fluidas
import 'swiper/css';
import 'swiper/css/effect-creative';

import {
  Settings,
  Users,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ArrowUpDown
} from 'lucide-react';
import type { Account } from '../../../shared/types/database';
import { useLocaleCurrency, type SupportedCurrency } from '../../../app/providers/LocaleCurrencyContext';
import { useAccounts } from '../model/useAccounts';
import ReorderCardsModal from './ReorderCardsModal';
import { sanitizeEmoji } from '../../../shared/lib/emoji';

interface BankCardCarouselProps {
  accounts: Account[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onEditAccount: (accountId: string) => void;
  onAddAccount: () => void;
}

/**
 * BankCardCarousel
 * Carrusel de tarjetas bancarias estilo banca moderna de alta gama.
 * Utiliza Swiper con EffectCreative para gestos táctiles y transiciones 3D realistas entre tarjetas.
 * Presenta el saldo desplazado a la derecha, badge de ámbito (Personal/Compartida) en la esquina inferior derecha
 * y sincronización bidireccional con la paginación de puntos y controles de navegación.
 */
export default function BankCardCarousel({
  accounts,
  selectedIndex,
  onSelectIndex,
  onEditAccount,
  onAddAccount,
}: BankCardCarouselProps) {
  const { formatMoney, t, translateEntityName } = useLocaleCurrency();
  const swiperRef = useRef<SwiperCore | null>(null);
  const { reorderAccounts } = useAccounts();
  const [showReorderModal, setShowReorderModal] = useState(false);

  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wallet_hide_card_balance') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHideBalance = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBalanceHidden(prev => {
      const next = !prev;
      try {
        localStorage.setItem('wallet_hide_card_balance', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Sincronizar posición de Swiper cuando selectedIndex cambie externamente
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.activeIndex !== selectedIndex) {
      swiperRef.current.slideTo(selectedIndex);
    }
  }, [selectedIndex]);

  // Si no hay cuentas, mostramos la tarjeta vacía para crear
  if (accounts.length === 0) {
    return (
      <div className="bank-card-carousel" style={{ width: '100%', maxWidth: '480px', margin: '0 auto 20px auto' }}>
        <div
          onClick={onAddAccount}
          style={{
            width: '100%',
            minHeight: '200px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '2px dashed rgba(99, 102, 241, 0.4)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '24px',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
            transition: 'transform 0.2s ease, border-color 0.2s ease',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '12px',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Plus size={28} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', marginBottom: '4px' }}>
            {t('addAccount') || 'Añadir cuenta'}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            {t('createFirstCardDesc') || 'Crea tu primera tarjeta o cuenta bancaria'}
          </span>
        </div>
      </div>
    );
  }

  // Total de elementos = cuentas + 1 tarjeta final para añadir nueva cuenta
  const totalSlides = accounts.length + 1;

  const canSlidePrev = selectedIndex > 0;
  const canSlideNext = selectedIndex < totalSlides - 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canSlidePrev) return;
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    } else {
      onSelectIndex(selectedIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canSlideNext) return;
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    } else {
      onSelectIndex(selectedIndex + 1);
    }
  };

  return (
    <div className="bank-card-carousel" style={{ width: '100%', maxWidth: '480px', margin: '0 auto 20px auto' }}>
      {/* Contenedor relativo enfocado exclusivamente en la tarjeta para centrar las flechas */}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Contenedor del Carrusel con Swiper */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '200px',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
          }}
        >
        <Swiper
          modules={[EffectCreative]}
          effect="creative"
          grabCursor={true}
          speed={380}
          initialSlide={selectedIndex}
          creativeEffect={{
            prev: {
              shadow: false,
              translate: ['-100%', 0, -180],
              rotate: [0, 0, -4],
              opacity: 0.35,
            },
            next: {
              shadow: false,
              translate: ['100%', 0, 0],
              opacity: 1,
            },
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            onSelectIndex(swiper.activeIndex);
          }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '24px',
          }}
        >
          {/* Tarjetas de cuentas registradas */}
          {accounts.map((account) => {
            const cardBg = account.color || '#6366F1';

            return (
              <SwiperSlide key={account.id} style={{ borderRadius: '24px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    borderRadius: '24px',
                    padding: '22px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: `linear-gradient(135deg, ${cardBg}ee 0%, rgba(15, 23, 42, 0.92) 80%, rgba(10, 15, 30, 0.98) 100%)`,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.3)`,
                    userSelect: 'none',
                  }}
                >
                  {/* Reflejos Liquid Glass 3D */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-40%',
                      right: '-20%',
                      width: '260px',
                      height: '260px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-30%',
                      left: '-10%',
                      width: '220px',
                      height: '220px',
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${cardBg}40 0%, rgba(0,0,0,0) 70%)`,
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Fila Superior: Nombre de Cuenta y Botón Engranaje (⚙️) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{sanitizeEmoji(account.icon, '🏦')}</span>
                      <span
                        style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {translateEntityName(account.name, 'account')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Botón de Reordenar Tarjetas (si hay más de 1 tarjeta) */}
                      {accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReorderModal(true);
                          }}
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease, background 0.2s ease',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                          }}
                          aria-label={t('reorderCards')}
                          title={t('reorderCards')}
                        >
                          <ArrowUpDown size={17} />
                        </button>
                      )}

                      {/* Botón de Visibilidad (Ojo para ocultar / mostrar saldo) */}
                      <button
                        type="button"
                        onClick={toggleHideBalance}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease, background 0.2s ease',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                        }}
                        aria-label={isBalanceHidden ? t('showBalance') : t('hideBalance')}
                        title={isBalanceHidden ? t('showBalance') : t('hideBalance')}
                      >
                        {isBalanceHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>

                      {/* Botón de Engranaje para editar */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAccount(account.id);
                        }}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease, background 0.2s ease',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                        }}
                        aria-label={t('editAccount')}
                        title={t('editAccount')}
                      >
                        <Settings size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Fila Central: Saldo disponible protagonista desplazado hacia la derecha */}
                  <div style={{ margin: '14px 0', paddingLeft: '18px', zIndex: 2 }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px',
                      }}
                    >
                      {t('available')}
                    </div>
                    <div
                      style={{
                        fontSize: '2.2rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '-0.02em',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        lineHeight: 1.1,
                        filter: isBalanceHidden ? 'blur(10px)' : 'none',
                        transition: 'filter 0.25s ease',
                        userSelect: isBalanceHidden ? 'none' : 'text',
                      }}
                    >
                      {formatMoney(account.balance || 0, undefined, account.currency as SupportedCurrency)}
                    </div>
                  </div>

                  {/* Fila Inferior: Badge Personal / Compartida desplazado a la derecha en lugar del número de tarjeta */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 2 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.14)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.22)',
                        fontSize: '0.8rem',
                        color: '#ffffff',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {account.scope === 'shared' ? (
                        <>
                          <Users size={14} style={{ color: '#a5b4fc' }} />
                          <span>{t('sharedLabelLong')}</span>
                        </>
                      ) : (
                        <>
                          <User size={14} style={{ color: '#86efac' }} />
                          <span>{t('personalLabel')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}

          {/* Tarjeta final para crear una nueva cuenta */}
          <SwiperSlide key="add-new-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
            <div
              onClick={onAddAccount}
              style={{
                width: '100%',
                minHeight: '200px',
                borderRadius: '24px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '2px dashed rgba(255, 255, 255, 0.22)',
                userSelect: 'none',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  marginBottom: '12px',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
                }}
              >
                <Plus size={26} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>
                {t('addCardOrAccount') || 'Añadir tarjeta o cuenta'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                {t('registerAccountDesc') || 'Registra una cuenta personal o compartida'}
              </span>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>

      {/* Flechas de navegación centradas matemáticamente sobre la tarjeta */}
      {totalSlides > 1 && (
        <>
          {canSlidePrev && (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: '-14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(20, 24, 38, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
              aria-label={t('previousCard') || 'Tarjeta anterior'}
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {canSlideNext && (
            <button
              type="button"
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '-14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(20, 24, 38, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
              aria-label={t('nextCard') || 'Tarjeta siguiente'}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </>
      )}
      </div>

      {/* Indicadores de paginación (dots interactivos tipo banking app) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '16px',
        }}
      >
        {Array.from({ length: totalSlides }).map((_, idx) => {
          const isSelected = selectedIndex === idx;
          const targetColor =
            idx < accounts.length ? accounts[idx].color || 'var(--accent-primary)' : 'var(--accent-primary)';

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (swiperRef.current) {
                  swiperRef.current.slideTo(idx);
                }
                onSelectIndex(idx);
              }}
              style={{
                width: isSelected ? '26px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: isSelected ? targetColor : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? `0 0 10px ${targetColor}80` : 'none',
              }}
              aria-label={`${t('account') || 'Tarjeta'} ${idx + 1}`}
            />
          );
        })}
      </div>

      {/* Modal para Reordenar Tarjetas al antojo del usuario */}
      {showReorderModal && (
        <ReorderCardsModal
          isOpen={showReorderModal}
          onClose={() => setShowReorderModal(false)}
          accounts={accounts}
          onSave={async (reordered) => {
            const currentAccount = accounts[selectedIndex];
            await reorderAccounts(reordered);
            if (currentAccount) {
              const newIdx = reordered.findIndex((a) => a.id === currentAccount.id);
              if (newIdx !== -1) {
                onSelectIndex(newIdx);
                if (swiperRef.current) {
                  swiperRef.current.slideTo(newIdx, 0);
                }
              }
            }
          }}
        />
      )}
    </div>
  );
}
