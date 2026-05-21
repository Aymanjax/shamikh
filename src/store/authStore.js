import { create } from "zustand";
import { subscribeToAuth } from "../services/authService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  role: "user",
  subscription: null,

  init: () => {
    const unsub = subscribeToAuth(async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid, "profile", "main"));
        const data = snap.exists() ? snap.data() : {};
        set({
          user, loading: false,
          role: data.role || "user",
          subscription: data.subscription || null,
        });
      } else {
        set({ user: null, loading: false, role: "user", subscription: null });
      }
    });
    return unsub;
  },

  refreshProfile: async (uid) => {
    const snap = await getDoc(doc(db, "users", uid, "profile", "main"));
    const data = snap.exists() ? snap.data() : {};
    set({
      role: data.role || "user",
      subscription: data.subscription || null,
    });
  },
}));
