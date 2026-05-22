import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, addDoc, query, where, orderBy, Timestamp } from "firebase/firestore";

export async function createSupplier(email, password, data) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const supplier = {
    uid,
    email,
    businessName: data.businessName,
    phone: data.phone || "",
    area: data.area || "",
    activity: data.activity || "",
    description: data.description || "",
    approved: false,
    featured: false,
    banned: false,
    subscription: { plan: "free" },
    createdAt: Timestamp.now(),
  };
  await setDoc(doc(db, "suppliers", uid), supplier);
  return { uid, ...supplier };
}

export async function loginSupplier(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const snap = await getDoc(doc(db, "suppliers", uid));
  if (!snap.exists()) throw new Error("هذا الحساب ليس حساب مورد");
  return { uid, id: uid, ...snap.data() };
}

export async function logoutSupplier() {
  await signOut(auth);
}

export async function getSupplier(uid) {
  const snap = await getDoc(doc(db, "suppliers", uid));
  return snap.exists() ? { uid, id: uid, ...snap.data() } : null;
}

export async function updateSupplier(uid, data) {
  await setDoc(doc(db, "suppliers", uid), data, { merge: true });
}

export async function getSupplierProducts(uid) {
  const snap = await getDocs(collection(db, "suppliers", uid, "products"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addSupplierProduct(uid, product) {
  const ref = await addDoc(collection(db, "suppliers", uid, "products"), {
    ...product,
    createdAt: Timestamp.now(),
  });
  return { id: ref.id, ...product };
}

export async function updateSupplierProduct(uid, productId, data) {
  await updateDoc(doc(db, "suppliers", uid, "products", productId), data);
}

export async function deleteSupplierProduct(uid, productId) {
  await deleteDoc(doc(db, "suppliers", uid, "products", productId));
}

export async function getAllSuppliers() {
  const snap = await getDocs(collection(db, "suppliers"));
  return snap.docs.map((d) => ({ uid: d.id, id: d.id, ...d.data() }));
}

export async function getApprovedSuppliers() {
  const q = query(collection(db, "suppliers"), where("approved", "==", true), where("banned", "==", false));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, id: d.id, ...d.data() }));
}

export async function addSupplierOffer(uid, supplierName, supplierPhone, offer) {
  const ref = await addDoc(collection(db, "offers"), {
    supplierId: uid,
    supplierName,
    supplierPhone,
    title: offer.title,
    description: offer.description || "",
    discount: offer.discount || "",
    endDate: offer.endDate ? Timestamp.fromDate(new Date(offer.endDate)) : null,
    active: true,
    createdAt: Timestamp.now(),
  });
  return { id: ref.id, ...offer, supplierId: uid };
}

export async function getSupplierOffers(uid) {
  const q = query(collection(db, "offers"), where("supplierId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteSupplierOffer(offerId) {
  await deleteDoc(doc(db, "offers", offerId));
}

export async function getSuppliersWithPrices() {
  const q = query(collection(db, "suppliers"), where("approved", "==", true), where("banned", "==", false));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, id: d.id, ...d.data() })).filter((s) => s.prices && Object.values(s.prices).some((v) => v > 0));
}

export async function addRating(uid, data) {
  const ref = await addDoc(collection(db, "suppliers", uid, "ratings"), {
    userName: data.userName || "مستخدم",
    rating: data.rating,
    comment: data.comment || "",
    createdAt: Timestamp.now(),
  });
  return { id: ref.id, ...data };
}

export async function getSupplierRatings(uid) {
  const snap = await getDocs(collection(db, "suppliers", uid, "ratings"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getActiveOffers() {
  const q = query(collection(db, "offers"), where("active", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((o) => {
    if (!o.endDate) return true;
    const end = o.endDate.toDate ? o.endDate.toDate() : new Date(o.endDate);
    return end > new Date();
  });
}
