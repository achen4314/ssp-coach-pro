import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

interface User {
  id: number;
  username: string;
  display_name: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loginLoading: boolean;
  loginError: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => boolean;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      loginLoading: false,
      loginError: null,

      login: async (username: string, password: string) => {
        set({ loginLoading: true, loginError: null });
        try {
          const response = await apiClient.post('/auth/login', {
            username,
            password,
          });
          const { token, user } = response.data;
          localStorage.setItem('auth-token', token);
          set({
            token: token,
            user,
            isAuthenticated: true,
            loginLoading: false,
            loginError: null,
          });
        } catch (error: any) {
          const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            '登录失败，请检查网络连接';
          set({
            loginLoading: false,
            loginError: message,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          loginError: null,
        });
      },

      checkAuth: () => {
        return get().isAuthenticated;
      },

      clearError: () => {
        set({ loginError: null });
      },
    }),
    {
      name: 'ssp-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
