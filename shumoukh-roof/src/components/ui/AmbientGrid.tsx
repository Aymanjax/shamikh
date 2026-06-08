import { useRef, type MouseEvent, type TouchEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface AmbientGridProps {
  children: React.ReactNode;
}

export default function AmbientGrid({ children }: AmbientGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const sx = useSpring(mx, { stiffness: 40, damping: 30 });
  const sy = useSpring(my, { stiffness: 40, damping: 30 });

  const offsetX = useTransform(sx, [0, 1], [-3, 3]);
  const offsetY = useTransform(sy, [0, 1], [-3, 3]);

  function handleMove(e: MouseEvent) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }

  function handleTouch(e: TouchEvent) {
    if (!ref.current || !e.touches[0]) return;
    const r = ref.current.getBoundingClientRect();
    const t = e.touches[0];
    mx.set((t.clientX - r.left) / r.width);
    my.set((t.clientY - r.top) / r.height);
  }

  function handleLeave() {
    mx.set(0.5);
    my.set(0.5);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onTouchMove={handleTouch}
      onMouseLeave={handleLeave}
      onTouchEnd={handleLeave}
      className="ambient-grid-container"
    >
      <motion.div
        className="ambient-grid-pattern"
        style={{ x: offsetX, y: offsetY }}
        aria-hidden
      />
      {children}
    </div>
  );
}
