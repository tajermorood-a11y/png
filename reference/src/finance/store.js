import { create } from 'zustand';
import { getAccount, getBadges } from './api';

export const useFinanceStore = create((set, get) => ({
  account: null, // { balance, verified, badge, can_predict, total_points, rank }
  badges: {}, // { [userId]: 'red' | 'green' | 'yellow' }

  // Returns the account (or null on failure) so callers can use it right away.
  loadAccount: async (userId) => {
    if (!userId) return null;
    const { data } = await getAccount(userId);
    if (data) set({ account: data });
    return data ?? get().account;
  },

  loadBadges: async () => {
    const { data } = await getBadges();
    if (data) set({ badges: Object.fromEntries(data.map((r) => [r.user_id, r.badge])) });
  },

  applyRedeem: (res) =>
    set((s) => ({
      account: {
        ...(s.account ?? {}),
        balance: res.balance,
        verified: true,
        can_predict: true,
        badge: res.badge ?? s.account?.badge ?? null,
      },
    })),

  applyBadge: (userId, badge) =>
    set((s) => ({
      account: { ...(s.account ?? {}), badge },
      badges: { ...s.badges, [userId]: badge },
    })),

  reset: () => set({ account: null, badges: {} }),
}));
