import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

async function syncPublicProfile(user) {
  const ref = doc(db, "users-public", user.uid);
  await setDoc(ref, {
    email: user.email,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    lastLogin: serverTimestamp(),
  }, { merge: true });
}

export const registerUser = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await syncPublicProfile(cred.user);
  return cred.user;
};

export const loginUser = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await syncPublicProfile(cred.user);
  return cred.user;
};

export const loginWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider);
  await syncPublicProfile(cred.user);
  const profileRef = doc(db, "users", cred.user.uid, "profile", "main");
  const snap = await getDoc(profileRef);
  if (!snap.exists()) {
    await setDoc(profileRef, {
      companyName: cred.user.displayName || "",
      phone: "",
      email: cred.user.email,
      role: "user",
      createdAt: new Date().toISOString(),
    });
  }
  return cred.user;
};

export const changeUserPassword = async (oldPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("يجب تسجيل الدخول أولاً");
  const credential = EmailAuthProvider.credential(user.email, oldPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

export const logoutUser = () => signOut(auth);

export const subscribeToAuth = (callback) => onAuthStateChanged(auth, callback);
