import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function ProtectedRoute({ children }) {
  const { user, loading, banned, subscription } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (banned) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="bg-[#0f172a] border border-red-500/20 rounded-3xl p-8 text-center max-w-sm mx-4">
          <i className="fa-solid fa-ban text-5xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-black text-red-400 mb-2">تم حظر حسابك</h2>
          <p className="text-slate-400 text-sm">حسابك محظور من قبل إدارة النظام. يرجى التواصل مع الدعم الفني.</p>
        </div>
      </div>
    );
  }

  const sub = subscription;
  if (sub && sub.expiresAt && sub.plan !== "lifetime") {
    const now = Date.now();
    const expiry = sub.expiresAt?.toMillis?.() || sub.expiresAt;
    if (expiry < now) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#020617]">
          <div className="bg-[#0f172a] border border-amber-500/20 rounded-3xl p-8 text-center max-w-sm mx-4">
            <i className="fa-solid fa-clock text-5xl text-amber-500 mb-4"></i>
            <h2 className="text-xl font-black text-amber-400 mb-2">انتهت صلاحية الاشتراك</h2>
            <p className="text-slate-400 text-sm mb-4">صلاحية اشتراكك منتهية. يرجى التواصل مع الإدارة لتجديد الاشتراك.</p>
            <button onClick={() => {
              useAuthStore.getState().refreshProfile(user.uid);
            }} className="bg-brand-600 hover:bg-brand-700 py-2 px-5 rounded-xl font-bold text-sm transition">
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
}
