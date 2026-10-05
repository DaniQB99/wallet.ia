import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight, PieChart } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTransactions } from '../entities/transactions/model/useTransactions';
import { shiftReferenceDate, useAnalyticsStats, type AnalyticsPeriod } from '../features/analytics/model/useAnalyticsStats';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';

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
  const { formatMoney, prefetchRates, locale, t, translateEntityName } = useLocaleCurrency();

  const periodLabels: Record<AnalyticsPeriod, string> = {
    week: t('week'),
    month: t('month'),
    year: t('year'),
  };

  const navigate = useNavigate();
  const { transactions, loading } = useTransactions('all');
  const { incomeTotal, expenseTotal, expenseCategories, incomeCategories } = useAnalyticsStats(transactions, period, referenceDate);

  const disableNext = shiftReferenceDate(referenceDate, period, 1) > new Date();

  useEffect(() => {
    if (transactions.length === 0) return;
    void prefetchRates(transactions.map((tx) => tx.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length, period, referenceDate]);

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
    if (period === 'year') {
      dateParam = referenceDate.getFullYear().toString();
    } else if (period === 'month') {
      const m = (referenceDate.getMonth() + 1).toString().padStart(2, '0');
      dateParam = `${referenceDate.getFullYear()}-${m}`;
    }

    let url = `/transactions?category=${categoryId}`;
    if (dateParam) url += `&date=${dateParam}`;
    
    // We update the URL to reflect the state so navigating back restores it.
    window.history.replaceState(null, '', `?type=${viewType}`);
    navigate(url);
  };

  const currentCategories = viewType === 'expense' ? expenseCategories : incomeCategories;
  const currentTotal = viewType === 'expense' ? expenseTotal : incomeTotal;

  // --- Donut chart SVG data ---
  const donutSegments = useMemo(() => {
    const total = currentCategories.reduce((sum, c) => sum + c.total, 0);
    if (total === 0) return [];

    // Sort categories so items with the same color are spread apart
    const sorted = [...currentCategories];
    const colorGroups = new Map<string, typeof sorted>();
    sorted.forEach(c => {
      const group = colorGroups.get(c.color) || [];
      group.push(c);
      colorGroups.set(c.color, group);
    });

    // Interleave: pick one from each color group in round-robin
    const interleaved: typeof sorted = [];
    const groups = Array.from(colorGroups.values());
    let maxLen = Math.max(...groups.map(g => g.length));
    for (let i = 0; i < maxLen; i++) {
      for (const group of groups) {
        if (i < group.length) interleaved.push(group[i]);
      }
    }

    const radius = 80;
    const cx = 100;
    const cy = 100;
    let cumulative = 0;

    return interleaved.map(cat => {
      const fraction = cat.total / total;
      const startAngle = cumulative * 2 * Math.PI;
      cumulative += fraction;
      const endAngle = cumulative * 2 * Math.PI;

      const gap = currentCategories.length > 1 ? 0.02 : 0; // small gap between segments
      const adjustedStart = startAngle + gap;
      const adjustedEnd = endAngle - gap;

      const x1 = cx + radius * Math.cos(adjustedStart - Math.PI / 2);
      const y1 = cy + radius * Math.sin(adjustedStart - Math.PI / 2);
      const x2 = cx + radius * Math.cos(adjustedEnd - Math.PI / 2);
      const y2 = cy + radius * Math.sin(adjustedEnd - Math.PI / 2);

      const largeArc = (adjustedEnd - adjustedStart) > Math.PI ? 1 : 0;

      return {
        ...cat,
        fraction,
        d: currentCategories.length === 1
          ? `M ${cx},${cy - radius} A ${radius},${radius} 0 1,1 ${cx - 0.001},${cy - radius}`
          : `M ${cx},${cy} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`,
      };
    });
  }, [currentCategories]);

  return (
    <>
      <Helmet>
        <title>{t('analytics')} - Wallet.ia</title>
        <meta name="description" content={t('analyticsMetaDesc')} />
      </Helmet>

      <div style={{ padding: '16px 20px 80px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100vh', background: 'var(--bg-primary)' }}>

        {/* Top bar */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: isDesktop ? '28px 0 20px' : '12px 0 0' }}>
          <div style={{ position: 'absolute', left: 0 }}>
            {!isDesktop && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}
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

        {/* Year / period selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {getHeaderTitle()}
          </div>

          <div style={{ position: 'relative', display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '4px' }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
              style={{ background: 'transparent', border: 'none', color: '#fff', padding: '6px 28px 6px 12px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' }}
            >
              <option value="week" style={{ color: '#000' }}>{periodLabels.week}</option>
              <option value="month" style={{ color: '#000' }}>{periodLabels.month}</option>
              <option value="year" style={{ color: '#000' }}>{periodLabels.year}</option>
            </select>
            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <ChevronRight size={14} style={{ transform: 'rotate(90deg)', color: 'var(--text-secondary)' }} />
            </div>
          </div>
        </div>

        {/* Total balance centered */}
        <div style={{ textAlign: 'center', margin: '4px 0 16px' }}>
          <div style={{ fontSize: '2.8rem', fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>
            {formatMoney(netBalance)}
          </div>
        </div>

        {/* Income / Expense cards with navigation */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setReferenceDate((prev) => shiftReferenceDate(prev, period, -1))}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '8px', flexShrink: 0 }}
          >
            <ChevronLeft size={20} />
          </button>

          <div 
            onClick={() => setViewType('expense')}
            style={{ flex: 1, background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: viewType === 'expense' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.04)', cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('expense')}</div>
            <div style={{ fontWeight: 600, color: '#ef4444' }}>{formatMoney(expenseTotal)}</div>
          </div>

          <div 
            onClick={() => setViewType('income')}
            style={{ flex: 1, background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: viewType === 'income' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.04)', cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('income')}</div>
            <div style={{ fontWeight: 600, color: '#10b981' }}>{formatMoney(incomeTotal)}</div>
          </div>

          <button
            onClick={() => setReferenceDate((prev) => shiftReferenceDate(prev, period, 1))}
            disabled={disableNext}
            style={{ background: 'transparent', border: 'none', color: disableNext ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)', cursor: disableNext ? 'default' : 'pointer', padding: '8px', flexShrink: 0 }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Donut Chart */}
        <div style={{ background: '#13111A', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
            <div className="loading-text" style={{ padding: '60px 0' }}>{t('loadingModule')}</div>
          ) : donutSegments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
              <PieChart size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
              <div style={{ fontSize: '0.85rem' }}>{t('noDataForPeriod')}</div>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
              <svg viewBox="0 0 200 200" width="200" height="200">
                {donutSegments.map((seg, i) => (
                  <path
                    key={i}
                    d={seg.d}
                    fill={seg.color}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onClick={() => handleCategoryClick(seg.id)}
                  />
                ))}
                {/* Inner circle for donut effect */}
                <circle cx="100" cy="100" r="50" fill="#13111A" />
              </svg>
              {/* Center text */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  {formatMoney(currentTotal)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {viewType === 'expense' ? t('expense') : t('income')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category list */}
        <div>
          {!loading && currentCategories.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '24px', overflow: 'hidden' }}>
              {currentCategories.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleCategoryClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderBottom: index < currentCategories.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{
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
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {item.name === 'Sin categoría' || !item.name
                        ? t('noCategory')
                        : translateEntityName(item.name, 'category')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {item.movements} {t('transactionsCount')}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                    {formatMoney(item.total)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}