import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)] hover:bg-[var(--color-primary-strong)]",
  secondary:
    "bg-[var(--color-secondary-soft)] text-[var(--color-secondary-strong)] hover:bg-[var(--color-secondary-muted)]",
  ghost:
    "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]",
  outline:
    "border border-[var(--color-border-strong)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-[var(--radius-sm)] px-3 text-sm",
  md: "h-11 rounded-[var(--radius-md)] px-4 text-sm",
  lg: "h-12 rounded-[var(--radius-md)] px-5 text-base"
};

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  leadingIcon,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition duration-200 ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:pointer-events-none disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      type={type}
      {...props}
    >
      {leadingIcon}
      {children}
    </button>
  );
}
