import { supabase } from '../utils/supabase';
import type { User } from '@supabase/supabase-js';

export class AuthRepository {
  async getSession(): Promise<{ user: User | null }> {
    const { data } = await supabase.auth.getSession();
    return { user: data.session?.user ?? null };
  }

  async signInWithPassword(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user ?? null, error: error as Error | null };
  }

  async signUp(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { user: data.user ?? null, error: error as Error | null };
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  onAuthStateChange(
    callback: (user: User | null) => void
  ): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }
}

export const authRepository = new AuthRepository();
