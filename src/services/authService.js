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
  sendPasswordResetEmail,
  confirmPasswordReset,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";

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

export const generateSessionToken = async (uid) => {
  const token = crypto.randomUUID();
  const profileRef = doc(db, "users", uid, "profile", "main");
  await updateDoc(profileRef, { sessionToken: token });
  localStorage.setItem("sessionToken", token);
};

export const registerUser = async (email, password, displayName, companyName = "") => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  const token = crypto.randomUUID();
  localStorage.setItem("sessionToken", token);
  const trialExpiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  await setDoc(doc(db, "users", cred.user.uid, "profile", "main"), {
    companyName,
    displayName,
    phone: "",
    email,
    role: "user",
    createdAt: new Date().toISOString(),
    sessionToken: token,
    subscription: { plan: "trial", expiresAt: Timestamp.fromDate(trialExpiry) },
  });
  await syncPublicProfile(cred.user);
  return cred.user;
};

export const loginUser = async (email, password, remember = true) => {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await syncPublicProfile(cred.user);
  await generateSessionToken(cred.user.uid);
  return cred.user;
};

export const updateProfileDisplayName = async (displayName) => {
  const user = auth.currentUser;
  if (!user) throw new Error("يجب تسجيل الدخول أولاً");
  await updateProfile(user, { displayName });
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const confirmResetPassword = async (oobCode, newPassword) => {
  await confirmPasswordReset(auth, oobCode, newPassword);
};

export const loginWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider);
  await syncPublicProfile(cred.user);
  const profileRef = doc(db, "users", cred.user.uid, "profile", "main");
  const snap = await getDoc(profileRef);
  if (!snap.exists()) {
    const token = crypto.randomUUID();
    localStorage.setItem("sessionToken", token);
    const trialExpiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    await setDoc(profileRef, {
      companyName: "",
      displayName: cred.user.displayName || "",
      phone: "",
      email: cred.user.email,
      role: "user",
      createdAt: new Date().toISOString(),
      sessionToken: token,
      subscription: { plan: "trial", expiresAt: Timestamp.fromDate(trialExpiry) },
    });
  } else {
    await generateSessionToken(cred.user.uid);
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

export const logoutUser = () => {
  localStorage.removeItem("sessionToken");
  return signOut(auth);
};

export const subscribeToAuth = (callback) => onAuthStateChanged(auth, callback);
