import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/** Debounce helper — prevents fetch storms from rapid Realtime events */
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T;
}
import { supabase } from '../../shared/api/supabase';
import { useAuthContext } from './AuthContext';
import type {
  Transaction,
  Account,
  Category,
  CoupleLink,
  UserProfile,
  Goal,
} from '../../shared/types/database';

/**
 * @module DataProvider
 * @description Capa de datos centralizada para wallet.ia.
 *
 * PROBLEMA QUE RESUELVE:
 * Antes, cada página (Dashboard, Transactions, Goals, Analytics) hacía sus propios
 * fetches a Supabase independientemente. Al navegar entre páginas, se repetían las
 * mismas queries → 2-4 segundos de espera por cada navegación.
 *
 * SOLUCIÓN:
 * Un solo provider que:
 * 1. Hace 1 fetch por tabla al montar (transactions, accounts, categories, couple, goals)
 * 2. Mantiene los datos en memoria — las páginas leen del provider
 * 3. Gestiona 1 sola suscripción Realtime por tabla
 * 4. Expone `invalidate(tabla)` para re-fetch selectivo tras mutaciones
 * 5. Cachea el userId del AuthContext (evita llamar getUser() en cada mutación)
 *
 * RESULTADO: Navegación entre páginas es instantánea (~0ms) porque los datos
 * ya están en memoria. Solo la carga inicial toma ~1-2s.
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Number of transactions to load per page */
const TX_PAGE_SIZE = 50;

interface LoadingState {
  transactions: boolean;
  accounts: boolean;
  categories: boolean;
  couple: boolean;
  goals: boolean;
}

type InvalidateTarget = 'transactions' | 'accounts' | 'categories' | 'couple' | 'goals';

interface DataContextType {
  // Datos
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  couple: CoupleLink | null;
  partner: UserProfile | null;
  goals: Goal[];

  // Estado
  loading: LoadingState;
  initialLoadComplete: boolean;

  // Pagination
  hasMoreTransactions: boolean;
  loadMoreTransactions: () => Promise<void>;

  // Invalidación
  invalidate: (target: InvalidateTarget) => void;

  // Mutaciones de transacciones (centralizadas para evitar getUser() en cada llamada)
  addTransaction: (tx: Partial<Transaction>) => Promise<Error | null>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Error | null>;
  deleteTransaction: (id: string) => Promise<Error | null>;

  // Mutaciones de cuentas
  addAccount: (account: Partial<Account>) => Promise<Error | null>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Error | null>;
  deleteAccount: (id: string) => Promise<Error | null>;

  // Mutaciones de categorías
  addCategory: (category: Partial<Category>) => Promise<Error | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Error | null>;
  deleteCategory: (id: string) => Promise<Error | null>;

