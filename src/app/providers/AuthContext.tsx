import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "../../shared/api/supabase";
import type { UserProfile } from "../../shared/types/database";

/**
 * Interfaz que define la estructura y capacidades del contexto de autenticación global.
 */
interface AuthContextType {
  /** Perfil del usuario actualmente autenticado (incluye display_name, email). Será nulo si no hay sesión. */
  user: UserProfile | null;
  /** Estado de carga que indica si la validación/sesión inicial se está resolviendo. */
  loading: boolean;
  /** Mensaje de error general de autenticación si ocurre alguna excepción. */
  error: string | null;

  /**
   * Crea un nuevo usuario y su perfil en el sistema vía Supabase Auth.
   * @param email Correo electrónico.
   * @param password Contraseña segura.
   * @param displayName Nombre a mostrar del usuario.
   * @returns Un booleano indicando el éxito (true) o fallo (false) de la operación.
   */
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;

  /**
   * Inicia sesión tradicional con correo y contraseña.
   * @param email Correo electrónico registrado.
   * @param password Contraseña de la cuenta.
   */
  signIn: (email: string, password: string) => Promise<void>;

  /**
   * Inicia sesión usando proveedores externos OAuth (GitHub, Google, etc.).
   * @param provider Nombre del proveedor "github" | "google".
   */
  signInWithOAuth: (provider: "github" | "google") => Promise<void>;

  /**
   * Cierra la sesión activa actual del usuario.
   */
  signOut: () => Promise<void>;

  /**
   * Envía un email con un enlace seguro para recuperación de contraseña.
   * @param email Correo registrado del usuario.
   */
  resetPassword: (email: string) => Promise<boolean>;

  /**
   * Limpia manualmente el estado de error de autenticación.
   */
  clearError: () => void;

  /**
   * Actualiza los datos de perfil locales y remotos (auth metadata + tabla `profiles`).
   * @param displayName Nuevo nombre a mostrar.
   */
  updateProfile: (displayName: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Proveedor global de autenticación que gestiona el estado de Supabase.
 * Inicializa y escucha la sesión para mantener al usuario local sincronizado.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string, email?: string) => {
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
      setUser(null);
    } else {
      setUser({
        ...data,
        email: email || "",
      } as UserProfile);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      setLoading(true);
      setError(null);

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return false;
      }

      setLoading(false);
      return true;
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
    // Si es exitoso, onAuthStateChange manejará el resto
  }, []);

  const signInWithOAuth = useCallback(async (provider: "github" | "google") => {
    setLoading(true);
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    setError(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (resetError) {
      setError(resetError.message);
      return false;
    }
    return true;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const updateProfile = async (displayName: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    setError(null);
    try {
      // 1. Actualiza los metadatos de autenticación
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });
      if (authError) throw authError;

      // 2. Actualiza la tabla de perfiles
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // 3. Actualiza el estado local
      setUser({ ...user, display_name: displayName });
      return true;
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'Error al actualizar el perfil');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signUp, signIn, signInWithOAuth, signOut, resetPassword, clearError, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook para acceder fácilmente a la sesión, métodos de login y variables de estado del usuario.
 * @throws Lanzará error si se inicializa fuera de un AuthProvider.
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used dentro de un AuthProvider");
  }
  return context;
}
