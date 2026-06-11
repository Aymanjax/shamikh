import { type ElementType, type HTMLAttributes } from "react";

type CardAccent = "terracotta" | "olive" | "amber" | "red";

interface CardProps extends HTMLAttributes<HTMLElement> {
  accent?: CardAccent;
  interactive?: boolean;
  as?: ElementType;
}

const accentVar: Record<CardAccent, string> = {
  terracotta: "var(--accent-terracotta)",
  olive: "var(--accent-olive)",
  amber: "var(--accent-amber)",
  red: "var(--accent-red)",
};

// The Shumoukh card signature: white surface, 1px earth border, 3px accent
// right-edge (the RTL inside edge). Reuses the shared `.earth-card` base.
function Card({
  accent = "terracotta",
  interactive = false,
  as,
  className = "",
  style,
  children,
  ...rest
}: CardProps) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={[
        "earth-card p-4",
        interactive ? "cursor-pointer transition-transform duration-150 hover:-translate-y-0.5" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderRightColor: accentVar[accent], ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Card;
