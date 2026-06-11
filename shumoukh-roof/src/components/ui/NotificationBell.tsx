import { useState, useEffect, useRef } from "react";
import { Bell, Info, AlertTriangle, RefreshCw, Wrench, Check } from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";
import { useAuthStore } from "../../store/authStore";
import {
  subscribePublishedAnnouncements,
  subscribeUserNotifications,
  markNotificationRead,
} from "../../services/announcementService";
import { useT, formatDate } from "../../i18n";
import type { ElementType } from "react";

const typeIcons: Record<string, ElementType> = {
  info: Info,
  warning: AlertTriangle,
  update: RefreshCw,
  maintenance: Wrench,
};

const typeColors: Record<string, string> = {
  info: "bg-olive-600",
  warning: "bg-amber-500",
  update: "bg-emerald-500",
  maintenance: "bg-red-500",
};

export default function NotificationBell({ collapsed, position = "left" }: { collapsed?: boolean; position?: "left" | "center" | "right" }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const announcements = useNotificationStore((s) => s.announcements);
  const userNotifications = useNotificationStore((s) => s.userNotifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const announcementPrefEnabled = useNotificationStore((s) => s.announcementPrefEnabled);
  const setAnnouncements = useNotificationStore((s) => s.setAnnouncements);
  const setUserNotifications = useNotificationStore((s) => s.setUserNotifications);

  useEffect(() => {
    if (!user) return;
    const unsubA = subscribePublishedAnnouncements(
      setAnnouncements,
      (err) => console.error("Announcements subscription error:", err)
    );
    const unsubN = subscribeUserNotifications(user.uid, setUserNotifications);
    return () => {
      unsubA();
      unsubN();
    };
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkRead = async (announcementId: string) => {
    if (!user) return;
    await markNotificationRead(user.uid, announcementId);
  };

  const isRead = (announcementId?: string) => {
    if (!announcementId) return true;
    return userNotifications.some((n) => n.announcementId === announcementId && n.read);
  };

  if (!announcementPrefEnabled) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative rounded-xl transition-all duration-200 ${
          collapsed
            ? "p-2.5 text-earth-400 hover:text-terracotta-400 hover:bg-white/5"
            : "p-2 text-earth-400 hover:text-terracotta-400 hover:bg-white/5"
        }`}
      >
        <Bell className={collapsed ? "w-5 h-5" : "w-5 h-5"} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 min-w-[18px] min-h-[18px] px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute bottom-full mb-2 bg-white border-2 border-earth-200 rounded-2xl shadow-2xl z-[100] max-h-80 overflow-y-auto ${
            position === "center" ? "left-1/2 -translate-x-1/2" : position === "right" ? "right-0" : "left-0"
          } w-72 sm:w-80`}
        >
          <div className="sticky top-0 bg-white border-b-2 border-earth-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
            <h3 className="text-sm font-black text-earth-900">{t("misc.notifications.title")}</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-black text-earth-500 bg-earth-100 px-2 py-0.5 rounded-lg">
                {t("misc.notifications.unread", { n: unreadCount })}
              </span>
            )}
          </div>

          {announcements.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 mx-auto mb-2 text-earth-300" />
              <p className="text-sm text-earth-500 font-bold">{t("misc.notifications.empty")}</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-earth-50">
              {announcements.slice(0, 10).map((a) => {
                const Icon = typeIcons[a.type] || Info;
                const color = typeColors[a.type] || "bg-olive-600";
                const read = isRead(a.id);
                return (
                  <div
                    key={a.id}
                    className={`px-4 py-3 transition cursor-pointer ${
                      read ? "opacity-60" : "hover:bg-earth-50"
                    }`}
                    onClick={() => a.id && !read && handleMarkRead(a.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {!read && (
                            <span className="w-2 h-2 rounded-full bg-olive-600 shrink-0" />
                          )}
                          <h4 className="text-xs font-black text-earth-900 truncate">
                            {a.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-earth-500 line-clamp-2">
                          {a.content}
                        </p>
                        {a.createdAt && (
                          <p className="text-[9px] text-earth-400 mt-1">
                            {formatDate(new Date(a.createdAt.seconds * 1000))}
                          </p>
                        )}
                      </div>
                      {read && (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
