import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null, token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      isAuthenticated: false,
      setUser: (user, token) =>
        set({
          user,
          sessionToken: token || null,
          isAuthenticated: !!user,
        }),
      logout: () =>
        set({
          user: null,
          sessionToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'kabacash-auth-storage',
    }
  )
);
