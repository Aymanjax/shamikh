import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

async function syncPublicProfile(user: User) {
  const ref = doc(db, "users-public", user.uid);
  await setDoc(ref, {
    email: user.email,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    lastLogin: serverTimestamp(),
  }, { merge: true });
}

export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await syncPublicProfile(cred.user);
  return cred.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const user = cred.user;
  const snap = await getDoc(doc(db, "users", user.uid, "profile", "main"));
  if (!snap.exists()) {
    await setDoc(doc(db, "users", user.uid, "profile", "main"), {
      displayName: user.displayName, email: user.email, role: "user", companyName: "", createdAt: new Date().toISOString(),
    });
  }
  await syncPublicProfile(user);
  return user;
}

export async function registerUser(email: string, password: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, "users", cred.user.uid, "profile", "main"), {
    displayName: name, email, role: "user", companyName: "", createdAt: new Date().toISOString(),
  });
  await syncPublicProfile(cred.user);
  return cred.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid, "profile", "main"));
  if (!snap.exists()) return null;
  return snap.data() as {
    displayName?: string;
    role?: "user" | "admin";
    companyName?: string;
    subscription?: {
      subscriptionType?: string;
      trialStartDate?: any;
      subscriptionEndDate?: any;
      isLinkedToNationalInvoice?: boolean;
    };
  };
}
