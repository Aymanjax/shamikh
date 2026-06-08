import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import type { FirebaseTimestamp } from "../types";

export function now(): FirebaseTimestamp {
  return Timestamp.now();
}

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof (value as any).toDate === "function") return (value as any).toDate();
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  if (typeof (value as any).seconds === "number") return new Date((value as any).seconds * 1000);
  return null;
}

export function isExpired(timestamp: unknown): boolean {
  const date = toDate(timestamp);
  return date ? date.getTime() < Date.now() : true;
}

export { Timestamp } from "firebase-admin/firestore";

export const collections = {
  users: (uid: string) => ({
    doc: db.doc(`users/${uid}`),
    profile: db.doc(`users/${uid}/profile/main`),
    projects: db.collection(`users/${uid}/projects`),
    notifications: db.collection(`users/${uid}/notifications`),
  }),
  usersPublic: db.collection("users-public"),
  suppliers: db.collection("suppliers"),
  supplierProducts: (sid: string) => db.collection(`suppliers/${sid}/products`),
  supplierRatings: (sid: string) => db.collection(`suppliers/${sid}/ratings`),
  offers: db.collection("offers"),
  announcements: db.collection("announcements"),
  config: db.doc("config/program"),
  invoices: db.collection("invoices"),
  workers: db.collection("workers"),
  visitors: db.collection("visitors"),
  auditLogs: db.collection("audit_logs"),
  presence: db.collection("presence"),
};
