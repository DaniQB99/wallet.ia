import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTransactions } from '../entities/transactions/model/useTransactions';
import { useAccounts } from '../entities/accounts/model/useAccounts';
import { shiftReferenceDate, useAnalyticsStats, type AnalyticsPeriod } from '../features/analytics/model/useAnalyticsStats';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';
import { AnalyticsAccountFilter } from '../features/analytics/ui/AnalyticsAccountFilter';
import { ModernDonutChart } from '../features/analytics/ui/ModernDonutChart';

export default function Analytics() {
  const [searchParams] = useSearchParams();
  // Get initial view type from URL query, default to expense
  const [viewType, setViewType] = useState<'expense' | 'income'>(
    (searchParams.get('type') as 'expense' | 'income') || 'expense'
  );

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [period, setPeriod] = useState<AnalyticsPeriod>('year');
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);

  const { formatMoney, prefetchRates, locale, t, translateEntityName } = useLocaleCurrency();

  const periodLabels: Record<AnalyticsPeriod, string> = {
    week: t('week'),
    month: t('month'),
    year: t('year'),
  };

  const navigate = useNavigate();
  const { transactions, loading: txLoading } = useTransactions('all');
  const { accounts, loading: accLoading } = useAccounts();

  // Filtrar transacciones por cuenta si se seleccionó una específica
  const filteredTransactions = useMemo(() => {
    if (selectedAccountId === 'all') return transactions;
    return transactions.filter((t) => t.account_id === selectedAccountId);
  }, [transactions, selectedAccountId]);

  const { incomeTotal, expenseTotal, expenseCategories, incomeCategories } = useAnalyticsStats(
    filteredTransactions,
    period,
    referenceDate
  );

  const disableNext = shiftReferenceDate(referenceDate, period, 1) > new Date();

  useEffect(() => {
    if (filteredTransactions.length === 0) return;
    void prefetchRates(filteredTransactions.map((tx) => tx.date));
  }, [filteredTransactions, prefetchRates]);

  const netBalance = incomeTotal - expenseTotal;

  const getHeaderTitle = () => {
    if (period === 'year') return referenceDate.getFullYear().toString();
    if (period === 'month') return referenceDate.toLocaleString(locale || 'es', { month: 'long', year: 'numeric' });
    if (period === 'week') {
      const start = new Date(referenceDate);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const formatDay = (d: Date) => d.getDate().toString().padStart(2, '0');
      const formatMonth = (d: Date) => d.toLocaleString(locale || 'es', { month: 'short' }).toUpperCase();
      const formatYear = (d: Date) => d.getFullYear().toString().slice(-2);

      if (start.getMonth() === end.getMonth()) {
        return `${formatDay(start)} - ${formatDay(end)} ${formatMonth(start)} ${formatYear(start)}`;
      } else {
        return `${formatDay(start)} ${formatMonth(start)} - ${formatDay(end)} ${formatMonth(end)} ${formatYear(end)}`;
      }
    }
    return t('analytics');
  };

  const handleCategoryClick = (categoryId: string) => {
    let dateParam = '';
    let startParam = '';
    let endParam = '';

    if (period === 'year') {
      dateParam = referenceDate.getFullYear().toString();
    } else if (period === 'month') {
      const m = (referenceDate.getMonth() + 1).toString().padStart(2, '0');
      dateParam = `${referenceDate.getFullYear()}-${m}`;
    } else if (period === 'week') {
      const start = new Date(referenceDate);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      startParam = start.toISOString().split('T')[0];
      endParam = end.toISOString().split('T')[0];
    }

    const params = new URLSearchParams();
    if (categoryId) params.set('category', categoryId);
    if (dateParam) params.set('date', dateParam);
    if (startParam && endParam) {
      params.set('startDate', startParam);
      params.set('endDate', endParam);
    }
    if (viewType) params.set('flow', viewType);
    if (selectedAccountId && selectedAccountId !== 'all') {
      params.set('account', selectedAccountId);
    }

    // Actualizamos URL para preservar el tipo al volver atrás
    window.history.replaceState(null, '', `?type=${viewType}`);
    navigate(`/transactions?${params.toString()}`);
  };

  const currentCategories = viewType === 'expense' ? expenseCategories : incomeCategories;
  const currentTotal = viewType === 'expense' ? expenseTotal : incomeTotal;

  return (
    <>
      <Helmet>
        <title>{t('analytics')} - Wallet.ia</title>
        <meta name="description" content={t('analyticsMetaDesc')} />
      </Helmet>

      <div
        style={{
          padding: '16px 20px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
        }}
      >
        {/* Top bar */}
        <div
          className="page-header"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            padding: isDesktop ? '28px 0 20px' : '12px 0 0',
          }}
        >
          <div style={{ position: 'absolute', left: 0 }}>
            {!isDesktop && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                }}
                aria-label={t('back')}
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{t('analytics')}</h1>
          </div>
        </div>

        {/* Selector de periodo temporal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{getHeaderTitle()}</div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '4px',
            }}
          >
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                padding: '6px 28px 6px 12px',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
            >
              <option value="week" style={{ color: '#000' }}>
                {periodLabels.week}
              </option>
              <option value="month" style={{ color: '#000' }}>
                {periodLabels.month}
              </option>
              <option value="year" style={{ color: '#000' }}>
                {periodLabels.year}
              </option>
            </select>
            <div
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <ChevronRight size={14} style={{ transform: 'rotate(90deg)', color: 'var(--text-secondary)' }} />
            </div>
          </div>
        </div>

        {/* 1. Div del dinero (Balance total centrado) */}
        <div style={{ textAlign: 'center', margin: '4px 0 6px' }}>
          <div style={{ fontSize: '2.8rem', fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>
            {formatMoney(netBalance)}
          </div>
        </div>

        {/* 2. Desplegable de selección de cuenta (ancho completo, estilo nueva transacción) */}
        <AnalyticsAccountFilter
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
        />

        {/* 3. Div de los recuadros de gastos e ingresos con navegación de fecha */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setReferenceDate((prev) => shiftReferenceDate(prev, period, -1))}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              padding: '8px',
              flexShrink: 0,
            }}
            aria-label={t('previous')}
          >
            <ChevronLeft size={20} />
          </button>

          <div
            onClick={() => setViewType('expense')}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: viewType === 'expense' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {t('expense')}
            </div>
            <div style={{ fontWeight: 600, color: '#ef4444' }}>{formatMoney(expenseTotal)}</div>
          </div>

          <div
            onClick={() => setViewType('income')}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: viewType === 'income' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {t('income')}
            </div>
            <div style={{ fontWeight: 600, color: '#10b981' }}>{formatMoney(incomeTotal)}</div>
          </div>

          <button
            onClick={() => setReferenceDate((prev) => shiftReferenceDate(prev, period, 1))}
            disabled={disableNext}
            style={{
              background: 'transparent',
              border: 'none',
              color: disableNext ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)',
              cursor: disableNext ? 'default' : 'pointer',
              padding: '8px',
              flexShrink: 0,
            }}
            aria-label={t('next')}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 4. Gráfica Circular Moderna Donut */}
        <ModernDonutChart
          categories={currentCategories}
          total={currentTotal}
          viewType={viewType}
          onCategoryClick={handleCategoryClick}
          activeCategoryId={hoveredCategoryId}
          onHoverCategory={setHoveredCategoryId}
          loading={txLoading || accLoading}
        />

        {/* 5. Listado de categorías */}
        <div>
          {!txLoading && currentCategories.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              {currentCategories.map((item, index) => {
                const isHovered = hoveredCategoryId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleCategoryClick(item.id)}
                    onMouseEnter={() => setHoveredCategoryId(item.id)}
                    onMouseLeave={() => setHoveredCategoryId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      borderBottom:
                        index < currentCategories.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                      background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: `${item.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        marginRight: '14px',
                        border: `2px solid ${item.color}40`,
                        flexShrink: 0,
                        transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          color: isHovered ? '#ffffff' : 'var(--text-primary)',
                          marginBottom: '2px',
                        }}
                      >
                        {item.name === 'Sin categoría' || !item.name
                          ? t('noCategory')
                          : translateEntityName(item.name, 'category')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {item.movements} {t('transactionsCount')}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: isHovered ? item.color : '#fff',
                        flexShrink: 0,
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {formatMoney(item.total)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}