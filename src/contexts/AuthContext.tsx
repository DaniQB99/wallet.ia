import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { UserProfile } from "../types/database";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: "github" | "google") => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  updateProfile: (displayName: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
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
    // If successful, onAuthStateChange will handle the rest
  }, []);

  const signInWithOAuth = useCallback(async (provider: "github" | "google") => {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
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

  const clearError = useCallback(() => setError(null), []);

  const updateProfile = async (displayName: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    setError(null);
    try {
      // 1. Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });
      if (authError) throw authError;

      // 2. Update profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // 3. Update local state
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
      value={{ user, loading, error, signUp, signIn, signInWithOAuth, signOut, clearError, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
