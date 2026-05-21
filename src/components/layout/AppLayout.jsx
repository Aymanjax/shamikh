import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuthStore } from "../../store/authStore";

export default function AppLayout() {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-[#020617]">
      <Sidebar user={user} />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
