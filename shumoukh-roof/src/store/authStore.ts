import { create } from "zustand";
import type { User } from "firebase/auth";

type SubscriptionState = {
  subscriptionType?: string;
  trialStartDate?: unknown;
  subscriptionEndDate?: unknown;
  isLinkedToNationalInvoice?: boolean;
};

interface AuthState {
  user: User | null;
  loading: boolean;
  role: string;
  companyName: string;
  sessionInvalid: boolean;
  trialExpired: boolean;
  subscription: SubscriptionState | null;
  setUser: (user: User | null) => void;
  setRole: (role: string) => void;
  setLoading: (loading: boolean) => void;
  setCompanyName: (name: string) => void;
  setSubscription: (sub: SubscriptionState | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  role: "user",
  companyName: "",
  sessionInvalid: false,
  trialExpired: false,
  subscription: null,

  setUser: (user) => set({ user, loading: false }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  setCompanyName: (name) => set({ companyName: name }),
  setSubscription: (sub) => set({ subscription: sub }),
  logout: () => set({ user: null, role: "user", companyName: "", subscription: null }),
}));
