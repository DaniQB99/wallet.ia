import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { useAuthContext } from '../../app/providers/AuthContext';
import { TRANSACTIONS_QUERY_KEY } from '../../entities/transactions/model/useTransactions';

export const TAB_SYNC_CHANNEL = 'wallet_ia_tab_sync';

export interface TabSyncMessage {
  type:
    | 'INVALIDATE_QUERY'
    | 'APPEARANCE_CHANGE'
    | 'PROFILE_CHANGE'
    | 'HIDE_CARD_BALANCE_CHANGED'
    | 'LOCALE_CHANGED'
    | 'CURRENCY_CHANGED';
  queryKey?: string[] | string;
  theme?: string;
  accentColor?: string;
  payload?: any;
}

/**
 * Emite una señal de sincronización inmediata a todas las pestañas/ventanas abiertas en este dispositivo.
 */
export function broadcastTabSync(message: TabSyncMessage) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(TAB_SYNC_CHANNEL);
      bc.postMessage(message);
      bc.close();
    }
  } catch {
    // Fallback silencioso si el entorno no soporta BroadcastChannel
  }
}

/**
 * Hook de sincronización reactiva en tiempo real multi-dispositivo y multi-ventana.
 * - Conecta a Supabase Realtime (WebSocket) para recibir cambios de otros dispositivos (<100ms).
 * - Conecta a BroadcastChannel para sincronizar ventanas del mismo navegador al instante (0ms).
 * - Implementa debounce para evitar tormentas de re-renderizado en inserciones masivas.
 */
export function useRealtimeSync() {
  const { user, refreshProfile } = useAuthContext();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Función de invalidación agrupada (debounced) para máximo rendimiento
    const triggerInvalidation = (keys: string[][], broadcast = true) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        keys.forEach(k => {
          void queryClient.invalidateQueries({ queryKey: k });
        });
        if (broadcast) {
          keys.forEach(k => {
            broadcastTabSync({ type: 'INVALIDATE_QUERY', queryKey: k });
          });
        }
      }, 50);
    };

    // 1. Escuchador de BroadcastChannel para sincronización instantánea entre pestañas/ventanas locales
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel(TAB_SYNC_CHANNEL);
        bc.onmessage = (event: MessageEvent<TabSyncMessage>) => {
          if (event.data?.type === 'INVALIDATE_QUERY' && event.data.queryKey) {
            const rawKey = event.data.queryKey;
            const queryKey = Array.isArray(rawKey) ? rawKey : [rawKey];
            void queryClient.invalidateQueries({ queryKey });
          } else if (event.data?.type === 'PROFILE_CHANGE') {
            void refreshProfile();
          }
        };
      } catch {
        // ignore
      }
    }

    // 2. Suscripción WebSocket a Supabase Realtime para cambios desde otros dispositivos
    const channelName = `realtime:sync:${userId}:${Date.now()}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          triggerInvalidation([TRANSACTIONS_QUERY_KEY, ['accounts'], ['analytics'], ['goals']]);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        () => {
          triggerInvalidation([['accounts'], TRANSACTIONS_QUERY_KEY]);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          triggerInvalidation([['categories'], TRANSACTIONS_QUERY_KEY]);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals' },
        () => {
          triggerInvalidation([['goals'], ['goal_categories']]);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couple_links' },
        () => {
          triggerInvalidation([['couple'], TRANSACTIONS_QUERY_KEY, ['accounts']]);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => {
          void refreshProfile();
          broadcastTabSync({ type: 'PROFILE_CHANGE' });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Al reconectarse, refrescar datos para garantizar consistencia
          triggerInvalidation([TRANSACTIONS_QUERY_KEY, ['accounts']], false);
        }
      });

    // 3. Sincronización al recuperar foco de ventana o cambiar visibilidad (PWA/Móvil)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerInvalidation([TRANSACTIONS_QUERY_KEY, ['accounts']], false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (bc) bc.close();
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient, refreshProfile]);
}

/**
 * Componente puente sin interfaz que activa la sincronización reactiva en segundo plano.
 */
export function RealtimeSyncBridge() {
  useRealtimeSync();
  return null;
}
