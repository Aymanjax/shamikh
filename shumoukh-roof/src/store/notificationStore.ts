import { create } from "zustand";
import type { Announcement } from "../types";

type UserNotification = {
  id: string;
  announcementId: string;
  read: boolean;
  readAt?: any;
};

type NotificationState = {
  announcements: Announcement[];
  userNotifications: UserNotification[];
  unreadCount: number;
  announcementPrefEnabled: boolean;
  setAnnouncements: (items: Announcement[]) => void;
  setUserNotifications: (items: UserNotification[]) => void;
  setAnnouncementPref: (enabled: boolean) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  announcements: [],
  userNotifications: [],
  unreadCount: 0,
  announcementPrefEnabled: true,
  setAnnouncements: (items) =>
    set((state) => {
      const unread = items.filter(
        (a) =>
          a.id &&
          !state.userNotifications.find(
            (n) => n.announcementId === a.id && n.read
          )
      ).length;
      return { announcements: items, unreadCount: unread };
    }),
  setUserNotifications: (items) =>
    set((state) => {
      const unread = state.announcements.filter(
        (a) =>
          a.id &&
          !items.find((n) => n.announcementId === a.id && n.read)
      ).length;
      return { userNotifications: items, unreadCount: unread };
    }),
  setAnnouncementPref: (enabled) => set({ announcementPrefEnabled: enabled }),
}));
