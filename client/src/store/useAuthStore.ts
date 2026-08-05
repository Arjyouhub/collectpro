import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const getInitialUser = (): User | null => {
  try {
    const raw = localStorage.getItem('collectpro_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    localStorage.removeItem('collectpro_user');
    return null;
  }
};

const savedUser = getInitialUser();
const savedToken = localStorage.getItem('collectpro_jwt_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser,
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
