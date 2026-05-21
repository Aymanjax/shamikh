import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function ProtectedRoute({ children }) {
  const { user, loading, subscription } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const sub = subscription;
  if (sub && sub.expiresAt) {
    const now = Date.now();
    const expiry = sub.expiresAt?.toMillis?.() || sub.expiresAt;
    if (expiry < now && sub.status !== "active") {
      return <Navigate to="/settings?expired=1" replace />;
    }
  }

  return children;
}
