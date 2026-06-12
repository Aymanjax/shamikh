import { create } from "zustand";
import type { User } from "firebase/auth";

type SubscriptionState = {
  subscriptionType?: string;
  trialStartDate?: unknown;
  subscriptionEndDate?: unknown;
  isLinkedToNationalInvoice?: boolean;
};

// بيانات الشركة المستخدمة في ترويسة الفواتير المطبوعة (الشعار والهاتف والعنوان)
export type CompanyProfile = {
  logoURL?: string;
  phone?: string;
  address?: string;
};

interface AuthState {
  user: User | null;
  loading: boolean;
  role: string;
  companyName: string;
  companyProfile: CompanyProfile | null;
  sessionInvalid: boolean;
  trialExpired: boolean;
  subscription: SubscriptionState | null;
  setUser: (user: User | null) => void;
  setRole: (role: string) => void;
  setLoading: (loading: boolean) => void;
  setCompanyName: (name: string) => void;
  setCompanyProfile: (p: CompanyProfile | null) => void;
  setSubscription: (sub: SubscriptionState | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  role: "user",
  companyName: "",
  companyProfile: null,
  sessionInvalid: false,
  trialExpired: false,
  subscription: null,

  setUser: (user) => set({ user, loading: false }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  setCompanyName: (name) => set({ companyName: name }),
  setCompanyProfile: (p) => set({ companyProfile: p }),
  setSubscription: (sub) => set({ subscription: sub }),
  logout: () => set({ user: null, role: "user", companyName: "", companyProfile: null, subscription: null }),
}));
