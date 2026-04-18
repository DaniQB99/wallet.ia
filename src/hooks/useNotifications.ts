import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Notification } from "../types/database";

/**
 * Hook personalizado para gestionar el sistema de notificaciones de la aplicación en tiempo real.
 * Permite obtener las notificaciones más recientes (hasta 50), mantener un contador de aquellas
 * no leídas, registrar suscripciones a la base de datos (Supabase) para recibir actualizaciones,
 * y proveer métodos para interactuar con las alertas enviadas al usuario.
 *
 * @returns Objeto con las notificaciones procesadas, cantidad sin leer, estado de carga,
 * recargas bajo demanda y métodos de marcado de lectura ('markAsRead', 'markAllAsRead').
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadCount((data as Notification[]).filter((n) => !n.is_read).length);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => fetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetch,
  };
}
