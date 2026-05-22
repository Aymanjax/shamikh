import { create } from "zustand";
import { subscribeToAuth } from "../services/authService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  role: "user",
  subscription: null,
  banned: false,
  companyName: "",
  sessionInvalid: false,

  init: () => {
    const unsub = subscribeToAuth(async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid, "profile", "main"));
        const data = snap.exists() ? snap.data() : {};
        const localToken = localStorage.getItem("sessionToken");
        const firestoreToken = data.sessionToken;
        const mismatch = firestoreToken && localToken && firestoreToken !== localToken;
        set({
          user, loading: false,
          role: data.role || "user",
          subscription: data.subscription || null,
          banned: data.banned === true,
          companyName: data.companyName || "",
          sessionInvalid: mismatch || false,
        });
      } else {
        set({ user: null, loading: false, role: "user", subscription: null, banned: false, companyName: "", sessionInvalid: false });
      }
    });
    return unsub;
  },

  refreshProfile: async (uid) => {
    const snap = await getDoc(doc(db, "users", uid, "profile", "main"));
    const data = snap.exists() ? snap.data() : {};
    const localToken = localStorage.getItem("sessionToken");
    const firestoreToken = data.sessionToken;
    const mismatch = firestoreToken && localToken && firestoreToken !== localToken;
    set({
      role: data.role || "user",
      subscription: data.subscription || null,
      banned: data.banned === true,
      companyName: data.companyName || "",
      sessionInvalid: mismatch || false,
    });
  },

  setCompanyName: (name) => set({ companyName: name }),
}));
