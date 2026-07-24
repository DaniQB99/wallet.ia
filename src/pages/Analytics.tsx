import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../entities/transactions/model/useTransactions';
import { shiftReferenceDate, useAnalyticsStats, type AnalyticsPeriod } from '../features/analytics/model/useAnalyticsStats';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';

/**
 * Vista Analítica de Finanzas (Dashboard de gráficos e informes).
 * Interpreta las transacciones del usuario, calculando y comparando el balance total de
 * ingresos frente a gastos a lo largo de un marco temporal dinámico y pivotable (Semana, Mes, Año).
 * Extrae y desglosa todos los movimientos agrupados por categoría, ilustrando los sumideros principales de liquidez.
 */
export default function Analytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const { formatMoney, prefetchRates, locale, t } = useLocaleCurrency();
  const periodLabels: Record<AnalyticsPeriod, string> = {
    week: t('week'),
    month: t('month'),
    year: t('year'),
  };
  const navigate = useNavigate();
  const { transactions, loading } = useTransactions('all');
  const { incomeTotal, expenseTotal, categories, rangeStart, rangeEnd } = useAnalyticsStats(transactions, period, referenceDate);

  const maxBarValue = useMemo(() => Math.max(incomeTotal, expenseTotal, 1), [incomeTotal, expenseTotal]);

  const rangeLabel = `${rangeStart.toLocaleDateString(locale)} - ${rangeEnd.toLocaleDateString(locale)}`;
  const disableNext = shiftReferenceDate(referenceDate, period, 1) > new Date();
  useEffect(() => {
    if (transactions.length === 0) return;
    void prefetchRates(transactions.map((tx) => tx.date));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length, period, referenceDate]);

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('analytics')}</h1>
          <p>{rangeLabel}</p>
        </div>
      </div>

      <div className="page-content">
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{`${t('income')} vs ${t('expense')}`}</div>
              <div className="card-subtitle">Filtrado por {periodLabels[period].toLowerCase()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setReferenceDate((prev) => shiftReferenceDate(prev, period, -1))} aria-label="Periodo anterior">
                <ChevronLeft size={16} />
              </button>
              <BarChart3 size={20} />
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setReferenceDate((prev) => shiftReferenceDate(prev, period, 1))} aria-label="Periodo siguiente" disabled={disableNext}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="toggle-group" style={{ marginBottom: '20px' }}>
            {(Object.keys(periodLabels) as AnalyticsPeriod[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`toggle-item ${period === key ? 'active' : ''}`}
                onClick={() => setPeriod(key)}
              >
                {periodLabels[key]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-text">{t('loadingModule')}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('income')}</div>
                <div style={{ height: '12px', background: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(incomeTotal / maxBarValue) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10B981, #34D399)',
                    }}
                  />
                </div>
                <div style={{ marginTop: '8px', fontWeight: 700 }}>{formatMoney(incomeTotal)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('expense')}</div>
                <div style={{ height: '12px', background: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(expenseTotal / maxBarValue) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #EF4444, #F97316)',
                    }}
                  />
                </div>
                <div style={{ marginTop: '8px', fontWeight: 700 }}>{formatMoney(expenseTotal)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t('category')}s (de mayor a menor)</div>
              <div className="card-subtitle">Importe total y movimientos del periodo</div>
            </div>
          </div>

          {loading ? (
            <div className="loading-text">{t('loadingModule')}</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No hay datos suficientes</div>
              <div className="empty-state-desc" style={{ marginBottom: 16 }}>Añade transacciones para poder ver el análisis de tus gastos.</div>
              <button className="kebo-button-primary" onClick={() => navigate('/transactions')}>
                Ir a transacciones
              </button>
            </div>
          ) : (
            <div className="transaction-list">
              {categories.map((item) => (
                <div key={item.id} className="transaction-item">
                  <div className="transaction-icon">{item.icon}</div>
                  <div className="transaction-info">
                    <div className="transaction-desc">{item.name}</div>
                    <div className="transaction-meta">{item.movements} movimientos</div>
                  </div>
                  <div className="transaction-amount expense">{formatMoney(item.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
