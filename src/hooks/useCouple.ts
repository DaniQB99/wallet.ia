import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type {
  CoupleLink,
  CoupleInvitation,
  UserProfile,
} from "../types/database";

export function useCouple() {
  const [couple, setCouple] = useState<CoupleLink | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCouple = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("couple_links")
      .select("*")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .single();

    if (data) {
      setCouple(data as CoupleLink);
      // Fetch partner profile
      const partnerId =
        data.user_a_id === user.id ? data.user_b_id : data.user_a_id;
      const { data: partnerData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", partnerId)
        .single();
      if (partnerData) setPartner(partnerData as UserProfile);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCouple();
  }, [fetchCouple]);

  const generateInvite = useCallback(async (): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Generate code via DB function
    const { data } = await supabase.rpc("generate_invite_code");
    const code = data as string;

    const { error } = await supabase.from("couple_invitations").insert({
      inviter_id: user.id,
      code,
    });

    return error ? null : code;
  }, []);

  const acceptInvite = useCallback(
    async (code: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Not authenticated" };

      // Find the invitation
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

      // Create couple link
      const { error: linkError } = await supabase.from("couple_links").insert({
        user_a_id: (invitation as CoupleInvitation).inviter_id,
        user_b_id: user.id,
        status: "active",
        linked_at: new Date().toISOString(),
      });

      if (linkError) return { error: linkError.message };

      // Mark invitation as used
      await supabase
        .from("couple_invitations")
        .update({ status: "used" })
        .eq("id", (invitation as CoupleInvitation).id);

      fetchCouple();
      return { error: null };
    },
    [fetchCouple],
  );

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
