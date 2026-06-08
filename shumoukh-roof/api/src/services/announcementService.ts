import { collections, Timestamp } from "./firestore";
import type { Announcement } from "../types";

export async function createAnnouncement(
  data: Omit<Announcement, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await collections.announcements.add({
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  const snap = await collections.announcements.doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Announcement;
}

export async function listAnnouncements(publishedOnly = false): Promise<Announcement[]> {
  let query: FirebaseFirestore.Query = collections.announcements;

  if (publishedOnly) {
    query = query.where("published", "==", true);
  }

  const snap = await query.orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement);
}

export async function updateAnnouncement(
  id: string,
  data: Partial<Announcement>
): Promise<void> {
  await collections.announcements.doc(id).update({
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await collections.announcements.doc(id).delete();
}

export async function markAsRead(
  uid: string,
  announcementId: string
): Promise<void> {
  await collections
    .users(uid)
    .notifications.doc(announcementId)
    .set(
      { announcementId, read: true, readAt: Timestamp.now() },
      { merge: true }
    );
}

export async function markAsUnread(uid: string, announcementId: string): Promise<void> {
  await collections
    .users(uid)
    .notifications.doc(announcementId)
    .set({ read: false, readAt: null }, { merge: true });
}

export async function getUserNotifications(uid: string) {
  const snap = await collections.users(uid).notifications.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
