import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface CountUpProps {
  to: number;
  decimals?: number;
  className?: string;
}

export default function CountUp({ to, decimals = 0, className = "" }: CountUpProps) {
  const prevRef = useRef(0);
  const spring = useSpring(0, { stiffness: 170, damping: 26, mass: 0.4 });

  useEffect(() => {
    spring.set(to);
    prevRef.current = to;
  }, [to]);

  const display = useTransform(spring, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()
  );

  return (
    <motion.span className={className}>{display}</motion.span>
  );
}
