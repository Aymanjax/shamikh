import { db } from "../lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDoc,
  getDocs, query, orderBy, Timestamp, where, onSnapshot,
  setDoc,
} from "firebase/firestore";
import type { Announcement } from "../types";

const COLLECTION = "announcements";

export async function createAnnouncement(data: Omit<Announcement, "id" | "createdAt" | "updatedAt">) {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteAnnouncement(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}

export async function getAnnouncement(id: string) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Announcement) : null;
}

export async function listAnnouncements() {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement);
}

export async function listPublishedAnnouncements() {
  const q = query(collection(db, COLLECTION), where("published", "==", true), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement);
}

export function subscribePublishedAnnouncements(callback: (items: Announcement[]) => void, onError?: (err: any) => void) {
  const q = query(collection(db, COLLECTION), where("published", "==", true), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement));
  }, (err) => {
    if (onError) onError(err);
  });
}

export function subscribeAllAnnouncements(callback: (items: Announcement[]) => void, onError?: (err: any) => void) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement));
  }, (err) => {
    if (onError) onError(err);
  });
}

export async function getUserNotifications(uid: string) {
  const q = query(collection(db, "users", uid, "notifications"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markNotificationRead(uid: string, announcementId: string) {
  const ref = doc(db, "users", uid, "notifications", announcementId);
  return setDoc(ref, { announcementId, read: true, readAt: Timestamp.now() }, { merge: true });
}

export async function markNotificationUnread(uid: string, announcementId: string) {
  const ref = doc(db, "users", uid, "notifications", announcementId);
  return setDoc(ref, { read: false, readAt: null }, { merge: true });
}

export function subscribeUserNotifications(uid: string, callback: (items: any[]) => void) {
  const q = query(collection(db, "users", uid, "notifications"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
