import { create } from 'zustand';
import type { User } from '../../api/types';
import { storage } from '../../lib/storage';

interface AuthState {
  user: User | null; token: string | null; initialized: boolean;
  setSession: (user: User, token?: string) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
}
export const useAuthStore = create<AuthState>(set => ({
  user: null, token: storage.get('lms-token', true), initialized: false,
  setSession: (user, token) => {
    if (token) storage.set('lms-token', token, true);
    else storage.remove('lms-token', true);
    set({ user, token: token ?? null, initialized: true });
  },
  setUser: user => set({ user, initialized: true }),
  clearSession: () => {
    storage.remove('lms-token', true);
    set({ user: null, token: null, initialized: true });
  },
}));
