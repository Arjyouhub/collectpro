import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const savedUser = localStorage.getItem('collectpro_user');
const savedToken = localStorage.getItem('collectpro_jwt_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  setAuth: (user, token) => {
    localStorage.setItem('collectpro_user', JSON.stringify(user));
    localStorage.setItem('collectpro_jwt_token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('collectpro_user');
    localStorage.removeItem('collectpro_jwt_token');
    set({ user: null, token: null });
  }
}));
