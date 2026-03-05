import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { authService } from '../services/AuthService';

interface AuthContextValue {
  user: User | null;
  isAnonymous: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  continueWithoutAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await authService.getCurrentUser();
        const anon = await authService.isAnonymous();
        setUser(u);
        setIsAnonymous(anon && !u);
      } catch {
        setUser(null);
        setIsAnonymous(true);
      } finally {
        setLoading(false);
      }
    };
    load();

    const unsubscribe = authService.onAuthStateChange((u) => {
      setUser(u);
      if (u) setIsAnonymous(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await authService.signIn(email, password);
      return { error };
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error } = await authService.signUp(email, password);
      return { error };
    },
    []
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setIsAnonymous(false);
  }, []);

  const continueWithoutAccount = useCallback(async () => {
    await authService.continueWithoutAccount();
    setIsAnonymous(true);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAnonymous,
        loading,
        signIn,
        signUp,
        signOut,
        continueWithoutAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
