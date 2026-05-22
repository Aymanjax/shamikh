import { useState, useEffect, lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { confirmResetPassword } from "./services/authService";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const PlansPage = lazy(() => import("./pages/PlansPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const NewProjectPage = lazy(() => import("./pages/NewProjectPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const CalculatorPage = lazy(() => import("./pages/CalculatorPage"));
const SuppliersPage = lazy(() => import("./pages/SuppliersPage"));
const WorkersPage = lazy(() => import("./pages/WorkersPage"));
const WorkerDetailPage = lazy(() => import("./pages/WorkerDetailPage"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const NewInvoicePage = lazy(() => import("./pages/NewInvoicePage"));
const InvoiceDetailPage = lazy(() => import("./pages/InvoiceDetailPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SupplierLoginPage = lazy(() => import("./pages/SupplierLoginPage"));
const SupplierRegisterPage = lazy(() => import("./pages/SupplierRegisterPage"));
const SupplierDashboard = lazy(() => import("./pages/SupplierDashboard"));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-alt">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.png" alt="شموخ" className="w-20 h-20 object-contain" />
        <h1 className="text-xl font-black text-ink">شموخ ERP</h1>
        <p className="text-sm text-ink-muted">نظام إدارة مشاريع القرميد</p>
        <div className="w-8 h-8 border-[3px] border-line border-t-brand-600 rounded-full animate-spin mt-2"></div>
      </div>
    </div>
  );
}

function ResetPasswordView({ oobCode }) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await confirmResetPassword(oobCode, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4">
        <div className="bg-surface border border-line rounded-3xl p-8 max-w-sm w-full shadow-sm text-center">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-xl flex items-center gap-2 mb-4">
            <i className="fa-solid fa-check-circle"></i>
            تم تغيير كلمة السر بنجاح
          </div>
          <a href="/shamikh/#/login"
            className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition">
            تسجيل الدخول
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-3xl p-8 max-w-sm w-full shadow-sm">
        <h2 className="text-xl font-black text-ink mb-1">إعادة تعيين كلمة السر</h2>
        <p className="text-sm text-ink-muted mb-6">أدخل كلمة السر الجديدة</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-muted">كلمة السر الجديدة</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
              className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition" />
          </div>
          <button type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl shadow-sm hover:shadow-md transition">
            تغيير كلمة السر
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const init = useAuthStore((s) => s.init);
  const [resetOobCode, setResetOobCode] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get("oobCode");
    const mode = params.get("mode");
    if (mode === "resetPassword" && oobCode) {
      setResetOobCode(oobCode);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const unsub = init();
    return () => unsub?.();
  }, [init]);

  if (resetOobCode) {
    return <ResetPasswordView oobCode={resetOobCode} />;
  }

  return (
    <HashRouter>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/supplier/login" element={<SupplierLoginPage />} />
            <Route path="/supplier/register" element={<SupplierRegisterPage />} />
            <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/new" element={<NewProjectPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="projects/:id/order" element={<OrderPage />} />
              <Route path="calculator" element={<CalculatorPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="workers" element={<WorkersPage />} />
              <Route path="workers/:workerId" element={<WorkerDetailPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/new" element={<NewInvoicePage />} />
              <Route path="invoices/new/:projectId" element={<NewInvoicePage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </HashRouter>
  );
}
