import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useTransitionNavigate() {
  const navigate = useNavigate();

  return useCallback(
    (to: string) => {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          navigate(to);
        });
      } else {
        navigate(to);
      }
    },
    [navigate],
  );
}

interface TransitionLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export default function TransitionLink({ to, children, className = "" }: TransitionLinkProps) {
  const transitionNavigate = useTransitionNavigate();

  return (
    <button
      type="button"
      onClick={() => transitionNavigate(to)}
      className={`cursor-pointer text-left ${className}`}
    >
      {children}
    </button>
  );
}
