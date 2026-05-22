import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";

const SUPPORT_PHONE = "00962788859723";

const PLANS = [
  {
    id: "basic",
    name: "الأساسية",
    subtitle: "Basic",
    icon: "fa-calculator",
    desc: "حاسبة القرميد + تصدير PDF + مشاركة واتساب",
    monthly: 5,
    yearly: 40,
    features: [
      "حساب كميات القرميد والحديد والخشب",
      "تصدير كشف مواد PDF",
      "إرسال الكميات عبر واتساب",
      "تحديثات مجانية",
    ],
    color: "from-emerald-500 to-emerald-600",
    shadow: "shadow-emerald-500/30",
    badgeColor: "bg-emerald-100 text-emerald-700",
    popular: false,
  },
  {
    id: "premium",
    name: "المتقدمة",
    subtitle: "Premium",
    icon: "fa-crown",
    desc: "إدارة كاملة للمشاريع والعمال والموردين والفواتير",
    monthly: 15,
    yearly: 99,
    features: [
      "كل مميزات الأساسية",
      "إدارة المشاريع والطلبيات",
      "شؤون العمال والرواتب",
      "إدارة الموردين",
      "الفواتير وعروض السعر",
      "التقارير المالية والإحصائيات",
    ],
    color: "from-amber-500 to-amber-600",
    shadow: "shadow-amber-500/30",
    badgeColor: "bg-amber-100 text-amber-700",
    popular: true,
  },
  {
    id: "lifetime",
    name: "مدى الحياة",
    subtitle: "Lifetime",
    icon: "fa-infinity",
    desc: "كل الميزات — دفعة واحدة — بدون تجديد",
    monthly: null,
    yearly: null,
    once: 350,
    features: [
      "كل مميزات المتقدمة",
      "بدون اشتراك شهري",
      "تحديثات مجانية للأبد",
      "دعم فني أولوية",
    ],
    color: "from-purple-500 to-purple-600",
    shadow: "shadow-purple-500/30",
    badgeColor: "bg-purple-100 text-purple-700",
    popular: false,
  },
];

function formatPrice(amount) {
  return amount ? `${amount} د.أ` : "—";
}

function whatsappUrl(msg) {
  return `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(msg)}`;
}

function PlanCard({ plan, user }) {
  const isLoggedIn = !!user;
  const buildMsg = (period) => {
    const price = period === "monthly" ? plan.monthly : plan.yearly;
    const periodLabel = period === "monthly" ? "شهرياً" : "سنوياً";
    const priceLabel = period === "once" ? `${plan.once} د.أ لمرة واحدة` : `${price} د.أ ${periodLabel}`;
    const lines = [
      "🔔 *طلب اشتراك - شموخ ERP*",
      "",
      `الخطة: ${plan.name} (${plan.subtitle})`,
      `المدة: ${periodLabel}`,
      `السعر: ${priceLabel}`,
    ];
    if (isLoggedIn) {
      lines.push("", `المستخدم: ${user.displayName || "—"}`, `البريد: ${user.email || "—"}`);
    }
    return lines.join("\n");
  };

  return (
    <div className={`bg-surface border-2 rounded-3xl p-6 flex flex-col shadow-lg hover:shadow-xl transition-all relative ${plan.popular ? "border-amber-400 scale-[1.02]" : "border-line hover:border-amber-300"}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-bold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
          <i className="fa-solid fa-star ml-1"></i> الأكثر طلباً
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg ${plan.shadow}`}>
          <i className={`fa-solid ${plan.icon} text-white`}></i>
        </div>
        <div>
          <h3 className="text-lg font-black text-ink">{plan.name}</h3>
          <p className="text-[10px] text-ink-muted">{plan.subtitle}</p>
        </div>
      </div>

      <p className="text-xs text-ink-muted mb-4">{plan.desc}</p>

      <div className="flex-1 space-y-2 mb-6">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <i className="fa-solid fa-check text-emerald-500 mt-0.5 shrink-0"></i>
            <span className="text-ink">{f}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t border-line">
        {plan.once ? (
          <div className="text-center mb-3">
            <span className="text-3xl font-black text-ink">{plan.once}</span>
            <span className="text-sm text-ink-muted mr-1">د.أ</span>
            <p className="text-[10px] text-ink-muted">لمرة واحدة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-center bg-surface-subtle rounded-xl p-3">
              <span className="text-xl font-black text-ink">{plan.monthly}</span>
              <span className="text-[10px] text-ink-muted mr-0.5">د.أ</span>
              <p className="text-[9px] text-ink-muted">شهرياً</p>
              <a href={whatsappUrl(buildMsg("monthly"))} target="_blank" rel="noopener noreferrer"
                className={`mt-2 inline-block w-full py-1.5 rounded-lg text-[10px] font-bold text-center transition ${plan.popular ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-surface border border-line text-ink hover:bg-surface-subtle"}`}>
                <i className="fa-brands fa-whatsapp ml-1"></i> طلب
              </a>
            </div>
            <div className="text-center bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <span className="text-xl font-black text-emerald-700">{plan.yearly}</span>
              <span className="text-[10px] text-emerald-600 mr-0.5">د.أ</span>
              <p className="text-[9px] text-emerald-600 font-bold">سنوياً</p>
              <a href={whatsappUrl(buildMsg("yearly"))} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-block w-full bg-emerald-600 text-white py-1.5 rounded-lg text-[10px] font-bold text-center hover:bg-emerald-700 transition">
                <i className="fa-brands fa-whatsapp ml-1"></i> طلب
              </a>
              {plan.monthly && (() => {
                const saving = Math.round((1 - plan.yearly / (plan.monthly * 12)) * 100);
                return (
                  <p className="text-[8px] text-emerald-600 font-bold mt-1">وفر {saving}%</p>
                );
              })()}
            </div>
          </div>
        )}

        {plan.once && (
          <a href={whatsappUrl(buildMsg("once"))} target="_blank" rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-3 rounded-xl text-sm text-center hover:from-purple-600 hover:to-purple-700 transition shadow-lg">
            <i className="fa-brands fa-whatsapp ml-1"></i> طلب الاشتراك
          </a>
        )}
      </div>
    </div>
  );
}

