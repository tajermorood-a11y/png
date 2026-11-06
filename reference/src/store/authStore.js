import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser, login, register } from '../lib/api';
import { useFinanceStore } from '../finance/store';
import { t } from '../constants/strings';

// Session = the logged-in user (persisted). All passwords are verified on the server (bcrypt).
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,

      login: async (username, password) => {
        const { data, error } = await login(username, password);
        if (error) return { error };
        if (!data?.ok) return { error: t.auth.errors[data?.error] ?? t.errors.generic };
        set({ user: data.user });
        return {};
      },

      register: async (username, password, displayName) => {
        const { data, error } = await register(username, password, displayName);
        if (error) return { error };
        if (!data?.ok) return { error: t.auth.errors[data?.error] ?? t.errors.generic };
        set({ user: data.user });
        return {};
      },

      refreshUser: async () => {
        const id = get().user?.id;
        if (!id) return;
        const { data } = await getUser(id);
        if (data) set({ user: { ...get().user, ...data } });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        useFinanceStore.getState().reset();
        set({ user: null });
      },
    }),
    { name: 'phantom-auth', storage: createJSONStorage(() => AsyncStorage), partialize: (s) => ({ user: s.user }) }
  )
);
