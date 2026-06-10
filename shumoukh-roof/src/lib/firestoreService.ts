// خدمة البيانات — كل مجموعات المستخدم محفوظة تحت users/{uid}/...
// قواعد Firestore تسمح بالكتابة فقط داخل ملف المستخدم، لذلك كل عملية حفظ
// تمر من هنا تُربط بحساب المستخدم الحالي تلقائياً.
import { db, auth } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type { CollectionReference, DocumentData } from "firebase/firestore";

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("يجب تسجيل الدخول أولاً");
  return uid;
}

function userCollection(name: string): CollectionReference<DocumentData> {
  return collection(db, "users", requireUid(), name);
}

export async function addDocument(coll: string, data: object) {
  return addDoc(userCollection(coll), { ...data, createdAt: Timestamp.now() });
}

export async function updateDocument(coll: string, id: string, data: object) {
  return updateDoc(doc(userCollection(coll), id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteDocument(coll: string, id: string) {
  return deleteDoc(doc(userCollection(coll), id));
}

export async function getDocument(coll: string, id: string) {
  const snap = await getDoc(doc(userCollection(coll), id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listDocuments(coll: string) {
  const q = query(userCollection(coll), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export { Timestamp };
