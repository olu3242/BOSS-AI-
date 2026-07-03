import type { HTMLAttributes, ReactNode } from "react";

type Padding = "sm" | "md" | "lg";

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  hoverable?: boolean;
  children: ReactNode;
}

const PADDING: Record<Padding, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ padding = "md", hoverable = false, children, className = "", ...rest }: Props) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface ${PADDING[padding]} ${
        hoverable ? "transition-colors duration-fast hover:border-border-strong hover:bg-elevated" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
