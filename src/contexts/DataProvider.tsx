import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthContext';
import type {
  Transaction,
  Account,
  Category,
  CoupleLink,
  UserProfile,
  Goal,
} from '../types/database';

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
// Types
// ---------------------------------------------------------------------------

interface LoadingState {
  transactions: boolean;
  accounts: boolean;
  categories: boolean;
  couple: boolean;
  goals: boolean;
}

type InvalidateTarget = 'transactions' | 'accounts' | 'categories' | 'couple' | 'goals';

interface DataContextType {
  // Data
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  couple: CoupleLink | null;
  partner: UserProfile | null;
  goals: Goal[];

  // State
  loading: LoadingState;
  initialLoadComplete: boolean;

  // Invalidation
  invalidate: (target: InvalidateTarget) => void;

  // Transaction mutations (centralized to avoid getUser() on every call)
  addTransaction: (tx: Partial<Transaction>) => Promise<Error | null>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Error | null>;
  deleteTransaction: (id: string) => Promise<Error | null>;

  // Account mutations
  addAccount: (account: Partial<Account>) => Promise<Error | null>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Error | null>;
  deleteAccount: (id: string) => Promise<Error | null>;

  // Category mutations
  addCategory: (category: Partial<Category>) => Promise<Error | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Error | null>;
  deleteCategory: (id: string) => Promise<Error | null>;

  // Goal mutations
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

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [couple, setCouple] = useState<CoupleLink | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
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
  // Fetch functions
  // --------------------------------------------------

  const fetchTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoading(prev => ({ ...prev, transactions: true }));

    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*), account:accounts(*)')
      .order('date', { ascending: false })
      .limit(200);

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(prev => ({ ...prev, transactions: false }));
  }, []);

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
  // Initial fetch — all data in parallel
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

  // Reset when user changes (logout/login)
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
  // Realtime subscriptions — 1 per table, not N per hook
  // --------------------------------------------------

  useEffect(() => {
    if (!userId) return;

    const partnerId = partner?.id;

    // Subscriptions for user's own data
    const txUserChannel = supabase
      .channel('tx-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => fetchTransactions(true))
      .subscribe();

    const accUserChannel = supabase
      .channel('acc-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
        () => fetchAccounts(true))
      .subscribe();

    const catUserChannel = supabase
      .channel('cat-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` },
        () => fetchCategories(true))
      .subscribe();

    const goalsUserChannel = supabase
      .channel('goals-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` },
        () => fetchGoals(true))
      .subscribe();

    // Subscriptions for partner's data (if linked)
    let txPartnerChannel: any = null;
    let accPartnerChannel: any = null;
    let catPartnerChannel: any = null;
    let goalsPartnerChannel: any = null;

    if (partnerId) {
      txPartnerChannel = supabase
        .channel('tx-partner')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${partnerId}` },
          () => fetchTransactions(true))
        .subscribe();

      accPartnerChannel = supabase
        .channel('acc-partner')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${partnerId}` },
          () => fetchAccounts(true))
        .subscribe();

      catPartnerChannel = supabase
        .channel('cat-partner')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${partnerId}` },
          () => fetchCategories(true))
        .subscribe();

      goalsPartnerChannel = supabase
        .channel('goals-partner')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${partnerId}` },
          () => fetchGoals(true))
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
      supabase.removeChannel(catUserChannel);
      supabase.removeChannel(goalsUserChannel);
      if (txPartnerChannel) supabase.removeChannel(txPartnerChannel);
      if (accPartnerChannel) supabase.removeChannel(accPartnerChannel);
      if (catPartnerChannel) supabase.removeChannel(catPartnerChannel);
      if (goalsPartnerChannel) supabase.removeChannel(goalsPartnerChannel);
      supabase.removeChannel(coupleChannel);
    };
  }, [userId, partner, fetchTransactions, fetchAccounts, fetchCategories, fetchCouple, fetchGoals]);

  // --------------------------------------------------
  // Invalidation
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
  // Transaction mutations
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
  // Account mutations
  // --------------------------------------------------

  const addAccount = useCallback(async (account: Partial<Account>) => {
    if (!userId) return new Error('Not authenticated');
    const { error } = await supabase.from('accounts').insert({ ...account, user_id: userId });
    if (!error) fetchAccounts(true);
    return error;
  }, [userId, fetchAccounts]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    const { error } = await supabase
      .from('accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
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
  // Category mutations
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
  // Goal mutations
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
  // Couple mutations
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
  // Memoized context value
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
