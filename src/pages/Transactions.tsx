import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Plus, Search, X, Wallet, CalendarDays, Tag, ArrowUpDown, ChevronLeft } from 'lucide-react';

import { useTransactions } from '../entities/transactions/model/useTransactions';
import { useCategories } from '../entities/categories/model/useCategories';
import { useAccounts } from '../entities/accounts/model/useAccounts';
import type { Transaction, TransactionType } from '../shared/types/database';
import TransactionModal from '../features/transactions/ui/TransactionModal';
import { useLocaleCurrency } from '../app/providers/LocaleCurrencyContext';
import { TransactionItem } from '@/features/transactions/ui/TransactionItem';

/**
 * Vista central de Movimientos Financieros (Transacciones).
 * Presenta un listado cronológico de ingresos y gastos, agrupado visualmente por mes temporal.
 * Expone potentes controles de filtrado (por cuenta, categoría, fecha, tipo de flujo y buscador de texto)
 * y delega en un modal subyacente la inserción o actualización de cada registro contable.
 */
export default function Transactions() {
  const { formatMoney, formatDate, prefetchRates, t, translateEntityName } = useLocaleCurrency();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<TransactionType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [filterAccount, setFilterAccount] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterFlow, setFilterFlow] = useState<'all' | 'expense' | 'income'>('all');
  const [showFilterAccount, setShowFilterAccount] = useState(false);
  const [showFilterCategory, setShowFilterCategory] = useState(false);
  const [showFilterMonth, setShowFilterMonth] = useState(false);
  const [showFilterFlow, setShowFilterFlow] = useState(false);

  const { transactions, loading: txLoading } = useTransactions(tab === 'all' ? 'all' : tab);
  const { accounts } = useAccounts();
  const { categories: personalCats } = useCategories('personal');
  const { categories: sharedCats } = useCategories('shared');
  const allCategories = [...personalCats, ...sharedCats];

  useEffect(() => {
    const addParam = searchParams.get('add');
    const editParam = searchParams.get('edit');
    const catParam = searchParams.get('category');
    const dateParam = searchParams.get('date');

    let shouldUpdateParams = false;
    const newParams = new URLSearchParams(searchParams);

    if (catParam) {
      setFilterCategory(catParam);
      newParams.delete('category');
      shouldUpdateParams = true;
    }
    
    if (dateParam) {
      setFilterMonth(dateParam);
      newParams.delete('date');
      shouldUpdateParams = true;
    }

    if (addParam === 'true') {
      setShowModal(true);
      newParams.delete('add');
      shouldUpdateParams = true;
    } else if (editParam) {
      const txToEdit = transactions.find(t => t.id === editParam);
      if (txToEdit) {
        setEditTx(txToEdit);
        setShowModal(true);
        newParams.delete('edit');
        shouldUpdateParams = true;
      }
    }

    if (shouldUpdateParams) {
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, transactions]);

  const clearFilters = () => {
    setFilterAccount('');
    setFilterCategory('');
    setFilterMonth('');
    setFilterFlow('all');
  };

  const toggleFilter = (filter: 'account' | 'category' | 'month' | 'flow') => {
    setShowFilterAccount(filter === 'account' ? !showFilterAccount : false);
    setShowFilterCategory(filter === 'category' ? !showFilterCategory : false);
    setShowFilterMonth(filter === 'month' ? !showFilterMonth : false);
    setShowFilterFlow(filter === 'flow' ? !showFilterFlow : false);
  };

  const hasFilters = filterAccount || filterCategory || filterMonth || filterFlow !== 'all';

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterAccount && t.account_id !== filterAccount) return false;
        if (filterCategory && t.category_id !== filterCategory) return false;
        if (filterMonth) {
          const txDateStr = new Date(t.date).toISOString();
          if (!txDateStr.startsWith(filterMonth)) return false;
        }
        if (filterFlow === 'expense' && t.amount >= 0) return false;
        if (filterFlow === 'income' && t.amount < 0) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, filterAccount, filterCategory, filterMonth, filterFlow]);

  useEffect(() => {
    void prefetchRates(filtered.map((tx) => tx.date));
  }, [filtered, prefetchRates]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(tx => {
      const key = formatDate(tx.date, { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [filtered, formatDate]);

  // Obtener meses disponibles
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(tx => {
      months.add(new Date(tx.date).toISOString().slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const formatMonthLabel = (m: string) => {
    const d = new Date(m + '-01');
    return formatDate(d, { month: 'long', year: 'numeric' });
  };

  const handleEdit = (tx: Transaction) => {
    setEditTx(tx);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditTx(null);
  };

  const selectedAccount = accounts.find(a => a.id === filterAccount);
  const selectedCatFilter = allCategories.find(c => c.id === filterCategory);

  return (
    <>
      <Helmet>
        <title>{t('transactions')} - Wallet.ia</title>
        <meta name="description" content={t('transactionsMetaDesc')} />
      </Helmet>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', left: isDesktop ? '36px' : '20px' }}>
          {!isDesktop && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#fff', cursor: 'pointer', flexShrink: 0 }}
              aria-label={t('back')}
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{t('transactions')}</h1>
        </div>
      </div>

      <div className="page-content" style={{ width: '100%' }}>
        <div
          className="tx-filter-bar"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: isDesktop ? 'visible' : 'auto',
            paddingBottom: '12px',
            marginBottom: '16px',
            flexWrap: 'nowrap',
            width: '100%',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {hasFilters && (
            <button className="tx-filter-chip-clear" onClick={clearFilters} style={{ flexShrink: 0 }}>
              <X size={14} />
            </button>
          )}

          <button
            className={`tx-filter-chip ${filterAccount ? 'active' : ''}`}
            onClick={() => toggleFilter('account')}
            style={isDesktop ? { flex: 1, justifyContent: 'center' } : {}}
          >
            <Wallet size={14} />
            {selectedAccount ? translateEntityName(selectedAccount.name, 'account') : t('account')}
          </button>

          <button
            className={`tx-filter-chip ${filterMonth ? 'active' : ''}`}
            onClick={() => toggleFilter('month')}
            style={isDesktop ? { flex: 1, justifyContent: 'center' } : {}}
          >
            <CalendarDays size={14} />
            {filterMonth ? formatMonthLabel(filterMonth) : t('month')}
          </button>

          <button
            className={`tx-filter-chip ${filterCategory ? 'active' : ''}`}
            onClick={() => toggleFilter('category')}
            style={isDesktop ? { flex: 1, justifyContent: 'center' } : {}}
          >
            <Tag size={14} />
            {selectedCatFilter ? `${selectedCatFilter.icon} ${translateEntityName(selectedCatFilter.name, 'category')}` : t('category')}
          </button>

          <button
            className={`tx-filter-chip ${filterFlow !== 'all' ? 'active' : ''}`}
            onClick={() => toggleFilter('flow')}
            style={isDesktop ? { flex: 1, justifyContent: 'center' } : {}}
          >
            <ArrowUpDown size={14} />
            {filterFlow === 'expense' ? t('expense') : filterFlow === 'income' ? t('income') : t('type')}
          </button>
        </div>

        {(showFilterAccount || showFilterMonth || showFilterCategory || showFilterFlow) && (
          <div className="card" style={{ marginBottom: '16px', marginTop: '-8px', padding: '8px', zIndex: 100, maxHeight: '220px', overflowY: 'auto' }}>
            {showFilterAccount && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className="kebo-filter-option" onClick={() => { setFilterAccount(''); setShowFilterAccount(false); }}>
                  {t('allAccounts')}
                </button>
                {accounts.map(acc => (
                  <button key={acc.id} className={`kebo-filter-option ${filterAccount === acc.id ? 'active' : ''}`}
                    onClick={() => { setFilterAccount(acc.id); setShowFilterAccount(false); }}>
                    {acc.icon} {translateEntityName(acc.name, 'account')}
                    <span style={{ marginLeft: 'auto', color: 'var(--accent-primary-hover)', fontSize: '0.8rem' }}>
                      {formatMoney(acc.balance)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showFilterMonth && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className="kebo-filter-option" onClick={() => { setFilterMonth(''); setShowFilterMonth(false); }}>
                  {t('allMonths')}
                </button>
                {availableMonths.map(m => (
                  <button key={m} className={`kebo-filter-option ${filterMonth === m ? 'active' : ''}`}
                    onClick={() => { setFilterMonth(m); setShowFilterMonth(false); }}>
                    {formatMonthLabel(m)}
                  </button>
                ))}
              </div>
            )}

            {showFilterCategory && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className="kebo-filter-option" onClick={() => { setFilterCategory(''); setShowFilterCategory(false); }}>
                  {t('allCategories')}
                </button>
                {allCategories.map(cat => (
                  <button key={cat.id} className={`kebo-filter-option ${filterCategory === cat.id ? 'active' : ''}`}
                    onClick={() => { setFilterCategory(cat.id); setShowFilterCategory(false); }}>
                    {cat.icon} {translateEntityName(cat.name, 'category')}
                  </button>
                ))}
              </div>
            )}

            {showFilterFlow && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className={`kebo-filter-option ${filterFlow === 'all' ? 'active' : ''}`}
                  onClick={() => { setFilterFlow('all'); setShowFilterFlow(false); }}>
                  {t('all')}
                </button>
                <button className={`kebo-filter-option ${filterFlow === 'expense' ? 'active' : ''}`}
                  onClick={() => { setFilterFlow('expense'); setShowFilterFlow(false); }}>
                  {t('expense')}
                </button>
                <button className={`kebo-filter-option ${filterFlow === 'income' ? 'active' : ''}`}
                  onClick={() => { setFilterFlow('income'); setShowFilterFlow(false); }}>
                  {t('income')}
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="toggle-group" style={{ flex: '1 1 auto' }}>
            {(['all', 'personal', 'shared'] as const).map(tabKey => (
              <button key={tabKey} className={`toggle-item ${tab === tabKey ? 'active' : ''}`} onClick={() => setTab(tabKey)}>
                {tabKey === 'all'
                  ? t('filterAll')
                  : tabKey === 'personal'
                    ? t('filterPersonal')
                    : t('filterShared')}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search')}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        <div>
          {txLoading ? (
            <div className="card empty-state">
              <div className="loading-spinner" />
              <div className="loading-text">{t('loadingTransactions')}</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">💸</div>
              <div className="empty-state-title">{t('noTransactions')}</div>
              <div className="empty-state-desc" style={{ marginBottom: 16 }}>{t('noTransactionsMatching')}</div>
              <button className="kebo-button-primary" style={{ display: 'flex', alignItems: 'center' }} onClick={() => setShowModal(true)}>
                <Plus size={18} style={{ marginRight: 8 }} /> {t('addTransactionBtn')}
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([month, txs]) => (
              <div key={month} style={{ marginBottom: '24px' }}>
                <div className="tx-month-header">{month}</div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="transaction-list">
                    {txs.map(tx => (
                      <TransactionItem
                        key={tx.id}
                        tx={tx}
                        onClick={() => handleEdit(tx)}
                        showChevron
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <TransactionModal
        open={showModal}
        onClose={handleCloseModal}
        editTransaction={editTx}
      />
    </>
  );
}
