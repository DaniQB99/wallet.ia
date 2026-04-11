import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type {
  CoupleLink,
  CoupleInvitation,
  UserProfile,
} from "../types/database";

/**
 * Hook para la gestión de la relación de pareja en la aplicación.
 *
 * Permite gestionar el ciclo de vida de la vinculación entre dos usuarios:
 * - Detección automática del vínculo activo.
 * - Carga del perfil de la pareja (partner).
 * - Generación de códigos de invitación únicos.
 * - Aceptación de invitaciones y desvinculación (unlink).
 */
export function useCouple() {
  const [couple, setCouple] = useState<CoupleLink | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /** Carga la información del vínculo de pareja si existe */
  const fetchCouple = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoading(false);
      return;
    }

    // Buscar vínculo activo del usuario logueado
    const { data } = await supabase
      .from("couple_links")
      .select("*")
      .or(`user_a_id.eq.${session.user.id},user_b_id.eq.${session.user.id}`)
      .eq("status", "active")
      .maybeSingle();

    if (data) {
      setCouple(data as CoupleLink);

      // Identificar al partner basándose en quién inició el vínculo
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const partnerId =
          data.user_a_id === session.user.id ? data.user_b_id : data.user_a_id;

        // Cargar detalles del perfil del partner para mostrar en la interfaz
        const { data: partnerData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", partnerId)
          .single();
        if (partnerData) setPartner(partnerData as UserProfile);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCouple();
  }, [fetchCouple]);

  /** Genera un nuevo código de invitación seguro de 6 dígitos */
  const generateInvite = useCallback(async (): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Llamada a función RPC en base de datos para garantizar unicidad y seguridad
    const { data } = await supabase.rpc("generate_invite_code");
    const code = data as string;

    const { error } = await supabase.from("couple_invitations").insert({
      inviter_id: user.id,
      code,
    });

    return error ? null : code;
  }, []);

  /** Procesa un código de invitación recibido para activar el vínculo */
  const acceptInvite = useCallback(
    async (code: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Not authenticated" };

      // Búsqueda de invitación válida, pendiente y no expirada
      const { data: invitation } = await supabase
        .from("couple_invitations")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!invitation) return { error: "Código inválido o expirado" };
      if ((invitation as CoupleInvitation).inviter_id === user.id)
        return { error: "No puedes usar tu propio código" };

      // Registro oficial del vínculo de pareja
      const { error: linkError } = await supabase.from("couple_links").insert({
        user_a_id: (invitation as CoupleInvitation).inviter_id,
        user_b_id: user.id,
        status: "active",
        linked_at: new Date().toISOString(),
      });

      if (linkError) return { error: linkError.message };

      // Inutilizar el código de invitación tras el éxito
      await supabase
        .from("couple_invitations")
        .update({ status: "used" })
        .eq("id", (invitation as CoupleInvitation).id);

      fetchCouple(true);
      return { error: null };
    },
    [fetchCouple],
  );

  /** Disuelve el vínculo de pareja actual (Hard delete) */
  const unlinkCouple = useCallback(async () => {
    if (!couple) return;
    await supabase.from("couple_links").delete().eq("id", couple.id);
    setCouple(null);
    setPartner(null);
  }, [couple]);

  return {
    couple,
    partner,
    loading,
    generateInvite,
    acceptInvite,
    unlinkCouple,
  };
}
