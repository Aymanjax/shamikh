import { auth } from "../config/firebase";
import { collections, Timestamp } from "./firestore";
import type {
  UserProfile,
  PublicUserProfile,
  ProgramConfig,
  AuditLog,
  SubscriptionPlan,
} from "../types";

// ── Program Config ──

const DEFAULT_CONFIG: ProgramConfig = {
  tileCatalog: [
    { name: "بلانيوم سكني (Planum)", origin: "إسبانيا", count: 11, family: "terracotta", colorHex: "#d4784e", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/terracotta-seamless.jpg" },
    { name: "بلانيوم أسود (Planum)", origin: "إسبانيا", count: 11, family: "dark", colorHex: "#5a5a5a", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/dark-seamless.jpg" },
    { name: "بلاك ستون (Planum)", origin: "إسبانيا", count: 11, family: "dark", colorHex: "#4a4a4a", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/dark-seamless.jpg" },
    { name: "بلانيوم بني (Planum)", origin: "إسبانيا", count: 11, family: "brown", colorHex: "#8b5e3c", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/brown-seamless.jpg" },
    { name: "بلانوم أحمر (Planum)", origin: "إسبانيا", count: 11, family: "terracotta", colorHex: "#c46040", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/terracotta-seamless.jpg" },
    { name: "فيسيوم 3 رمادي (Visum3 Gray)", origin: "إسبانيا", count: 11.5, family: "dark", colorHex: "#6a6a6a", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/dark-seamless.jpg" },
    { name: "فيسيوم بني غامق (Visum3 Rustic)", origin: "إسبانيا", count: 11.5, family: "brown", colorHex: "#7a4e2c", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/brown-seamless.jpg" },
  ],
  marketLengths: [3.0, 3.3, 3.6, 3.9, 4.2, 4.8, 5.1, 5.4, 5.7, 6.0],
  orderItems: [
    { id: "tiles", name: "قرميد", unit: "حبة" },
    { id: "iron4x8", name: "حديد 4×8", unit: "تيوب" },
    { id: "iron10x10", name: "حديد 10×10", unit: "تيوب" },
    { id: "sharshef", name: "شراشف", unit: "م" },
    { id: "decor", name: "ديكور", unit: "ربطة" },
    { id: "ases", name: "اسس", unit: "قطعة" },
    { id: "long_ases", name: "اسس طويل", unit: "قطعة" },
    { id: "metal_sheets", name: "شرحات صاج", unit: "شريحة" },
    { id: "mishma", name: "مشمع", unit: "رول" },
    { id: "lati", name: "الواح لاتي", unit: "لوح" },
    { id: "zafta", name: "رول زفته", unit: "رول" },
    { id: "dehan_mai", name: "دهان مائي", unit: "علبة" },
    { id: "bakit_baraghi", name: "بكيت براغي", unit: "بكيت" },
  ],
  extraItems: [
    { name: "زيت حار", unit: "جلن" },
    { name: "فرنيش", unit: "جلن" },
    { name: "نفط", unit: "تنكة" },
    { name: "روف جارد", unit: "ك" },
    { name: "رول دهان", unit: "حبة" },
    { name: "فرش", unit: "حبة" },
    { name: "مسامير بولاد", unit: "بكيت" },
    { name: "مسامير فرد", unit: "بكيت" },
  ],
};

export async function getConfig(): Promise<ProgramConfig> {
  const snap = await collections.config.get();
  if (snap.exists) return snap.data() as ProgramConfig;
  return DEFAULT_CONFIG;
}

export async function saveConfig(data: Partial<ProgramConfig>): Promise<void> {
  await collections.config.set(data, { merge: true });
}

// ── User Management ──

export async function listAllUsers(): Promise<(UserProfile & { uid: string })[]> {
  const publicSnap = await collections.usersPublic.get();
  const users = publicSnap.docs.map((d) => ({ uid: d.id, ...d.data() }) as PublicUserProfile);

  const enriched = await Promise.all(
    users.map(async (u) => {
      try {
        const profSnap = await collections.users(u.uid).profile.get();
        const data = profSnap.data() || {};
        return {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          role: data.role || "user",
          banned: data.banned === true,
          companyName: data.companyName || "",
          createdAt: data.createdAt || "",
          subscription: data.subscription,
          lastLogin: u.lastLogin,
        } as UserProfile & { uid: string };
      } catch {
        return { uid: u.uid, email: u.email, displayName: u.displayName } as UserProfile & { uid: string };
      }
    })
  );

  return enriched;
}

export async function updateUserRole(uid: string, role: "user" | "admin"): Promise<void> {
  await collections.users(uid).profile.set({ role }, { merge: true });
}

export async function toggleUserBan(uid: string): Promise<void> {
  const snap = await collections.users(uid).profile.get();
  const current = snap.data()?.banned === true;
  await collections.users(uid).profile.set({ banned: !current }, { merge: true });
}

export async function setSubscription(
  uid: string,
  plan: SubscriptionPlan,
  days: number
): Promise<void> {
  const now = new Date();
  const sub: Record<string, unknown> = {
    subscriptionType: plan,
    subscriptionEndDate: Timestamp.fromDate(new Date(now.getTime() + days * 86400000)),
    isLinkedToNationalInvoice: plan === "advanced",
  };

  if (plan === "free_trial") {
    sub.trialStartDate = Timestamp.fromDate(now);
  }

  await collections.users(uid).profile.set({ subscription: sub }, { merge: true });
}

// ── Audit Log ──

export async function createAuditLog(entry: Omit<AuditLog, "createdAt">): Promise<void> {
  await collections.auditLogs.add({
    ...entry,
    createdAt: Timestamp.now(),
  });
}

export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  const snap = await collections
    .auditLogs
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as AuditLog);
}

// ── Presence ──

export async function getOnlineUsers(): Promise<string[]> {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const snap = await collections.presence.get();
  return snap.docs
    .filter((d) => {
      const data = d.data();
      const lastSeen = data.lastSeen?.toMillis?.() || 0;
      return lastSeen > fiveMinAgo;
    })
    .map((d) => d.id);
}

// ── Today's Logins ──

export interface TodayLogin {
  uid: string;
  email?: string;
  displayName?: string;
  lastLogin: Date;
}

export async function getTodayLogins(): Promise<TodayLogin[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const snap = await collections.usersPublic.get();

  return snap.docs
    .map((d) => {
      const data = d.data();
      const lastLogin = data.lastLogin?.toDate?.();
      return {
        uid: d.id,
        email: data.email,
        displayName: data.displayName,
        lastLogin,
      } as TodayLogin;
    })
    .filter((u) => u.lastLogin && u.lastLogin >= startOfDay && u.lastLogin < endOfDay)
    .sort((a, b) => b.lastLogin!.getTime() - a.lastLogin!.getTime());
}

// ── Dashboard Stats ──

export async function getDashboardStats() {
  const [users, suppliers, invoices, workers] = await Promise.all([
    collections.usersPublic.get().then((s) => s.size),
    collections.suppliers.get().then((s) => s.size),
    collections.invoices.get().then((s) => s.size),
    collections.workers.get().then((s) => s.size),
  ]);

  return { users, suppliers, invoices, workers };
}
