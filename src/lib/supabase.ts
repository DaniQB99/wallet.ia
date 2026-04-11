import { createClient } from "@supabase/supabase-js";

/**
 * Configuración del cliente de Supabase para la aplicación Wallet.ia.
 *
 * Se utilizan variables de entorno para la URL y la clave anónima.
 * Las claves hardcodeadas actúan como respaldo (fallback) solo para desarrollo local.
 */
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://effvqibnbdfczalunhvx.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZnZxaWJuYmRmY3phbHVuaHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTA2MzUsImV4cCI6MjA4OTk2NjYzNX0.d733nyeJdfV-qRFg4vbFR0o3wikJ6VXV1bxqoJj5PzA";

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
