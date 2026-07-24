import { defineConfig } from "react-doctor/api";

/**
 * React Doctor configuration for wallet.ia
 *
 * artifact-baas-authority-surface is suppressed because it is a verified
 * false positive: Supabase RLS is enabled on EVERY table (profiles,
 * couple_links, accounts, categories, transactions, goals, notifications,
 * couple_invitations) and every policy scopes access to auth.uid().
 * The anon key is designed to be public; knowing table/field names grants
 * nothing when server-side rules enforce the boundary.
 *
 * Verified against: supabase/migration.sql (2026-07-22)
 */
export default defineConfig({
  rules: {
    "react-doctor/artifact-baas-authority-surface": "off",
  },
});
