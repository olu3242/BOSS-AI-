import type { ReactNode } from "react";

type Color = "green" | "yellow" | "red" | "blue" | "purple" | "neutral";
type Size = "sm" | "md";

interface Props {
  color?: Color;
  size?: Size;
  children: ReactNode;
  className?: string;
}

const COLORS: Record<Color, string> = {
  green:   "bg-status-success-bg text-status-success",
  yellow:  "bg-status-warning-bg text-status-warning",
  red:     "bg-status-danger-bg text-status-danger",
  blue:    "bg-status-info-bg text-status-info",
  purple:  "bg-purple-950/40 text-purple-400",
  neutral: "bg-elevated text-text-secondary",
};

const SIZES: Record<Size, string> = {
  sm: "px-2 py-0.5 text-2xs",
  md: "px-2.5 py-0.5 text-xs",
};

export function Badge({ color = "neutral", size = "md", children, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium capitalize ${COLORS[color]} ${SIZES[size]} ${className}`}>
      {children}
    </span>
  );
}
