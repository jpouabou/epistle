import { authRepository } from '../repositories/AuthRepository';
import { localStorageRepository } from '../repositories/LocalStorageRepository';
import type { User } from '@supabase/supabase-js';

export class AuthService {
  async getCurrentUser(): Promise<User | null> {
    const { user } = await authRepository.getSession();
    return user;
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: string | null }> {
    const { user, error } = await authRepository.signInWithPassword(
      email,
      password
    );
    if (error) return { user: null, error: error.message };
    if (user) await localStorageRepository.setAnonymousMode(false);
    return { user, error: null };
  }

  async signUp(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: string | null }> {
    const { user, error } = await authRepository.signUp(email, password);
    if (error) return { user: null, error: error.message };
    if (user) await localStorageRepository.setAnonymousMode(false);
    return { user, error: null };
  }

  async signOut(): Promise<void> {
    await authRepository.signOut();
    await localStorageRepository.setAnonymousMode(false);
  }

  async continueWithoutAccount(): Promise<void> {
    await localStorageRepository.setAnonymousMode(true);
  }

  async isAnonymous(): Promise<boolean> {
    return localStorageRepository.getAnonymousMode();
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return authRepository.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
