import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logoutUser } from "../../services/authService";

export default function ProtectedRoute({ children }) {
  const { user, loading, banned, subscription, sessionInvalid } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-alt">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (sessionInvalid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-alt">
        <div className="bg-white border border-amber-200 rounded-3xl p-8 text-center max-w-sm mx-4 shadow-sm">
          <i className="fa-solid fa-mobile-screen-button text-5xl text-amber-500 mb-4"></i>
          <h2 className="text-xl font-black text-amber-700 mb-2">تم تسجيل الدخول من جهاز آخر</h2>
          <p className="text-ink-muted text-sm mb-4">تم تسجيل الدخول من جهاز آخر، سيتم تسجيل الخروج من هذا الجهاز.</p>
          <button onClick={() => logoutUser()}
            className="bg-brand-600 hover:bg-brand-700 text-white py-2 px-5 rounded-xl font-bold text-sm transition">
            حسناً
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (banned) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-alt">
        <div className="bg-white border border-red-200 rounded-3xl p-8 text-center max-w-sm mx-4 shadow-sm">
          <i className="fa-solid fa-ban text-5xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-black text-red-700 mb-2">تم حظر حسابك</h2>
          <p className="text-ink-muted text-sm mb-3">حسابك محظور من قبل إدارة النظام. يرجى التواصل مع الدعم الفني.</p>
          <a href={`https://wa.me/00962788859723`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl text-sm transition">
            <i className="fa-brands fa-whatsapp"></i> 00962788859723
          </a>
        </div>
      </div>
    );
  }

  const sub = subscription;

  if (!sub || !sub.plan || sub.plan === "free") {
    return <Navigate to="/plans" replace />;
  }

  if (sub.plan !== "lifetime") {
    let expiry = null;
    if (sub.expiresAt) {
      if (typeof sub.expiresAt.toMillis === "function") {
        expiry = sub.expiresAt.toMillis();
      } else if (sub.expiresAt instanceof Date) {
        expiry = sub.expiresAt.getTime();
      } else if (typeof sub.expiresAt === "number") {
        expiry = sub.expiresAt;
      } else if (typeof sub.expiresAt === "string") {
        expiry = new Date(sub.expiresAt).getTime();
      }
    }
    if (expiry && expiry < Date.now()) {
      return <Navigate to="/plans" replace />;
    }
  }

  return children;
}