export default function PlansPage() {
  const { user, subscription, loading } = useAuthStore();

  const subLabel = subscription?.plan === "trial" ? "تجريبي" :
    subscription?.plan === "basic" ? "الأساسية" :
    subscription?.plan === "premium" ? "المتقدمة" :
    subscription?.plan === "lifetime" ? "مدى الحياة" : null;

  let expiryText = "";
  if (subscription?.expiresAt) {
    let exp = null;
    if (typeof subscription.expiresAt.toMillis === "function") exp = subscription.expiresAt.toMillis();
    else if (subscription.expiresAt instanceof Date) exp = subscription.expiresAt.getTime();
    else if (typeof subscription.expiresAt === "number") exp = subscription.expiresAt;
    else if (typeof subscription.expiresAt === "string") exp = new Date(subscription.expiresAt).getTime();
    if (exp) {
      const remaining = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24));
      expiryText = remaining > 0 ? `متبقي ${remaining} يوم` : "منتهي";
    }
  }

  return (
    <div className="min-h-screen bg-surface-alt">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-tr from-brand-600 to-amber-500 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30">
            <i className="fa-solid fa-hotel text-white text-xl"></i>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-ink">خطط الاشتراك</h1>
          <p className="text-sm text-ink-muted mt-2">اختر الخطة المناسبة لاحتياجك</p>

          {!loading && user && (
            <div className="mt-3 inline-flex items-center gap-2 bg-surface border border-line rounded-xl px-4 py-2 text-xs">
              <i className="fa-solid fa-circle-info text-brand-600"></i>
              <span className="text-ink-muted">خطتك الحالية:</span>
              <span className="font-bold text-ink">{subLabel || "بدون اشتراك"}</span>
              {expiryText && <span className="text-ink-muted">· {expiryText}</span>}
            </div>
          )}

          {!loading && !user && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-muted">
              <span>سجل دخولك لمشاهدة خطتك الحالية</span>
              <Link to="/login" className="text-brand-600 font-bold hover:text-brand-700">تسجيل دخول</Link>
              <span>أو</span>
              <Link to="/register" className="text-brand-600 font-bold hover:text-brand-700">إنشاء حساب</Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} user={user} />
          ))}
        </div>

        <div className="text-center mt-10">
          {user ? (
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition font-bold">
              <i className="fa-solid fa-arrow-right"></i> العودة للرئيسية
            </Link>
          ) : (
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition font-bold">
              <i className="fa-solid fa-arrow-right"></i> العودة لتسجيل الدخول
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
