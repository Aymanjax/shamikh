import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  User, Building2, Palette, Bell, Shield, Package,
  ChevronLeft, Settings as SettingsIcon, CreditCard, ArrowRight,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { checkPermissions, getSubscriptionLabel } from "../../utils/subscriptionUtils";
import ExtraItemsPage from "./ExtraItemsPage";
import ProfileTab from "./ProfileTab";
import CompanyTab from "./CompanyTab";
import AppearanceTab from "./AppearanceTab";
import NotificationsTab from "./NotificationsTab";
import SecurityTab from "./SecurityTab";

type Section = { icon: typeof User; label: string; desc: string; tab: string };

const groups: { title: string; sections: Section[] }[] = [
  {
    title: "الحساب",
    sections: [
      { icon: User, label: "الملف الشخصي", desc: "الاسم، البريد الإلكتروني، رقم الهاتف", tab: "profile" },
      { icon: Building2, label: "الشركة", desc: "اسم الشركة، العنوان، الشعار", tab: "company" },
      { icon: Shield, label: "الأمان", desc: "كلمة السر وحماية الحساب", tab: "security" },
    ],
  },
  {
    title: "أدوات العمل",
    sections: [
      { icon: Package, label: "المواد الإضافية", desc: "بنود إضافية تظهر في حاسبة البضاعة", tab: "extra-items" },
    ],
  },
  {
    title: "التطبيق",
    sections: [
      { icon: Palette, label: "المظهر", desc: "الوضع الليلي وحجم الخط", tab: "appearance" },
      { icon: Bell, label: "الإشعارات", desc: "التنبيهات داخل التطبيق", tab: "notifications" },
    ],
  },
];

const tabs: Record<string, ReactNode> = {
  "extra-items": <ExtraItemsPage />,
  profile: <ProfileTab />,
  company: <CompanyTab />,
  appearance: <AppearanceTab />,
  notifications: <NotificationsTab />,
  security: <SecurityTab />,
};

export default function SettingsPage() {
  const params = new URLSearchParams(useLocation().search);
  const activeTab = params.get("tab") || "";
  const subscription = useAuthStore((s) => s.subscription);
  const perms = checkPermissions(subscription ?? undefined);
  const planLabel = getSubscriptionLabel(perms.subscriptionType);
  const subscriptionActive = !perms.isExpired && perms.subscriptionType !== "limited";

  if (activeTab && tabs[activeTab]) {
    return (
      <div className="space-y-4">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-earth-600 hover:text-terracotta-500 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          رجوع إلى الإعدادات
        </Link>
        {tabs[activeTab]}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-sm bg-terracotta-500 flex items-center justify-center border-l-3 border-terracotta-300 shrink-0">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-earth-900 tracking-tight">الإعدادات</h1>
          <p className="text-sm text-earth-500">إدارة حسابك وأدوات عملك</p>
        </div>
      </div>

      {/* شريط الاشتراك */}
      <Link
        to="/subscription"
        className="earth-card p-4 flex items-center justify-between gap-3 group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-sm bg-terracotta-100 border-l-2 border-terracotta-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-terracotta-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-earth-900">
              الاشتراك: {planLabel}
            </p>
            <p className={`text-xs font-bold ${subscriptionActive ? "text-earth-500" : "text-red-600"}`}>
              {subscriptionActive
                ? `متبقي ${perms.daysRemaining} يوم`
                : "منتهي — اضغط للتجديد"}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-olive-700 inline-flex items-center gap-1 shrink-0 group-hover:gap-2 transition-all">
          إدارة الاشتراك
          <ChevronLeft className="w-4 h-4" />
        </span>
      </Link>

      {/* أقسام الإعدادات */}
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="text-xs font-black text-earth-500 mb-2 pr-1">{g.title}</h2>
          <div className="earth-card divide-y divide-earth-100 overflow-hidden">
            {g.sections.map((s) => (
              <Link
                key={s.tab}
                to={`/settings?tab=${s.tab}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-earth-50 transition-colors group min-h-[56px]"
              >
                <div className="w-9 h-9 shrink-0 rounded-sm bg-earth-100 border border-earth-200 flex items-center justify-center">
                  <s.icon className="w-4.5 h-4.5 text-earth-600 group-hover:text-terracotta-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-earth-900 text-sm">{s.label}</h3>
                  <p className="text-xs text-earth-500 truncate">{s.desc}</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-earth-300 shrink-0 group-hover:text-terracotta-500 group-hover:-translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
