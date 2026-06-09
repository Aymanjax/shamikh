import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthChange } from "../features/auth/authService";
import { useAuthStore } from "../store/authStore";
import { getUserProfile } from "../features/auth/authService";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import LandingPage from "../features/dashboard/LandingPage";
import CalculatorPage from "../features/calculator/CalculatorPage";
import InvoicesPage from "../features/invoices/InvoicesPage";
import WorkersPage from "../features/workers/WorkersPage";
import ProjectsPage from "../features/projects/ProjectsPage";
import SettingsPage from "../features/settings/SettingsPage";
import AdminDashboard from "../features/admin/AdminDashboard";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import ThemeBackgroundLayer from "../features/theme/ThemeBackgroundLayer";
import { useApplyPageTheme } from "../features/theme/useApplyPageTheme";

export default function App() {
  // Applies global + per-page theme (colors & background) on every route change,
  // incl. /login and /register which live outside AppLayout.
  useApplyPageTheme();

  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);
  const setCompanyName = useAuthStore((s) => s.setCompanyName);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setSubscription = useAuthStore((s) => s.setSubscription);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      try {
        if (fbUser) {
          setUser(fbUser);
          const profile = await getUserProfile(fbUser.uid);
          if (profile) {
            setRole(profile.role || "user");
            setCompanyName(profile.companyName || "");
            setSubscription(profile.subscription || null);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch {
        setUser(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  return (
    <>
      <ThemeBackgroundLayer />
      <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout isAdmin={role === "admin"} />
          </ProtectedRoute>
        }
      >
        <Route index element={<LandingPage />} />
        <Route path="calculator" element={<CalculatorPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="workers" element={<WorkersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
