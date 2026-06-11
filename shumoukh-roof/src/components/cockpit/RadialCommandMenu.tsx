// القائمة الدائرية السياقية — العنصر المميّز للواجهة الهندسية.
// زر مركزي (الـ Hub) يتفرّع منه قوسٌ من عُقَد التنقّل بحركة ميكانيكية،
// مع خطوط وصل رفيعة مثل أدوات القياس، وإبراز المسار النشط بضوء الليزر.
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Crosshair, Plus, LayoutDashboard, Calculator, FolderOpen,
  FileText, Users, Settings, ShieldCheck, Power,
} from "lucide-react";
import { useT } from "../../i18n";
import { logoutUser } from "../../features/auth/authService";
import { useAuthStore } from "../../store/authStore";

type Node = { to: string; icon: typeof Crosshair; labelKey: string; code: string; adminOnly?: boolean };

const NODES: Node[] = [
  { to: "/", icon: LayoutDashboard, labelKey: "nav.home", code: "00" },
  { to: "/calculator", icon: Calculator, labelKey: "nav.calculator", code: "01" },
  { to: "/projects", icon: FolderOpen, labelKey: "nav.projects", code: "02" },
  { to: "/invoices", icon: FileText, labelKey: "nav.invoices", code: "03" },
  { to: "/workers", icon: Users, labelKey: "nav.workers", code: "04" },
  { to: "/settings", icon: Settings, labelKey: "nav.settings", code: "05" },
  { to: "/admin", icon: ShieldCheck, labelKey: "nav.admin", code: "06", adminOnly: true },
];

const RADIUS = 140;
const ARC_START = 168; // الزاوية اليسرى العليا (درجات)
const ARC_END = 12;    // الزاوية اليمنى العليا

