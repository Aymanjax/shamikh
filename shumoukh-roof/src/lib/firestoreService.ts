// @ts-nocheck
import { db } from "./firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import type { Firestore, CollectionReference, DocumentData } from "firebase/firestore";

const collections = {
  projects: "projects",
  invoices: "invoices",
  workers: "workers",
  extraItems: "extraItems",
};

async function getCollection(name: string): Promise<CollectionReference<DocumentData>> {
  return collection(db, name);
}

export async function addDocument(coll: string, data: any) {
  return addDoc(await getCollection(coll), { ...data, createdAt: Timestamp.now() });
}

export async function updateDocument(coll: string, id: string, data: any) {
  return updateDoc(doc(await getCollection(coll), id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteDocument(coll: string, id: string) {
  return deleteDoc(doc(await getCollection(coll), id));
}

export async function getDocument(coll: string, id: string) {
  const snap = await getDoc(doc(await getCollection(coll), id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listDocuments(coll: string) {
  const q = query(await getCollection(coll), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listDocumentsByUser(coll: string, userId: string) {
  const q = query(
    await getCollection(coll),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveProject(data: any) {
  const ref = await addDocument("projects", data);
  return ref;
}

export async function listProjects() {
  return listDocuments("projects");
}

export async function deleteProject(id: string) {
  return deleteDocument("projects", id);
}

export { Timestamp };