  // Mutaciones de metas
  addGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'current_amount' | 'created_by'>) => Promise<Error | null>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<Error | null>;
  deleteGoal: (id: string) => Promise<Error | null>;

  // Couple mutations
  generateInvite: () => Promise<string | null>;
  acceptInvite: (code: string) => Promise<{ error: string | null }>;
  unlinkCouple: () => Promise<void>;
  togglePermission: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const userId = user?.id;

  // Datos de estado
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [couple, setCouple] = useState<CoupleLink | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [loading, setLoading] = useState<LoadingState>({
    transactions: true,
    accounts: true,
    categories: true,
    couple: true,
    goals: true,
  });

  // Ref to track if initial fetch has been done (avoid StrictMode double-fetch)
  const hasFetched = useRef(false);

  // --------------------------------------------------
  // Funciones de obtención de datos (Fetch)
  // --------------------------------------------------

  const fetchTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoading(prev => ({ ...prev, transactions: true }));

    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*), account:accounts(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(TX_PAGE_SIZE);

    if (!error && data) {
      setTransactions(data as Transaction[]);
      setHasMoreTransactions(data.length === TX_PAGE_SIZE);
    }
    setLoading(prev => ({ ...prev, transactions: false }));
  }, []);

  /** Cursor-based pagination: load next page after the last transaction's date */
  const loadMoreTransactions = useCallback(async () => {
    if (!hasMoreTransactions || transactions.length === 0) return;

    const lastTx = transactions[transactions.length - 1];
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*), account:accounts(*)')
      .or(`date.lt.${lastTx.date},and(date.eq.${lastTx.date},created_at.lt.${lastTx.created_at})`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(TX_PAGE_SIZE);

    if (!error && data) {
      setTransactions(prev => [...prev, ...(data as Transaction[])]);
      setHasMoreTransactions(data.length === TX_PAGE_SIZE);
    }
  }, [hasMoreTransactions, transactions]);

  const fetchAccounts = useCallback(async (silent = false) => {
    if (!silent) setLoading(prev => ({ ...prev, accounts: true }));

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setAccounts(data as Account[]);
    }
    setLoading(prev => ({ ...prev, accounts: false }));
  }, []);

  const fetchCategories = useCallback(async (silent = false) => {
    if (!silent) setLoading(prev => ({ ...prev, categories: true }));

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setCategories(data as Category[]);
    }
    setLoading(prev => ({ ...prev, categories: false }));
  }, []);

  const fetchCouple = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(prev => ({ ...prev, couple: true }));

    const { data } = await supabase
      .from('couple_links')
      .select('*')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .eq('status', 'active')
      .maybeSingle();

    if (data) {
      setCouple(data as CoupleLink);
      const partnerId = data.user_a_id === userId ? data.user_b_id : data.user_a_id;
      const { data: partnerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single();
      if (partnerData) setPartner(partnerData as UserProfile);
    } else {
      setCouple(null);
      setPartner(null);
    }
    setLoading(prev => ({ ...prev, couple: false }));
  }, [userId]);

  const fetchGoals = useCallback(async (silent = false) => {
    if (!silent) setLoading(prev => ({ ...prev, goals: true }));

    const { data, error } = await supabase
      .from('goals')
      .select('*');

    if (!error && data) {
      setGoals(data as Goal[]);
    }
    setLoading(prev => ({ ...prev, goals: false }));
  }, []);

  // --------------------------------------------------
  // Carga inicial de datos en paralelo
  // --------------------------------------------------

  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;

    const loadAll = async () => {
      await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchCategories(),
        fetchCouple(),
        fetchGoals(),
      ]);
      setInitialLoadComplete(true);
    };
    void loadAll();
  }, [userId, fetchTransactions, fetchAccounts, fetchCategories, fetchCouple, fetchGoals]);

  // Reset cuando el usuario cambia (logout/login)
  useEffect(() => {
    if (!userId) {
      hasFetched.current = false;
      setTransactions([]);
      setAccounts([]);
      setCategories([]);
      setCouple(null);
      setPartner(null);
      setGoals([]);
      setInitialLoadComplete(false);
    }
  }, [userId]);

  // --------------------------------------------------
  // Suscripciones Realtime: 1 por tabla, no N por hook
  // --------------------------------------------------

  // Debounced fetch callbacks to prevent fetch storms from rapid Realtime events
  const debouncedFetchTx = useMemo(() => debounce(() => fetchTransactions(true), 300), [fetchTransactions]);
  const debouncedFetchAcc = useMemo(() => debounce(() => fetchAccounts(true), 300), [fetchAccounts]);
  const debouncedFetchGoals = useMemo(() => debounce(() => fetchGoals(true), 300), [fetchGoals]);

  useEffect(() => {
    if (!userId) return;

    const partnerId = partner?.id;

    // Suscripciones para datos del propio usuario (debounced)
    const txUserChannel = supabase
      .channel('tx-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        debouncedFetchTx)
      .subscribe();

    const accUserChannel = supabase
      .channel('acc-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
        debouncedFetchAcc)
      .subscribe();

    // Categories change rarely — no realtime needed, use invalidation instead

    const goalsUserChannel = supabase
      .channel('goals-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` },
        debouncedFetchGoals)
      .subscribe();

    // Suscripciones para datos del compañero (si está vinculado)
    let txPartnerChannel: ReturnType<typeof supabase.channel> | null = null;
    let accPartnerChannel: ReturnType<typeof supabase.channel> | null = null;
    let goalsPartnerChannel: ReturnType<typeof supabase.channel> | null = null;

    if (partnerId) {
      txPartnerChannel = supabase
        .channel('tx-partner')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${partnerId}` },
          debouncedFetchTx)
        .subscribe();

      accPartnerChannel = supabase
        .channel('acc-partner')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${partnerId}` },
          debouncedFetchAcc)
        .subscribe();

      goalsPartnerChannel = supabase
        .channel('goals-partner')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${partnerId}` },
          debouncedFetchGoals)
        .subscribe();
    }

    const coupleChannel = supabase
      .channel('data-provider-couple')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_links' },
        () => fetchCouple(true))
      .subscribe();

    return () => {
      supabase.removeChannel(txUserChannel);
      supabase.removeChannel(accUserChannel);
      supabase.removeChannel(goalsUserChannel);
      if (txPartnerChannel) supabase.removeChannel(txPartnerChannel);
      if (accPartnerChannel) supabase.removeChannel(accPartnerChannel);
      if (goalsPartnerChannel) supabase.removeChannel(goalsPartnerChannel);
      supabase.removeChannel(coupleChannel);
    };
  }, [userId, partner, debouncedFetchTx, debouncedFetchAcc, debouncedFetchGoals, fetchCouple]);

  // --------------------------------------------------
  // Invalidación de datos
  // --------------------------------------------------

  const invalidate = useCallback((target: InvalidateTarget) => {
    switch (target) {
      case 'transactions': fetchTransactions(true); break;
      case 'accounts': fetchAccounts(true); break;
      case 'categories': fetchCategories(true); break;
      case 'couple': fetchCouple(true); break;
      case 'goals': fetchGoals(true); break;
    }
  }, [fetchTransactions, fetchAccounts, fetchCategories, fetchCouple, fetchGoals]);

  // --------------------------------------------------
  // Mutaciones de transacciones
  // --------------------------------------------------

  const addTransaction = useCallback(async (tx: Partial<Transaction>) => {
    if (!userId) return new Error('Not authenticated');
    const { error } = await supabase.from('transactions').insert({ ...tx, user_id: userId });
    if (!error) fetchTransactions(true);
    return error;
  }, [userId, fetchTransactions]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (!error) fetchTransactions(true);
    return error;
  }, [fetchTransactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) fetchTransactions(true);
    return error;
  }, [fetchTransactions]);

  // --------------------------------------------------
  // Mutaciones de cuentas
  // --------------------------------------------------

  const addAccount = useCallback(async (account: Partial<Account>) => {
    if (!userId) return new Error('Not authenticated');
    const { error } = await supabase.from('accounts').insert({ ...account, user_id: userId });
    if (!error) fetchAccounts(true);
    return error;
  }, [userId, fetchAccounts]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    // updated_at is now handled by the database trigger (003_updated_at_trigger.sql)
    const { error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id);
    if (!error) fetchAccounts(true);
    return error;
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (id: string) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (!error) fetchAccounts(true);
    return error;
  }, [fetchAccounts]);

  // --------------------------------------------------
  // Mutaciones de categorías
  // --------------------------------------------------

  const addCategory = useCallback(async (category: Partial<Category>) => {
    if (!userId) return new Error('Not authenticated');
    const { error } = await supabase.from('categories').insert({ ...category, user_id: userId });
    if (!error) fetchCategories(true);
    return error;
  }, [userId, fetchCategories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase.from('categories').update(updates).eq('id', id);
    if (!error) fetchCategories(true);
    return error;
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchCategories(true);
    return error;
  }, [fetchCategories]);

  // --------------------------------------------------
  // Mutaciones de metas
  // --------------------------------------------------

  const addGoal = useCallback(async (
    goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'current_amount' | 'created_by'>
  ) => {
    if (!userId) return new Error('Not authenticated');
    const { error } = await supabase.from('goals').insert([{ ...goal, user_id: userId }]);
    if (!error) fetchGoals(true);
    return error;
  }, [userId, fetchGoals]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    const { error } = await supabase.from('goals').update(updates).eq('id', id);
    if (!error) fetchGoals(true);
    return error;
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (!error) fetchGoals(true);
    return error;
  }, [fetchGoals]);

  // --------------------------------------------------
  // Mutaciones de pareja
  // --------------------------------------------------

  const generateInvite = useCallback(async (): Promise<string | null> => {
    if (!userId) return null;
    const { data } = await supabase.rpc('generate_invite_code');
    const code = data as string;
    const { error } = await supabase.from('couple_invitations').insert({
      inviter_id: userId,
      code,
    });
    return error ? null : code;
  }, [userId]);

  const acceptInvite = useCallback(async (code: string) => {
    if (!userId) return { error: 'Not authenticated' };

    const { data: invitation } = await supabase
      .from('couple_invitations')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!invitation) return { error: 'Código inválido o expirado' };
    if (invitation.inviter_id === userId) return { error: 'No puedes usar tu propio código' };

    const { error: linkError } = await supabase.from('couple_links').insert({
      user_a_id: invitation.inviter_id,
      user_b_id: userId,
      status: 'active',
      linked_at: new Date().toISOString(),
    });

    if (linkError) return { error: linkError.message };

    await supabase
      .from('couple_invitations')
      .update({ status: 'used' })
      .eq('id', invitation.id);

    fetchCouple(true);
    return { error: null };
  }, [userId, fetchCouple]);

  const unlinkCouple = useCallback(async () => {
    if (!couple) return;
    await supabase.from('couple_links').delete().eq('id', couple.id);
    setCouple(null);
    setPartner(null);
  }, [couple]);

  const togglePermission = useCallback(async () => {
    if (!couple) return;
    const newPerm = couple.shared_permission === 'read_write' ? 'read_only' : 'read_write';
    const { error } = await supabase
      .from('couple_links')
      .update({ shared_permission: newPerm })
      .eq('id', couple.id);
    if (!error) {
      setCouple({ ...couple, shared_permission: newPerm });
    }
  }, [couple]);

  // --------------------------------------------------
  // Valor del contexto memoizado
  // --------------------------------------------------

  const value = useMemo<DataContextType>(() => ({
    transactions,
    accounts,
    categories,
    couple,
    partner,
    goals,
    loading,
    initialLoadComplete,
    hasMoreTransactions,
    loadMoreTransactions,
    invalidate,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    addGoal,
    updateGoal,
    deleteGoal,
    generateInvite,
    acceptInvite,
    unlinkCouple,
    togglePermission,
  }), [
    transactions, accounts, categories, couple, partner, goals, loading, initialLoadComplete,
    hasMoreTransactions, loadMoreTransactions,
    invalidate,
    addTransaction, updateTransaction, deleteTransaction,
    addAccount, updateAccount, deleteAccount,
    addCategory, updateCategory, deleteCategory,
    addGoal, updateGoal, deleteGoal,
    generateInvite, acceptInvite, unlinkCouple, togglePermission,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
