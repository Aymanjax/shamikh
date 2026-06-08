import { Link, useLocation } from "react-router-dom";
import { User, Building2, Palette, Bell, Shield, Package, ChevronLeft, HardHat } from "lucide-react";
import ExtraItemsPage from "./ExtraItemsPage";
import ProfileTab from "./ProfileTab";
import CompanyTab from "./CompanyTab";
import AppearanceTab from "./AppearanceTab";
import NotificationsTab from "./NotificationsTab";
import SecurityTab from "./SecurityTab";

const sections = [
  { icon: User, label: "الملف الشخصي", desc: "الاسم، البريد الإلكتروني، رقم الهاتف", tab: "profile" },
  { icon: Building2, label: "الشركة", desc: "اسم الشركة، العنوان، الشعار", tab: "company" },
  { icon: Package, label: "المواد الإضافية", desc: "إدارة المواد الإضافية في الحاسبة", tab: "extra-items" },
  { icon: Palette, label: "المظهر", desc: "الوضع الليلي، حجم الخط", tab: "appearance" },
  { icon: Bell, label: "الإشعارات", desc: "إعدادات التنبيهات والإشعارات", tab: "notifications" },
  { icon: Shield, label: "الأمان", desc: "كلمة السر، المصادقة الثنائية", tab: "security" },
];

export default function SettingsPage() {
  const params = new URLSearchParams(useLocation().search);
  const activeTab = params.get("tab") || "";

  if (activeTab === "extra-items") return <ExtraItemsPage />;
  if (activeTab === "profile") return <ProfileTab />;
  if (activeTab === "company") return <CompanyTab />;
  if (activeTab === "appearance") return <AppearanceTab />;
  if (activeTab === "notifications") return <NotificationsTab />;
  if (activeTab === "security") return <SecurityTab />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-sm bg-terracotta-500 flex items-center justify-center shadow-lg shadow-terracotta-500/30">
          <HardHat className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-ink-primary tracking-tight">الإعدادات</h1>
          <p className="text-sm text-ink-muted">تعديل إعدادات الحساب والنظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link key={s.tab} to={`/settings?tab=${s.tab}`}
            className="earth-card p-4 hover:border-earth-300 transition-all duration-200 group min-h-[60px] flex items-center">
            <div className="flex items-center gap-3 w-full min-w-0">
              <div className="w-11 h-11 shrink-0 rounded-sm bg-terracotta-100 border-2 border-earth-200 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-terracotta-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-ink-primary text-sm">{s.label}</h3>
                <p className="text-xs text-ink-muted truncate">{s.desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-earth-300 shrink-0 group-hover:text-terracotta-500 transition" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
