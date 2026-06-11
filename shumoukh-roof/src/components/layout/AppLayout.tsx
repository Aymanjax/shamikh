import { Outlet } from "react-router-dom";
import CockpitShell from "../cockpit/CockpitShell";

// القشرة الهندسية هي التخطيط الأساسي لكل الصفحات:
// لوحة مركزية + قائمة دائرية للتنقل، بلا شريط جانبي.
export default function AppLayout({ isAdmin }: { isAdmin: boolean }) {
  return (
    <CockpitShell isAdmin={isAdmin}>
      <Outlet />
    </CockpitShell>
  );
}
