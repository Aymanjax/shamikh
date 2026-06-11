// @ts-nocheck
import { useState, useEffect } from "react";
import { Bell, Save, Check, ArrowRight, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useT } from "../../i18n";
import GlassButton from "../../components/ui/GlassButton";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative shrink-0 w-14 h-8 rounded-sm transition border-2 ${value ? "bg-terracotta-500 border-terracotta-500" : "bg-earth-200 border-earth-300"}`}>
      <span className={`absolute top-0.5 w-7 h-7 bg-white rounded-full shadow transition ${value ? "right-0.5" : "right-[1.35rem]"}`} />
    </button>
  );
}

export default function NotificationsTab() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const announcementPrefEnabled = useNotificationStore((s) => s.announcementPrefEnabled);
  const setAnnouncementPref = useNotificationStore((s) => s.setAnnouncementPref);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [invoiceAlerts, setInvoiceAlerts] = useState(true);
  const [announceAlerts, setAnnounceAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid, "profile", "main")).then((snap) => {
      if (snap.exists() && snap.data().notifications) {
        const n = snap.data().notifications;
        setEmailAlerts(n.emailAlerts ?? true);
        setPushAlerts(n.pushAlerts ?? true);
        setInvoiceAlerts(n.invoiceAlerts ?? true);
        setAnnounceAlerts(n.announceAlerts ?? true);
        setAnnouncementPref(n.announceAlerts ?? true);
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await setDoc(doc(db, "users", user.uid, "profile", "main"), {
      notifications: { emailAlerts, pushAlerts, invoiceAlerts, announceAlerts },
    }, { merge: true });
    setAnnouncementPref(announceAlerts);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-terracotta-500 flex items-center justify-center shadow-lg shadow-terracotta-500/30">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-ink-primary tracking-tight">{t("settings.notifications.title")}</h1>
            <p className="text-sm text-ink-muted">{t("settings.notifications.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Link to="/settings" className="text-ink-muted hover:text-ink-secondary transition p-2 touch-target">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <GlassButton variant="primary" size="sm" icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} onClick={handleSave} disabled={saving}>
            {saved ? t("settings.done") : t("common.save")}
          </GlassButton>
        </div>
      </div>

      <div className="earth-card p-5 divide-y-2 divide-earth-200">
        {[
          { label: t("settings.notifications.email"), desc: t("settings.notifications.emailDesc"), value: emailAlerts, onChange: setEmailAlerts },
          { label: t("settings.notifications.push"), desc: t("settings.notifications.pushDesc"), value: pushAlerts, onChange: setPushAlerts },
          { label: t("settings.notifications.invoices"), desc: t("settings.notifications.invoicesDesc"), value: invoiceAlerts, onChange: setInvoiceAlerts },
          { label: t("settings.notifications.announcements"), desc: t("settings.notifications.announcementsDesc"), value: announceAlerts, onChange: (v: boolean) => { setAnnounceAlerts(v); }, icon: Megaphone },
        ].map((item, i) => (
          <div key={i} className="py-4 flex items-center justify-between gap-3 min-h-[52px]">
            <div className="min-w-0">
              <h3 className="text-sm font-black text-ink-primary">{item.label}</h3>
              <p className="text-xs text-ink-muted">{item.desc}</p>
            </div>
            <Toggle value={item.value} onChange={item.onChange} />
          </div>
        ))}
      </div>
    </div>
  );
}
