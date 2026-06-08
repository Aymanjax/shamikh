import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import FloatingCommandBar from "./FloatingCommandBar";
import AmbientGrid from "../ui/AmbientGrid";

export default function AppLayout({ isAdmin }: { isAdmin: boolean }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface-bg flex">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          isAdmin={isAdmin}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((p) => !p)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8">
        <AmbientGrid>
          <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </AmbientGrid>
      </div>

      {/* Mobile bottom nav - hidden on desktop */}
      <div className="md:hidden">
        <FloatingCommandBar isAdmin={isAdmin} />
      </div>
    </div>
  );
}
