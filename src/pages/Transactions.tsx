import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, X, Wallet, CalendarDays, Tag, ArrowUpDown, ChevronRight } from 'lucide-react';

import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useAccounts } from '../hooks/useAccounts';
import type { Transaction, TransactionType } from '../types/database';
import TransactionModal from '../components/TransactionModal';

export default function Transactions() {

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<TransactionType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  // Filters
  const [filterAccount, setFilterAccount] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterFlow, setFilterFlow] = useState<'all' | 'expense' | 'income'>('all');
  const [showFilterAccount, setShowFilterAccount] = useState(false);
  const [showFilterCategory, setShowFilterCategory] = useState(false);
  const [showFilterMonth, setShowFilterMonth] = useState(false);
  const [showFilterFlow, setShowFilterFlow] = useState(false);

  // Hooks
  const { transactions, loading: txLoading } = useTransactions(tab === 'all' ? 'all' : tab);
  const { accounts } = useAccounts();
  const { categories: personalCats } = useCategories('personal');
  const { categories: sharedCats } = useCategories('shared');
  const allCategories = [...personalCats, ...sharedCats];

  useEffect(() => {
    const addParam = searchParams.get('add');
    const editParam = searchParams.get('edit');

    if (addParam === 'true') {
      setShowModal(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('add');
      setSearchParams(newParams, { replace: true });
    } else if (editParam) {
      const txToEdit = transactions.find(t => t.id === editParam);
      if (txToEdit) {
        setEditTx(txToEdit);
        setShowModal(true);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('edit');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, transactions]);

  const clearFilters = () => {
    setFilterAccount('');
    setFilterCategory('');
    setFilterMonth('');
    setFilterFlow('all');
  };

  const hasFilters = filterAccount || filterCategory || filterMonth || filterFlow !== 'all';

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterAccount && t.account_id !== filterAccount) return false;
        if (filterCategory && t.category_id !== filterCategory) return false;
        if (filterMonth) {
          const txMonth = new Date(t.date).toISOString().slice(0, 7);
          if (txMonth !== filterMonth) return false;
        }
        if (filterFlow === 'expense' && t.amount >= 0) return false;
        if (filterFlow === 'income' && t.amount < 0) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, filterAccount, filterCategory, filterMonth, filterFlow]);

  // Group by month
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(tx => {
      const key = new Date(tx.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [filtered]);

  // Get available months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(tx => {
      months.add(new Date(tx.date).toISOString().slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const formatMonthLabel = (m: string) => {
    const d = new Date(m + '-01');
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
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
      <div className="page-header">
        <div className="page-header-left">
          <h1>Mis transacciones</h1>
          <p>Gestiona tus movimientos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTx(null); setShowModal(true); }}>
          <Plus size={18} />
          Nueva
        </button>
      </div>

      <div className="page-content">
        {/* Filter Chips */}
        <div className="tx-filter-bar" style={{ marginBottom: '16px' }}>
          {hasFilters && (
            <button className="tx-filter-chip-clear" onClick={clearFilters}>
              <X size={14} />
            </button>
          )}

          {/* Account filter */}
          <div style={{ position: 'relative' }}>
            <button
              className={`tx-filter-chip ${filterAccount ? 'active' : ''}`}
              onClick={() => setShowFilterAccount(!showFilterAccount)}
            >
              <Wallet size={14} />
              {selectedAccount ? selectedAccount.name : 'Cuenta'}
            </button>
            {showFilterAccount && (
              <div className="kebo-filter-dropdown">
                <button className="kebo-filter-option" onClick={() => { setFilterAccount(''); setShowFilterAccount(false); }}>
                  Todas las cuentas
                </button>
                {accounts.map(acc => (
                  <button key={acc.id} className={`kebo-filter-option ${filterAccount === acc.id ? 'active' : ''}`}
                    onClick={() => { setFilterAccount(acc.id); setShowFilterAccount(false); }}>
                    {acc.icon} {acc.name}
                    <span style={{ marginLeft: 'auto', color: 'var(--accent-primary-hover)', fontSize: '0.8rem' }}>
                      €{acc.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Month filter */}
          <div style={{ position: 'relative' }}>
            <button
              className={`tx-filter-chip ${filterMonth ? 'active' : ''}`}
              onClick={() => setShowFilterMonth(!showFilterMonth)}
            >
              <CalendarDays size={14} />
              {filterMonth ? formatMonthLabel(filterMonth) : 'Mes'}
            </button>
            {showFilterMonth && (
              <div className="kebo-filter-dropdown">
                <button className="kebo-filter-option" onClick={() => { setFilterMonth(''); setShowFilterMonth(false); }}>
                  Todos los meses
                </button>
                {availableMonths.map(m => (
                  <button key={m} className={`kebo-filter-option ${filterMonth === m ? 'active' : ''}`}
                    onClick={() => { setFilterMonth(m); setShowFilterMonth(false); }}>
                    {formatMonthLabel(m)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category filter */}
          <div style={{ position: 'relative' }}>
            <button
              className={`tx-filter-chip ${filterCategory ? 'active' : ''}`}
              onClick={() => setShowFilterCategory(!showFilterCategory)}
            >
              <Tag size={14} />
              {selectedCatFilter ? `${selectedCatFilter.icon} ${selectedCatFilter.name}` : 'Categoría'}
            </button>
            {showFilterCategory && (
              <div className="kebo-filter-dropdown">
                <button className="kebo-filter-option" onClick={() => { setFilterCategory(''); setShowFilterCategory(false); }}>
                  Todas las categorías
                </button>
                {allCategories.map(cat => (
                  <button key={cat.id} className={`kebo-filter-option ${filterCategory === cat.id ? 'active' : ''}`}
                    onClick={() => { setFilterCategory(cat.id); setShowFilterCategory(false); }}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Flow filter */}
          <div style={{ position: 'relative' }}>
            <button
              className={`tx-filter-chip ${filterFlow !== 'all' ? 'active' : ''}`}
              onClick={() => setShowFilterFlow(!showFilterFlow)}
            >
              <ArrowUpDown size={14} />
              {filterFlow === 'expense' ? 'Gastos' : filterFlow === 'income' ? 'Ingresos' : 'Tipo'}
            </button>
            {showFilterFlow && (
              <div className="kebo-filter-dropdown">
                <button className={`kebo-filter-option ${filterFlow === 'all' ? 'active' : ''}`}
                  onClick={() => { setFilterFlow('all'); setShowFilterFlow(false); }}>
                  Todos
                </button>
                <button className={`kebo-filter-option ${filterFlow === 'expense' ? 'active' : ''}`}
                  onClick={() => { setFilterFlow('expense'); setShowFilterFlow(false); }}>
                  Gastos
                </button>
                <button className={`kebo-filter-option ${filterFlow === 'income' ? 'active' : ''}`}
                  onClick={() => { setFilterFlow('income'); setShowFilterFlow(false); }}>
                  Ingresos
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Context tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div className="toggle-group">
            {(['all', 'personal', 'shared'] as const).map(t => (
              <button key={t} className={`toggle-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'all' ? 'Todo' : t === 'personal' ? 'Personal' : 'Compartido'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {/* Transaction list grouped by month */}
        <div className="card">
          {txLoading ? (
            <div className="empty-state">
              <div className="loading-spinner" />
              <div className="loading-text">Cargando transacciones...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">Sin transacciones</div>
              <div className="empty-state-desc">No hay transacciones que coincidan con tus filtros.</div>
            </div>
          ) : (
            Object.entries(grouped).map(([month, txs]) => (
              <div key={month}>
                <div className="tx-month-header">{month}</div>
                <div className="transaction-list">
                  {txs.map(tx => (
                    <div key={tx.id} className="transaction-item" onClick={() => handleEdit(tx)} style={{ cursor: 'pointer' }}>
                      <div className="transaction-icon" style={{ background: `${tx.category?.color}18` }}>
                        {tx.category?.icon}
                      </div>
                      <div className="transaction-info">
                        <div className="transaction-desc">
                          {tx.category?.name || tx.description}
                          {tx.type === 'shared' && (
                            <span className="badge-shared">Compartido</span>
                          )}
                        </div>
                        <div className="transaction-meta">
                          {tx.description}
                        </div>
                        {tx.account && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {tx.account.icon} {tx.account.name}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className={tx.amount > 0 ? 'transaction-amount income' : 'transaction-amount expense'}>
                          {tx.amount > 0 ? '' : '- '}€ {Math.abs(tx.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {new Date(tx.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Kebo-style Transaction Modal */}
      <TransactionModal
        open={showModal}
        onClose={handleCloseModal}
        editTransaction={editTx}
      />
    </>
  );
}
