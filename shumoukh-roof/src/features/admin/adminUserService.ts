// @ts-nocheck
import { db } from "../../lib/firebase";
import { collection, getDocs, getDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { SUBSCRIPTION_TYPES, toJsDate } from "../../utils/subscriptionUtils";
import type { SubscriptionType } from "../../utils/subscriptionUtils";

export type UserProfile = {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role?: "user" | "admin";
  banned?: boolean;
  companyName?: string;
  createdAt?: string;
  subscription?: {
    subscriptionType?: string;
    trialStartDate?: any;
    subscriptionEndDate?: any;
    isLinkedToNationalInvoice?: boolean;
  };
  projectsCount?: number;
  lastLogin?: any;
  subExpiry?: Date | null;
  isExpired?: boolean;
};

export type TodayLogin = {
  uid: string;
  email?: string;
  displayName?: string;
  lastLogin: string;
};

export async function listAllUsers(): Promise<UserProfile[]> {
  const s = await getDocs(collection(db, "users-public"));
  const list = s.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
  const enriched = await Promise.all(
    list.map(async (u) => {
      try {
        const prof = await getDoc(doc(db, "users", u.uid, "profile", "main"));
        const data = prof.exists() ? prof.data() : {};
        const sub = data.subscription || {};
        const exp = toJsDate(sub.subscriptionEndDate);
        return {
          ...u,
          role: data.role || "user",
          banned: data.banned === true,
          companyName: data.companyName || "",
          createdAt: data.createdAt || "",
          subscription: sub,
          subExpiry: exp,
          isExpired: exp ? exp < new Date() : false,
        };
      } catch {
        return u;
      }
    })
  );
  return enriched;
}

export async function updateUserRole(uid: string, role: "user" | "admin") {
  await setDoc(doc(db, "users", uid, "profile", "main"), { role }, { merge: true });
}

export async function toggleBan(uid: string, currentlyBanned: boolean) {
  await setDoc(doc(db, "users", uid, "profile", "main"), { banned: !currentlyBanned }, { merge: true });
}

export async function setSubscriptionByDays(uid: string, plan: string, days: number) {
  const now = new Date();
  let trialStartDate = null;
  let subscriptionEndDate = null;
  if (plan === SUBSCRIPTION_TYPES.FREE_TRIAL) {
    trialStartDate = Timestamp.fromDate(now);
    subscriptionEndDate = Timestamp.fromDate(new Date(now.getTime() + days * 86400000));
  } else if (plan !== SUBSCRIPTION_TYPES.LIMITED) {
    subscriptionEndDate = Timestamp.fromDate(new Date(now.getTime() + days * 86400000));
  }
  const sub = {
    subscriptionType: plan,
    trialStartDate,
    subscriptionEndDate,
    isLinkedToNationalInvoice: plan === SUBSCRIPTION_TYPES.ADVANCED,
  };
  await setDoc(doc(db, "users", uid, "profile", "main"), { subscription: sub }, { merge: true });
}

export async function setSubscriptionByDate(uid: string, plan: string, expiryDate: string) {
  const expiresAt = expiryDate ? new Date(expiryDate) : null;
  const sub: any = {
    subscriptionType: plan,
    trialStartDate: plan === SUBSCRIPTION_TYPES.FREE_TRIAL ? Timestamp.fromDate(new Date()) : null,
    subscriptionEndDate: expiresAt ? Timestamp.fromDate(expiresAt) : null,
    isLinkedToNationalInvoice: plan === SUBSCRIPTION_TYPES.ADVANCED,
  };
  if (plan === SUBSCRIPTION_TYPES.FREE_TRIAL && !expiresAt) {
    const now = new Date();
    sub.trialStartDate = Timestamp.fromDate(now);
  }
  await setDoc(doc(db, "users", uid, "profile", "main"), { subscription: sub }, { merge: true });
}

export async function fetchTodayLogins(): Promise<TodayLogin[]> {
  const res = await fetch("/api/admin/today-logins", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
  });
  if (!res.ok) throw new Error("فشل جلب سجل دخول اليوم");
  const data = await res.json();
  return data.data || [];
}
