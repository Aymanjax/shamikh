import { create } from "zustand";
import { subscribeToAuth } from "../services/authService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  role: "user",

  init: () => {
    const unsub = subscribeToAuth(async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid, "profile", "main"));
        const role = snap.exists() ? snap.data().role || "user" : "user";
        set({ user, loading: false, role });
      } else {
        set({ user: null, loading: false, role: "user" });
      }
    });
    return unsub;
  },

  refreshRole: async (uid) => {
    const snap = await getDoc(doc(db, "users", uid, "profile", "main"));
    const role = snap.exists() ? snap.data().role || "user" : "user";
    set({ role });
  },
}));
