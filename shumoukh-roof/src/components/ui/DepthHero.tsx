import { useRef, type ReactNode, type MouseEvent, type TouchEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

interface DepthHeroProps {
  children: ReactNode;
  className?: string;
}

export default function DepthHero({ children, className = "" }: DepthHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 200, damping: 25, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(springY, [0, 1], [3, -3]);
  const rotateY = useTransform(springX, [0, 1], [-3, 3]);

  const shadowX = useTransform(springX, [0, 1], [-6, 6]);
  const shadowY = useTransform(springY, [0, 1], [-6, 6]);
  const shadowBlur = useTransform(springX, [0, 0.5, 1], [18, 6, 18]);

  const boxShadow = useMotionTemplate`${shadowX}px ${shadowY}px ${shadowBlur}px rgba(61, 52, 39, 0.07), 0 1px 2px rgba(61, 52, 39, 0.04)`;

  const parallaxX = useTransform(springX, [0, 1], [3, -3]);
  const parallaxY = useTransform(springY, [0, 1], [3, -3]);

  function handleMouseMove(e: MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  function handleTouchMove(e: TouchEvent) {
    if (!ref.current || e.touches.length === 0) return;
    const rect = ref.current.getBoundingClientRect();
    const touch = e.touches[0];
    mouseX.set((touch.clientX - rect.left) / rect.width);
    mouseY.set((touch.clientY - rect.top) / rect.height);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseLeave}
      className="depth-hero-perspective"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          boxShadow,
        }}
        className={`depth-hero-card ${className}`}
      >
        <motion.div
          style={{ x: parallaxX, y: parallaxY }}
          className="depth-hero-content"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
