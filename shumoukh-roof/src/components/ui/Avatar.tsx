import { type HTMLAttributes } from "react";

interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name?: string;
  /** Square side length in px (avatars are sharp 4px tiles, never round). */
  size?: number;
}

function Avatar({ name = "", size = 32, className = "", style, ...rest }: AvatarProps) {
  const initial = name.trim().charAt(0) || "?";
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-[4px] select-none",
        "bg-olive-100 text-olive-700 font-black",
        className,
      ].join(" ")}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), ...style }}
      title={name}
      {...rest}
    >
      {initial}
    </span>
  );
}

export default Avatar;
