import { createClient } from "@supabase/supabase-js";

/**
 * Configuración del cliente de Supabase para la aplicación Wallet.ia.
 *
 * Se utilizan variables de entorno para la URL y la clave anónima.
 * La app falla rápido si las variables no están configuradas — esto previene
 * que se usen credenciales comprometidas o que se conecte a un proyecto incorrecto.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
    "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file."
  );
}

/**
 * Instancia del cliente de Supabase con configuraciones optimizadas para PWA:
 * - autoRefreshToken: Mantiene la sesión activa automáticamente.
 * - persistSession: Guarda la sesión en el almacenamiento local.
 * - flowType 'pkce': Implementación más segura de OAuth que resuelve problemas de concurrencia en React StrictMode.
 * - storageKey: Identificador único para evitar conflictos con otros proyectos en el mismo dominio.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    storageKey: "wallet-ia-auth",
  },
});