export default function RadialCommandMenu({ isAdmin }: { isAdmin: boolean }) {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  const nodes = isAdmin ? NODES : NODES.filter((n) => !n.adminOnly);

  // إغلاق بـ Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const polar = (i: number, n: number) => {
    const a = n <= 1 ? 90 : ARC_START + ((ARC_END - ARC_START) * i) / (n - 1);
    const rad = (a * Math.PI) / 180;
    return { x: Math.cos(rad) * RADIUS, y: -Math.sin(rad) * RADIUS, angle: a };
  };

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logoutUser();
    logout();
    navigate("/login");
  };

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div
      className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[90] flex flex-col items-center"
      style={{ zIndex: "var(--ck-z-radial)" as unknown as number }}
    >
      {/* ستار خفيف عند الفتح */}
      <AnimatePresence>
        {open && (
          <motion.button
            aria-label={t("common.close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 -z-10 cursor-default"
            style={{
              background: "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(8,9,11,0.82), rgba(8,9,11,0.4) 55%, transparent)",
              backdropFilter: "blur(2px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* العُقَد المتفرّعة + خطوط الوصل */}
      <AnimatePresence>
        {open && (
          <div className="absolute bottom-7 left-1/2 h-0 w-0" aria-hidden={!open}>
            {/* خطوط القياس (SVG) من المركز لكل عقدة */}
            <svg
              className="pointer-events-none absolute left-0 top-0 overflow-visible"
              width="1" height="1"
            >
              {nodes.map((n, i) => {
                const p = polar(i, nodes.length);
                return (
                  <motion.line
                    key={n.to}
                    x1={0} y1={0} x2={p.x} y2={p.y}
                    stroke={isActive(n.to) ? "var(--ck-laser)" : "var(--ck-hair-strong)"}
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
                  />
                );
              })}
            </svg>

            {nodes.map((n, i) => {
              const p = polar(i, nodes.length);
              const active = isActive(n.to);
              const Icon = n.icon;
              // محاذاة عمود التسمية حسب جهة العقدة
              const onRight = p.x > 6;
              return (
                <motion.button
                  key={n.to}
                  onClick={() => go(n.to)}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  animate={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
                  exit={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  transition={{
                    duration: reduce ? 0 : 0.46,
                    delay: reduce ? 0 : 0.03 * i,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: 0, top: 0 }}
                  title={t(n.labelKey)}
                >
                  <span
                    className="relative grid h-12 w-12 place-items-center border transition-colors duration-200"
                    style={{
                      borderRadius: 2,
                      background: active ? "var(--ck-laser-film)" : "var(--ck-steel-hi)",
                      borderColor: active ? "var(--ck-laser)" : "var(--ck-hair-strong)",
                      boxShadow: active ? "0 0 18px var(--ck-laser-glow)" : "none",
                    }}
                  >
                    <Icon
                      className="h-5 w-5 transition-colors"
                      style={{ color: active ? "var(--ck-laser-hot)" : "var(--ck-ink-dim)" }}
                    />
                    {/* كود العقدة بخط الآلة */}
                    <span
                      className="mono absolute -top-1.5 text-[8px] font-bold"
                      style={{ color: active ? "var(--ck-laser)" : "var(--ck-ink-mute)", insetInlineEnd: -2 }}
                    >
                      {n.code}
                    </span>
                  </span>
                  <span
                    className={`mono pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-bold tracking-wide opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
                    style={{
                      color: active ? "var(--ck-laser-hot)" : "var(--ck-ink-dim)",
                      [onRight ? "left" : "right"]: "100%",
                      [onRight ? "marginLeft" : "marginRight"]: "10px",
                    } as React.CSSProperties}
                  >
                    {t(n.labelKey)}
                  </span>
                </motion.button>
              );
            })}

            {/* زر الخروج — يتفرّع لأسفل المركز */}
            <motion.button
              onClick={handleLogout}
              initial={{ y: 0, opacity: 0, scale: 0.4 }}
              animate={{ y: 58, opacity: 1, scale: 1 }}
              exit={{ y: 0, opacity: 0, scale: 0.4 }}
              transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.03 * nodes.length, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-0 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center border"
              style={{ borderRadius: 2, background: "var(--ck-steel)", borderColor: "var(--ck-hair-strong)" }}
              title={t("nav.logout")}
              aria-label={t("nav.logout")}
            >
              <Power className="h-4 w-4" style={{ color: "var(--ck-alert)" }} />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* الـ Hub المركزي — عدسة قياس */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        aria-expanded={open}
        aria-label={t("cockpit.command")}
        className="relative grid h-16 w-16 place-items-center"
        style={{ borderRadius: 3 }}
      >
        {/* حلقة خارجية + علامات قياس دوّارة */}
        <motion.span
          className="absolute inset-0"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: reduce ? 0 : 0.5, ease: [0.7, 0, 0.2, 1] }}
          style={{
            borderRadius: 3,
            border: "1px solid var(--ck-hair-strong)",
            background: "var(--ck-steel)",
            boxShadow: open ? "0 0 28px var(--ck-laser-glow)" : "0 8px 24px rgba(0,0,0,0.5)",
          }}
        />
        <span
          className="absolute inset-[6px] rounded-[2px] border"
          style={{ borderColor: open ? "var(--ck-laser)" : "var(--ck-hair)", transition: "border-color .25s" }}
        />
        {/* الأيقونة: تصويب ↔ زائد */}
        <span className="relative grid place-items-center">
          {open ? (
            <Plus className="h-6 w-6 rotate-45" style={{ color: "var(--ck-laser-hot)" }} />
          ) : (
            <Crosshair className="h-6 w-6" style={{ color: "var(--ck-laser)" }} />
          )}
        </span>
      </motion.button>

      {/* تسمية الـ Hub */}
      <span
        className="mono mt-1 text-[9px] font-bold tracking-[0.2em]"
        style={{ color: open ? "var(--ck-laser)" : "var(--ck-ink-mute)" }}
      >
        {open ? t("cockpit.release") : t("cockpit.command")}
      </span>
    </div>
  );
}
